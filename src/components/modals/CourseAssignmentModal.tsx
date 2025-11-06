import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import BaseModal from './BaseModal';
import { useCourseAssignments } from '../../hooks/useCourseAssignments';
import { useAddCourseToModule, useRemoveCourseFromModule } from '../../hooks/useIndividualAssignments';
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

  // React Query hooks
  const { data: courseAssignments, isLoading, error } = useCourseAssignments(moduleId);
  const addCourseToModule = useAddCourseToModule();
  const removeCourseFromModule = useRemoveCourseFromModule();

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
      updateAssignedState(prev => {
        const next = prev.slice();
        const [moved] = next.splice(source.index, 1);
        if (moved) {
          next.splice(destination.index, 0, moved);
        }
        return next;
      });
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
    } catch (error) {
      // Rollback UI changes on error
      if (source.droppableId === 'assigned' && destination.droppableId === 'unassigned') {
        updateAssignedState(prev => [...prev, course]);
        setUnassignedCourses(prev => prev.filter(c => c.id !== courseId));
      } else if (source.droppableId === 'unassigned' && destination.droppableId === 'assigned') {
        setUnassignedCourses(prev => [...prev, course]);
        updateAssignedState(prev => prev.filter(c => c.id !== courseId));
      }
      console.error('Failed to update course assignment:', error);
    } finally {
      setIsMutationLoading(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    onClose();
  };


  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title={`Manage Courses for ${moduleTitle}`}>
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
                      } ${isMutationLoading ? 'opacity-60 pointer-events-none' : ''}`}
                    >
                      {unassignedCourses.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          No available courses
                        </div>
                      ) : (
                        unassignedCourses.map((course, index) => (
                          <Draggable key={course.id} draggableId={course.id.toString()} index={index} isDragDisabled={isMutationLoading}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`mb-2 p-3 bg-white border border-gray-200 rounded-md shadow-sm cursor-move transition-shadow ${
                                  snapshot.isDragging ? 'shadow-lg' : 'hover:shadow-md'
                                }`}
                              >
                                <div className="flex items-center">
                                  <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                  </svg>
                                  <span className="text-sm font-medium text-gray-900">{course.title}</span>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))
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
                      } ${isMutationLoading ? 'opacity-60 pointer-events-none' : ''}`}
                    >
                      {assignedCourses.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          No assigned courses
                        </div>
                      ) : (
                        assignedCourses.map((course, index) => (
                          <Draggable key={course.id} draggableId={course.id.toString()} index={index} isDragDisabled={isMutationLoading}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`mb-2 p-3 bg-white border border-gray-200 rounded-md shadow-sm cursor-move transition-shadow ${
                                  snapshot.isDragging ? 'shadow-lg' : 'hover:shadow-md'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        ))
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
    </BaseModal>
  );
};

export default CourseAssignmentModal;
