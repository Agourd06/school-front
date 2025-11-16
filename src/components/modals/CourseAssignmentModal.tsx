import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import BaseModal from './BaseModal';
import DescriptionModal from './DescriptionModal';
import DeleteModal from './DeleteModal';
import { useCourseAssignments } from '../../hooks/useCourseAssignments';
import { useAddCourseToModule, useRemoveCourseFromModule, useReorderCourseInModule } from '../../hooks/useIndividualAssignments';
import { useUpdateModuleCourse } from '../../hooks/useModuleCourse';
import { useCourse } from '../../hooks/useCourses';
import { useModule } from '../../hooks/useModules';
import { DeleteButton } from '../ui';
import type { Course as CourseEntity } from '../../api/course';

// Import DropResult type separately
import type { DropResult } from '@hello-pangea/dnd';

type AssignmentCourse = CourseEntity & {
  tri?: number;
  assignment_created_at?: string;
  assignment_volume?: number | null;
  assignment_coefficient?: number | null;
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
  const [loadingItemId, setLoadingItemId] = useState<number | null>(null);
  const [descriptionModal, setDescriptionModal] = useState<{ title: string; description: string } | null>(null);

  // Edit course assignment (coefficient and volume)
  const [editingCourse, setEditingCourse] = useState<AssignmentCourse | null>(null);
  const [editFormData, setEditFormData] = useState({ volume: "", coefficient: "" });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<AssignmentCourse | null>(null);

  // React Query hooks
  const { data: courseAssignments, isLoading, error, refetch: refetchAssignments } = useCourseAssignments(moduleId);
  const addCourseToModule = useAddCourseToModule();
  const removeCourseFromModule = useRemoveCourseFromModule();
  const reorderCourseInModule = useReorderCourseInModule();
  const updateModuleCourse = useUpdateModuleCourse();
  
  // Track which course's details to show
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const { data: selectedCourse } = useCourse(selectedCourseId || 0);

  // Fetch module data for details
  const { data: module } = useModule(moduleId);
  const [moduleDescriptionModal, setModuleDescriptionModal] = useState(false);

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

  const updateAssignedState = (updater: (current: AssignmentCourse[]) => AssignmentCourse[]) => {
    setAssignedCourses(prev => normalizeAssigned(updater(prev)));
  };


  // Handle drag end - only allow dragging from unassigned to assigned
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // If dropped outside a droppable area
    if (!destination) return;

    // Prevent dragging from assigned to unassigned or reordering within assigned
    if (source.droppableId === "assigned") {
      return; // Assigned courses cannot be dragged - use delete button instead
    }

    // If dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const courseId = parseInt(draggableId);
    const course = unassignedCourses.find((c) => c.id === courseId);

    if (!course) return;

    // Only allow dragging from unassigned to assigned
    if (
      source.droppableId === "unassigned" &&
      destination.droppableId === "assigned"
    ) {
      // Optimistically update the UI first
      setUnassignedCourses((prev) => prev.filter((c) => c.id !== courseId));
      updateAssignedState((prev) => [
        ...prev,
        { 
          ...course, 
          assignment_created_at: new Date().toISOString(),
          assignment_volume: module?.volume ?? null,
          assignment_coefficient: module?.coefficient ?? null,
        },
      ]);

      // Call API to add course to module with volume and coefficient from the module
      try {
        setLoadingItemId(courseId);
        await addCourseToModule.mutateAsync({
          moduleId,
          courseId,
          volume: module?.volume ?? null,
          coefficient: module?.coefficient ?? null,
        });
        // Wait a bit for cache invalidation to propagate, then refetch
        await new Promise((resolve) => setTimeout(resolve, 100));
        await refetchAssignments();
      } catch (error: any) {
        // Check if the error is because the course is already assigned (409)
        // The API layer should handle restoration of soft-deleted relationships
        // If we still get a 409 error here, it means the relationship exists and is active
        if (error?.response?.status === 409) {
          // The relationship already exists and is active
          // Just refetch to ensure UI is in sync, don't show error
          await refetchAssignments();
          setLoadingItemId(null);
          return;
        }

        // Rollback UI changes on error
        setUnassignedCourses((prev) => [...prev, course]);
        updateAssignedState((prev) => prev.filter((c) => c.id !== courseId));
        console.error("Failed to add course to module:", error);

        // Show user-friendly error message for other errors
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          "Failed to add course to module";
        if (error?.response?.status === 404) {
          alert("Relationship not found. Please refresh and try again.");
        } else {
          alert(`Error: ${errorMessage}`);
        }
      } finally {
        setLoadingItemId(null);
      }
    } else if (
      source.droppableId === "unassigned" &&
      destination.droppableId === "unassigned"
    ) {
      // Allow reordering within unassigned list (just UI, no API call)
      setUnassignedCourses((prev) => {
        const next = prev.slice();
        const [moved] = next.splice(source.index, 1);
        if (moved) {
          next.splice(destination.index, 0, moved);
        }
        return next;
      });
    }
  };

  // Handle delete button click - open delete modal
  const handleDeleteCourseClick = (course: AssignmentCourse, e: React.MouseEvent) => {
    e.stopPropagation();
    setCourseToDelete(course);
    setDeleteModalOpen(true);
  };

  // Handle delete confirmation (soft delete - sets status to -2)
  const handleConfirmDelete = async () => {
    if (!courseToDelete) return;

    // Optimistically remove from UI
    updateAssignedState((prev) => prev.filter((c) => c.id !== courseToDelete.id));

    try {
      setLoadingItemId(courseToDelete.id);
      // This will soft delete (set status to -2) instead of hard delete
      await removeCourseFromModule.mutateAsync({
        moduleId,
        courseId: courseToDelete.id,
      });
      // Wait a bit for cache invalidation to propagate, then refetch
      await new Promise((resolve) => setTimeout(resolve, 100));
      await refetchAssignments();
      setDeleteModalOpen(false);
      setCourseToDelete(null);
    } catch (error: any) {
      // Rollback on error
      updateAssignedState((prev) => [...prev, courseToDelete]);
      console.error("Failed to remove course from module:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to remove course from module";
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoadingItemId(null);
    }
  };

  // Handle delete modal cancel
  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setCourseToDelete(null);
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

  const handleShowModuleDetails = () => {
    if (module) {
      setModuleDescriptionModal(true);
    }
  };

  const stripHtml = (input?: string | null): string => {
    if (!input) return '';
    return input.replace(/<[^>]+>/g, '');
  };

  const hasModuleDescription = module && !!stripHtml(module.description ?? '');

  const handleOpenEditCourse = (course: AssignmentCourse, e: React.MouseEvent) => {
    e.stopPropagation();
    // Edit volume and coefficient from the module-course relationship table
    // These values are module-specific and stored in the module-course relationship, not the original course
    setEditingCourse(course);
    setEditFormData({
      volume: course.assignment_volume !== null && course.assignment_volume !== undefined ? course.assignment_volume.toString() : "",
      coefficient: course.assignment_coefficient !== null && course.assignment_coefficient !== undefined ? course.assignment_coefficient.toString() : "",
    });
    setEditErrors({});
  };

  const handleCloseEditCourse = () => {
    setEditingCourse(null);
    setEditFormData({ volume: "", coefficient: "" });
    setEditErrors({});
  };

  const validateEditForm = () => {
    const newErrors: Record<string, string> = {};

    if (editFormData.volume && (isNaN(Number(editFormData.volume)) || Number(editFormData.volume) < 0)) {
      newErrors.volume = "Volume must be a positive number";
    }

    if (editFormData.coefficient && (isNaN(Number(editFormData.coefficient)) || Number(editFormData.coefficient) < 0)) {
      newErrors.coefficient = "Coefficient must be a positive number";
    }

    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveCourseEdit = async () => {
    if (!editingCourse || !validateEditForm()) return;

    const newVolume = editFormData.volume ? Number(editFormData.volume) : null;
    const newCoefficient = editFormData.coefficient ? Number(editFormData.coefficient) : null;

    // Optimistically update the local state immediately
    updateAssignedState((prev) =>
      prev.map((c) =>
        c.id === editingCourse.id
          ? {
              ...c,
              assignment_volume: newVolume,
              assignment_coefficient: newCoefficient,
              volume: newVolume ?? undefined,
              coefficient: newCoefficient ?? undefined,
            }
          : c
      )
    );

    try {
      // Update the module-course relationship table (not the original course)
      // This updates volume and coefficient specific to this module-course assignment
      await updateModuleCourse.mutateAsync({
        moduleId: moduleId,
        courseId: editingCourse.id,
        data: {
          volume: newVolume,
          coefficient: newCoefficient,
        },
      });
      handleCloseEditCourse();
      // Refetch to ensure we have the latest data from the server
      await refetchAssignments();
    } catch (error: any) {
      console.error("Failed to update course assignment:", error);
      // Rollback on error - refetch to get the correct state
      await refetchAssignments();
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to update course assignment";
      alert(`Error: ${errorMessage}`);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span>Module to course: Manage Courses for Module ( {moduleTitle} )</span>
              {/* Display module volume and coefficient if available */}
              {(module?.volume !== null && module?.volume !== undefined) ||
              (module?.coefficient !== null && module?.coefficient !== undefined) ? (
                <span className="text-xs text-gray-600">
                  (
                  {module?.volume !== null && module?.volume !== undefined && (
                    <span>Volume: <span className="font-medium text-gray-900">{module.volume}</span></span>
                  )}
                  {module?.volume !== null && module?.volume !== undefined && 
                   module?.coefficient !== null && module?.coefficient !== undefined && (
                    <span className="mx-1">•</span>
                  )}
                  {module?.coefficient !== null && module?.coefficient !== undefined && (
                    <span>Coefficient: <span className="font-medium text-gray-900">{module.coefficient}</span></span>
                  )}
                  )
                </span>
              ) : null}
            </div>
            {hasModuleDescription && (
              <button
                type="button"
                onClick={handleShowModuleDetails}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
               
              </button>
            )}
          </div>
        </div>
      }
    >
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
                                  <div className="flex items-center gap-2 flex-1">
                                    <svg
                                      className="w-4 h-4 text-gray-400 cursor-pointer hover:text-blue-600 flex-shrink-0"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                      onClick={(e) => handleShowCourseDetails(e, course.id)}
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                      />
                                    </svg>
                                    <div className="flex-1">
                                      <span className="text-sm font-medium text-gray-900">{course.title}</span>
                                      {/* Display volume and coefficient if available */}
                                      {(course.volume !== null && course.volume !== undefined) ||
                                      (course.coefficient !== null && course.coefficient !== undefined) ? (
                                        <div className="mt-1 flex items-center gap-4 text-xs text-gray-600">
                                          {course.volume !== null && course.volume !== undefined && (
                                            <span>Volume: <span className="font-medium text-gray-900">{course.volume}</span></span>
                                          )}
                                          {course.coefficient !== null && course.coefficient !== undefined && (
                                            <span>Coefficient: <span className="font-medium text-gray-900">{course.coefficient}</span></span>
                                          )}
                                        </div>
                                      ) : null}
                                    </div>
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
                  {moduleTitle} assigned to <span className="font-medium text-red-600">{assignedCourses.length}</span> Courses
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
                            <Draggable key={course.id} draggableId={course.id.toString()} index={index} isDragDisabled={true}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`mb-2 p-3 bg-white border border-gray-200 rounded-md shadow-sm transition-shadow relative ${
                                    snapshot.isDragging ? 'shadow-lg' : 'hover:shadow-md'
                                  } ${isItemLoading ? 'opacity-50' : ''}`}
                                >
                                  {isItemLoading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-md z-10">
                                      <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                                    </div>
                                  )}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <svg
                                        className="w-4 h-4 text-gray-400 cursor-pointer hover:text-blue-600 flex-shrink-0 mt-0.5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        onClick={(e) => handleShowCourseDetails(e, course.id)}
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                      </svg>
                                      <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">{course.title}</p>
                                        {/* Display volume and coefficient before the date */}
                                        {(course.assignment_volume !== null && course.assignment_volume !== undefined) ||
                                        (course.assignment_coefficient !== null && course.assignment_coefficient !== undefined) ? (
                                          <div className="mt-1 flex items-center gap-4 text-xs text-gray-600">
                                            {course.assignment_volume !== null && course.assignment_volume !== undefined && (
                                              <span>Volume: <span className="font-medium text-gray-900">{course.assignment_volume}</span></span>
                                            )}
                                            {course.assignment_coefficient !== null && course.assignment_coefficient !== undefined && (
                                              <span>Coefficient: <span className="font-medium text-gray-900">{course.assignment_coefficient}</span></span>
                                            )}
                                          </div>
                                        ) : null}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={(e) => handleOpenEditCourse(course, e)}
                                        className="inline-flex items-center justify-center w-6 h-6 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        title="Edit volume and coefficient"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                      </button>
                                      <DeleteButton
                                        onClick={(e) => handleDeleteCourseClick(course, e)}
                                        disabled={isAnyMutationPending}
                                        title="Remove course from module (soft delete)"
                                        className="w-6 h-6 px-0 py-0"
                                      />
                                    </div>
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

      {moduleDescriptionModal && module && (
        <DescriptionModal
          isOpen
          onClose={() => setModuleDescriptionModal(false)}
          title={module.title || `Module #${moduleId}`}
          description={module.description ?? ''}
          type="module"
        />
      )}

      <DeleteModal
        isOpen={deleteModalOpen}
        title="Remove Course from Module"
        entityName={courseToDelete?.title}
        message={`Are you sure you want to remove "${courseToDelete?.title}" from this module? This will soft delete the assignment.`}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isLoading={removeCourseFromModule.isPending || loadingItemId !== null}
      />

      {editingCourse && (
        <BaseModal
          isOpen
          onClose={handleCloseEditCourse}
          title={`Edit Course: ${editingCourse.title}`}
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="edit-volume"
                className="block text-sm font-medium text-gray-700"
              >
                Volume (optional)
              </label>
              <input
                type="number"
                id="edit-volume"
                value={editFormData.volume}
                onChange={(e) => {
                  setEditFormData((prev) => ({ ...prev, volume: e.target.value }));
                  if (editErrors.volume) {
                    setEditErrors((prev) => ({ ...prev, volume: "" }));
                  }
                }}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  editErrors.volume ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Enter volume"
              />
              {editErrors.volume && (
                <p className="mt-1 text-sm text-red-600">{editErrors.volume}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="edit-coefficient"
                className="block text-sm font-medium text-gray-700"
              >
                Coefficient (optional)
              </label>
              <input
                type="number"
                step="0.1"
                id="edit-coefficient"
                value={editFormData.coefficient}
                onChange={(e) => {
                  setEditFormData((prev) => ({ ...prev, coefficient: e.target.value }));
                  if (editErrors.coefficient) {
                    setEditErrors((prev) => ({ ...prev, coefficient: "" }));
                  }
                }}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  editErrors.coefficient ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Enter coefficient"
              />
              {editErrors.coefficient && (
                <p className="mt-1 text-sm text-red-600">{editErrors.coefficient}</p>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleCloseEditCourse}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCourseEdit}
                disabled={updateModuleCourse.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {updateModuleCourse.isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </BaseModal>
      )}
    </BaseModal>
  );
};

export default CourseAssignmentModal;
