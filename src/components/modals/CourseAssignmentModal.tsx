import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import BaseModal from './BaseModal';
import DescriptionModal from './DescriptionModal';
import { useCourseAssignments } from '../../hooks/useCourseAssignments';
import { useAddCourseToModule, useRemoveCourseFromModule, useReorderCourseInModule } from '../../hooks/useIndividualAssignments';
import { useCourse } from '../../hooks/useCourses';
import type { Course as CourseEntity } from '../../api/course';

// Import DropResult type separately
import type { DropResult } from '@hello-pangea/dnd';

type AssignmentCourse = CourseEntity & {
  tri?: number;
  assignment_created_at?: string;
};

interface CourseAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: number;
  moduleTitle: string;
}

const CourseAssignmentModal: React.FC<CourseAssignmentModalProps> = ({
  isOpen,
  onClose,
  moduleId,
  moduleTitle
}) => {
  const [assignedCourses, setAssignedCourses] = useState<AssignmentCourse[]>([]);
  const [unassignedCourses, setUnassignedCourses] = useState<AssignmentCourse[]>([]);
  const [isMutationLoading, setIsMutationLoading] = useState(false);
  const [loadingItemId, setLoadingItemId] = useState<number | null>(null);
  const [descriptionModal, setDescriptionModal] = useState<{ title: string; description: string } | null>(null);

  // React Query hooks
  const { data: courseAssignments, isLoading, error, refetch: refetchAssignments } = useCourseAssignments(moduleId);
  const addCourseToModule = useAddCourseToModule();
  const removeCourseFromModule = useRemoveCourseFromModule();
  const reorderCourseInModule = useReorderCourseInModule();
  
  // Track which course's details to show
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const { data: selectedCourse } = useCourse(selectedCourseId || 0);

  // Check if any mutation is pending
  const isAnyMutationPending = addCourseToModule.isPending || removeCourseFromModule.isPending || reorderCourseInModule.isPending;

  // Initialize local state when data changes
  const normalizeAssigned = (items: AssignmentCourse[] = []) =>
    items
      .slice()
      .sort((a, b) => (a.tri ?? Number.MAX_SAFE_INTEGER) - (b.tri ?? Number.MAX_SAFE_INTEGER))
      .map((item, index) => ({ ...item, tri: index }));

  useEffect(() => {
    if (courseAssignments) {
      setAssignedCourses(normalizeAssigned(courseAssignments.assigned || []));
      setUnassignedCourses(courseAssignments.unassigned || []);
    }
  }, [courseAssignments]);

  const formatTimestamp = (value?: string) => {
    if (!value) return '—';
    try {
      return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(value));
    } catch (e) {
      return value;
    }
  };

  const updateAssignedState = (updater: (current: AssignmentCourse[]) => AssignmentCourse[]) => {
    setAssignedCourses(prev => normalizeAssigned(updater(prev)));
  };


  // Handle drag end
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // If dropped outside a droppable area
    if (!destination) return;

    // If dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const courseId = parseInt(draggableId);
    const course = source.droppableId === 'assigned' 
      ? assignedCourses.find(c => c.id === courseId)
      : unassignedCourses.find(c => c.id === courseId);

    if (!course) return;

    // Optimistically update the UI first
    if (source.droppableId === 'assigned' && destination.droppableId === 'unassigned') {
      // Moving from assigned to unassigned
      updateAssignedState(prev => prev.filter(c => c.id !== courseId));
      setUnassignedCourses(prev => [...prev, course]);
    } else if (source.droppableId === 'unassigned' && destination.droppableId === 'assigned') {
      // Moving from unassigned to assigned
      setUnassignedCourses(prev => prev.filter(c => c.id !== courseId));
      updateAssignedState(prev => [...prev, { ...course, assignment_created_at: new Date().toISOString() }]);
    } else if (source.droppableId === 'assigned' && destination.droppableId === 'assigned') {
      // Reordering within assigned list - update tri values
      // Only reorder if the relationship exists (course is already assigned)
      const existingCourse = assignedCourses.find(c => c.id === courseId);
      if (!existingCourse) {
        console.warn('Cannot reorder: course not found in assigned list');
        return;
      }

      updateAssignedState(prev => {
        const next = prev.slice();
        const [moved] = next.splice(source.index, 1);
        if (moved) {
          next.splice(destination.index, 0, moved);
        }
        return next;
      });
      
      // Call API to update tri value
      try {
        setIsMutationLoading(true);
        setLoadingItemId(courseId);
        await reorderCourseInModule.mutateAsync({
          courseId: courseId, // The course being reordered
          moduleId: moduleId,  // The module it belongs to
          tri: destination.index,
        });
        // Wait a bit for cache invalidation to propagate, then refetch
        await new Promise(resolve => setTimeout(resolve, 100));
        await refetchAssignments();
      } catch (error: any) {
        console.error('Failed to reorder course:', error);
        // Rollback on error - reload from server
        if (courseAssignments) {
          setAssignedCourses(normalizeAssigned(courseAssignments.assigned || []));
        }
        // Show error message if it's a 404 (relationship not found)
        if (error?.response?.status === 404) {
          alert('Cannot reorder: Course-module relationship not found. Please refresh and try again.');
        }
      } finally {
        setIsMutationLoading(false);
        setLoadingItemId(null);
      }
      return;
    } else if (source.droppableId === 'unassigned' && destination.droppableId === 'unassigned') {
      setUnassignedCourses(prev => {
        const next = prev.slice();
        const [moved] = next.splice(source.index, 1);
        if (moved) {
          next.splice(destination.index, 0, moved);
        }
        return next;
      });
      return;
    }

    // Immediately call the API using individual endpoints
    try {
      setIsMutationLoading(true);
      setLoadingItemId(courseId);
      if (source.droppableId === 'assigned' && destination.droppableId === 'unassigned') {
        // Remove course from module
        await removeCourseFromModule.mutateAsync({
          moduleId,
          courseId
        });
      } else if (source.droppableId === 'unassigned' && destination.droppableId === 'assigned') {
        // Add course to module
        await addCourseToModule.mutateAsync({
          moduleId,
          courseId
        });
      }
      // Wait a bit for cache invalidation to propagate, then refetch
      await new Promise(resolve => setTimeout(resolve, 100));
      await refetchAssignments();
    } catch (error: any) {
      // Rollback UI changes on error
      if (source.droppableId === 'assigned' && destination.droppableId === 'unassigned') {
        updateAssignedState(prev => [...prev, course]);
        setUnassignedCourses(prev => prev.filter(c => c.id !== courseId));
      } else if (source.droppableId === 'unassigned' && destination.droppableId === 'assigned') {
        setUnassignedCourses(prev => [...prev, course]);
        updateAssignedState(prev => prev.filter(c => c.id !== courseId));
      }
      console.error('Failed to update course assignment:', error);
      
      // Show user-friendly error message
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update assignment';
      if (error?.response?.status === 404) {
        alert('Relationship not found. Please refresh and try again.');
      } else if (error?.response?.status === 409) {
        alert('This course is already assigned to this module.');
      } else {
        alert(`Error: ${errorMessage}`);
      }
    } finally {
      setIsMutationLoading(false);
      setLoadingItemId(null);
    }
  };

  // Handle modal close
  const handleClose = () => {
    onClose();
  };

  // Handle showing course details
  const handleShowCourseDetails = (e: React.MouseEvent, courseId: number) => {
    e.stopPropagation();
    setSelectedCourseId(courseId);
  };

  // Show description modal when course data is loaded
  useEffect(() => {
    if (selectedCourse && selectedCourseId) {
      setDescriptionModal({
        title: selectedCourse.title || `Course #${selectedCourseId}`,
        description: selectedCourse.description ?? '',
      });
      setSelectedCourseId(null); // Reset after showing
    }
  }, [selectedCourse, selectedCourseId]);


  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title={`Manage Courses for Module ( ${moduleTitle} )`}>
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <span className="ml-2 text-gray-600">Loading courses...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error?.message || 'An error occurred'}</div>
                <div className="mt-4">
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-red-100 text-red-800 px-3 py-1 rounded-md text-sm hover:bg-red-200"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-2 gap-6">
              {/* Unassigned Courses */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Available Courses ({unassignedCourses.length})
                </h3>
                <Droppable droppableId="unassigned">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[300px] p-4 border-2 border-dashed rounded-lg transition-colors ${
                        snapshot.isDraggingOver
                          ? 'border-blue-400 bg-blue-50'
                          : 'border-gray-300 bg-gray-50'
                      } ${isAnyMutationPending ? 'opacity-60 pointer-events-none' : ''}`}
                    >
                      {unassignedCourses.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          No available courses
                        </div>
                      ) : (
                        unassignedCourses.map((course, index) => {
                          const isItemLoading = loadingItemId === course.id;
                          return (
                            <Draggable key={course.id} draggableId={course.id.toString()} index={index} isDragDisabled={isAnyMutationPending}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`mb-2 p-3 bg-white border border-gray-200 rounded-md shadow-sm cursor-move transition-shadow relative ${
                                    snapshot.isDragging ? 'shadow-lg' : 'hover:shadow-md'
                                  } ${isItemLoading ? 'opacity-50' : ''}`}
                                >
                                  {isItemLoading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-md">
                                      <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                                    </div>
                                  )}
                                  <div className="flex items-center">
                                    <svg 
                                      className="h-4 w-4 text-gray-400 mr-2 cursor-pointer hover:text-blue-600" 
                                      fill="none" 
                                      stroke="currentColor" 
                                      viewBox="0 0 24 24"
                                      onClick={(e) => handleShowCourseDetails(e, course.id)}
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-900">{course.title}</span>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>

              {/* Assigned Courses */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Assigned Courses ({assignedCourses.length})
                </h3>
                <Droppable droppableId="assigned">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[300px] p-4 border-2 border-dashed rounded-lg transition-colors ${
                        snapshot.isDraggingOver
                          ? 'border-green-400 bg-green-50'
                          : 'border-gray-300 bg-gray-50'
                      } ${isAnyMutationPending ? 'opacity-60 pointer-events-none' : ''}`}
                    >
                      {assignedCourses.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          No assigned courses
                        </div>
                      ) : (
                        assignedCourses.map((course, index) => {
                          const isItemLoading = loadingItemId === course.id;
                          return (
                            <Draggable key={course.id} draggableId={course.id.toString()} index={index} isDragDisabled={isAnyMutationPending}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`mb-2 p-3 bg-white border border-gray-200 rounded-md shadow-sm cursor-move transition-shadow relative ${
                                    snapshot.isDragging ? 'shadow-lg' : 'hover:shadow-md'
                                  } ${isItemLoading ? 'opacity-50' : ''}`}
                                >
                                  {isItemLoading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-md z-10">
                                      <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                                    </div>
                                  )}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                      <svg 
                                        className="h-4 w-4 text-gray-400 mr-2 cursor-pointer hover:text-blue-600" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                        onClick={(e) => handleShowCourseDetails(e, course.id)}
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                      </svg>
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">{course.title}</p>
                                        <p className="text-xs text-gray-500">Added: {formatTimestamp(course.assignment_created_at)}</p>
                                      </div>
                                    </div>
                                    <span className="ml-3 text-xs font-semibold text-gray-500">#{(course.tri ?? index) + 1}</span>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end items-center mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Close
              </button>
            </div>
          </DragDropContext>
        )}
      </div>

      {descriptionModal && (
        <DescriptionModal
          isOpen
          onClose={() => {
            setDescriptionModal(null);
            setSelectedCourseId(null);
          }}
          title={descriptionModal.title}
          description={descriptionModal.description}
          type="course"
        />
      )}
    </BaseModal>
  );
};

export default CourseAssignmentModal;
