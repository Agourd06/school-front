import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import BaseModal from "./BaseModal";
import DescriptionModal from "./DescriptionModal";
import DeleteModal from "./DeleteModal";
import { useModuleAssignments } from "../../hooks/useModuleAssignments";
import {
  useAddModuleToCourse,
  useRemoveModuleFromCourse,
  useReorderModuleInCourse,
} from "../../hooks/useIndividualAssignments";
import { useUpdateModuleCourse } from "../../hooks/useModuleCourse";
import { useModule } from "../../hooks/useModules";
import { useCourse } from "../../hooks/useCourses";
import { DeleteButton } from "../ui";
import type { Module as ModuleEntity } from "../../api/module";

// Import DropResult type separately
import type { DropResult } from "@hello-pangea/dnd";

type AssignmentModule = ModuleEntity & {
  tri?: number;
  assignment_created_at?: string;
  assignment_volume?: number | null;
  assignment_coefficient?: number | null;
};

interface ModuleAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: number;
  courseTitle: string;
}

const ModuleAssignmentModal: React.FC<ModuleAssignmentModalProps> = ({
  isOpen,
  onClose,
  courseId,
  courseTitle,
}) => {
  const [assignedModules, setAssignedModules] = useState<AssignmentModule[]>(
    []
  );
  const [unassignedModules, setUnassignedModules] = useState<
    AssignmentModule[]
  >([]);
  const [loadingItemId, setLoadingItemId] = useState<number | null>(null);
  const [descriptionModal, setDescriptionModal] = useState<{
    title: string;
    description: string;
  } | null>(null);

  // React Query hooks
  const {
    data: moduleAssignments,
    isLoading,
    error,
    refetch: refetchAssignments,
  } = useModuleAssignments(courseId);
  const addModuleToCourse = useAddModuleToCourse();
  const removeModuleFromCourse = useRemoveModuleFromCourse();
  const reorderModuleInCourse = useReorderModuleInCourse();
  const updateModuleCourse = useUpdateModuleCourse();

  // Track which module's details to show
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const { data: selectedModule } = useModule(selectedModuleId || 0);

  // Fetch course data for details
  const { data: course } = useCourse(courseId);
  const [courseDescriptionModal, setCourseDescriptionModal] = useState(false);

  // Edit module assignment (coefficient and volume)
  const [editingModule, setEditingModule] = useState<AssignmentModule | null>(null);
  const [editFormData, setEditFormData] = useState({ volume: "", coefficient: "" });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState<AssignmentModule | null>(null);

  // Check if any mutation is pending
  const isAnyMutationPending =
    addModuleToCourse.isPending ||
    removeModuleFromCourse.isPending ||
    reorderModuleInCourse.isPending;

  // Initialize local state when data changes
  const normalizeAssigned = (items: AssignmentModule[] = []) =>
    items
      .slice()
      .sort(
        (a, b) =>
          (a.tri ?? Number.MAX_SAFE_INTEGER) -
          (b.tri ?? Number.MAX_SAFE_INTEGER)
      )
      .map((item, index) => ({ ...item, tri: index }));

  useEffect(() => {
    if (moduleAssignments) {
      setAssignedModules(normalizeAssigned(moduleAssignments.assigned || []));
      setUnassignedModules(moduleAssignments.unassigned || []);
    }
  }, [moduleAssignments]);

  const formatTimestamp = (value?: string) => {
    if (!value) return "—";
    try {
      return new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value));
    } catch (e) {
      return value;
    }
  };

  const updateAssignedState = (
    updater: (current: AssignmentModule[]) => AssignmentModule[]
  ) => {
    setAssignedModules((prev) => normalizeAssigned(updater(prev)));
  };

  // Handle drag end - only allow dragging from unassigned to assigned
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // If dropped outside a droppable area
    if (!destination) return;

    // Prevent dragging from assigned to unassigned or reordering within assigned
    if (source.droppableId === "assigned") {
      return; // Assigned modules cannot be dragged - use delete button instead
    }

    // If dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const moduleId = parseInt(draggableId);
    const module = unassignedModules.find((m) => m.id === moduleId);

    if (!module) return;

    // Only allow dragging from unassigned to assigned
    if (
      source.droppableId === "unassigned" &&
      destination.droppableId === "assigned"
    ) {
      // Optimistically update the UI first
      setUnassignedModules((prev) => prev.filter((m) => m.id !== moduleId));
      updateAssignedState((prev) => [
        ...prev,
        { 
          ...module, 
          assignment_created_at: new Date().toISOString(),
          assignment_volume: course?.volume ?? null,
          assignment_coefficient: course?.coefficient ?? null,
        },
      ]);

      // Call API to add module to course with volume and coefficient from the course
      try {
        setLoadingItemId(moduleId);
        await addModuleToCourse.mutateAsync({
          courseId,
          moduleId,
          volume: course?.volume ?? null,
          coefficient: course?.coefficient ?? null,
        });
        // Wait a bit for cache invalidation to propagate, then refetch
        await new Promise((resolve) => setTimeout(resolve, 100));
        await refetchAssignments();
      } catch (error: any) {
        // Check if the error is because the module is already assigned (409)
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
        setUnassignedModules((prev) => [...prev, module]);
        updateAssignedState((prev) => prev.filter((m) => m.id !== moduleId));
        console.error("Failed to add module to course:", error);

        // Show user-friendly error message for other errors
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          "Failed to add module to course";
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
      setUnassignedModules((prev) => {
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
  const handleDeleteModuleClick = (module: AssignmentModule, e: React.MouseEvent) => {
    e.stopPropagation();
    setModuleToDelete(module);
    setDeleteModalOpen(true);
  };

  // Handle delete confirmation (soft delete - sets status to -2)
  const handleConfirmDelete = async () => {
    if (!moduleToDelete) return;

    // Optimistically remove from UI
    updateAssignedState((prev) => prev.filter((m) => m.id !== moduleToDelete.id));

    try {
      setLoadingItemId(moduleToDelete.id);
      // This will soft delete (set status to -2) instead of hard delete
      await removeModuleFromCourse.mutateAsync({
        courseId,
        moduleId: moduleToDelete.id,
      });
      // Wait a bit for cache invalidation to propagate, then refetch
      await new Promise((resolve) => setTimeout(resolve, 100));
      await refetchAssignments();
      setDeleteModalOpen(false);
      setModuleToDelete(null);
    } catch (error: any) {
      // Rollback on error
      updateAssignedState((prev) => [...prev, moduleToDelete]);
      console.error("Failed to remove module from course:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to remove module from course";
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoadingItemId(null);
    }
  };

  // Handle delete modal cancel
  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setModuleToDelete(null);
  };

  // Handle modal close
  const handleClose = () => {
    onClose();
  };

  // Handle showing module details
  const handleShowModuleDetails = (e: React.MouseEvent, moduleId: number) => {
    e.stopPropagation();
    setSelectedModuleId(moduleId);
  };

  // Show description modal when module data is loaded
  useEffect(() => {
    if (selectedModule && selectedModuleId) {
      setDescriptionModal({
        title: selectedModule.title || `Module #${selectedModuleId}`,
        description: selectedModule.description ?? "",
      });
      setSelectedModuleId(null); // Reset after showing
    }
  }, [selectedModule, selectedModuleId]);

  const handleShowCourseDetails = () => {
    if (course) {
      setCourseDescriptionModal(true);
    }
  };

  const stripHtml = (input?: string | null): string => {
    if (!input) return "";
    return input.replace(/<[^>]+>/g, "");
  };

  const hasCourseDescription = course && !!stripHtml(course.description ?? "");

  const handleOpenEditModule = (module: AssignmentModule, e: React.MouseEvent) => {
    e.stopPropagation();
    // Edit volume and coefficient from the module-course relationship table
    // These values are course-specific and stored in the module-course relationship, not the original module
    setEditingModule(module);
    setEditFormData({
      volume: module.assignment_volume !== null && module.assignment_volume !== undefined ? module.assignment_volume.toString() : "",
      coefficient: module.assignment_coefficient !== null && module.assignment_coefficient !== undefined ? module.assignment_coefficient.toString() : "",
    });
    setEditErrors({});
  };

  const handleCloseEditModule = () => {
    setEditingModule(null);
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

  const handleSaveModuleEdit = async () => {
    if (!editingModule || !validateEditForm()) return;

    const newVolume = editFormData.volume ? Number(editFormData.volume) : null;
    const newCoefficient = editFormData.coefficient ? Number(editFormData.coefficient) : null;

    // Optimistically update the local state immediately
    updateAssignedState((prev) =>
      prev.map((m) =>
        m.id === editingModule.id
          ? {
              ...m,
              assignment_volume: newVolume,
              assignment_coefficient: newCoefficient,
              volume: newVolume ?? undefined,
              coefficient: newCoefficient ?? undefined,
            }
          : m
      )
    );

    try {
      // Update the module-course relationship table (not the original module)
      // This updates volume and coefficient specific to this course-module assignment
      await updateModuleCourse.mutateAsync({
        moduleId: editingModule.id,
        courseId: courseId,
        data: {
          volume: newVolume,
          coefficient: newCoefficient,
        },
      });
      handleCloseEditModule();
      // Refetch to ensure we have the latest data from the server
      await refetchAssignments();
    } catch (error: any) {
      console.error("Failed to update module assignment:", error);
      // Rollback on error - refetch to get the correct state
      await refetchAssignments();
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to update module assignment";
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
            <span>Course to module: Manage Modules for Course ( {courseTitle} )</span>
            {hasCourseDescription && (
              <button
                type="button"
                onClick={handleShowCourseDetails}
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
            <span className="ml-2 text-gray-600">Loading modules...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  {error?.message || "An error occurred"}
                </div>
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
              {/* Unassigned Modules */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Available Modules ({unassignedModules.length})
                </h3>
                <Droppable droppableId="unassigned">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[300px] p-4 border-2 border-dashed rounded-lg transition-colors ${
                        snapshot.isDraggingOver
                          ? "border-blue-400 bg-blue-50"
                          : "border-gray-300 bg-gray-50"
                      } ${
                        isAnyMutationPending
                          ? "opacity-60 pointer-events-none"
                          : ""
                      }`}
                    >
                      {unassignedModules.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          No available modules
                        </div>
                      ) : (
                        unassignedModules.map((module, index) => {
                          const isItemLoading = loadingItemId === module.id;
                          return (
                            <Draggable
                              key={module.id}
                              draggableId={module.id.toString()}
                              index={index}
                              isDragDisabled={isAnyMutationPending}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`mb-2 p-3 bg-white border border-gray-200 rounded-md shadow-sm cursor-move transition-shadow relative ${
                                    snapshot.isDragging
                                      ? "shadow-lg"
                                      : "hover:shadow-md"
                                  } ${isItemLoading ? "opacity-50" : ""}`}
                                >
                                  {isItemLoading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-md">
                                      <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <svg
                                      className="w-4 h-4 text-gray-400 cursor-pointer hover:text-blue-600 flex-shrink-0"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                      onClick={(e) =>
                                        handleShowModuleDetails(e, module.id)
                                      }
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                      />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-900">
                                      {module.title}
                                    </span>
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

              {/* Assigned Modules */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                {courseTitle}  assigned to <span className="font-medium text-red-600">{assignedModules.length}</span> Modules
                </h3>
                <Droppable droppableId="assigned">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[300px] p-4 border-2 border-dashed rounded-lg transition-colors ${
                        snapshot.isDraggingOver
                          ? "border-green-400 bg-green-50"
                          : "border-gray-300 bg-gray-50"
                      } ${
                        isAnyMutationPending
                          ? "opacity-60 pointer-events-none"
                          : ""
                      }`}
                    >
                      {assignedModules.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          No assigned modules
                        </div>
                      ) : (
                        assignedModules.map((module, index) => {
                          const isItemLoading = loadingItemId === module.id;
                          return (
                            <Draggable
                              key={module.id}
                              draggableId={module.id.toString()}
                              index={index}
                              isDragDisabled={true}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`mb-2 p-3 bg-white border border-gray-200 rounded-md shadow-sm transition-shadow relative ${
                                    snapshot.isDragging
                                      ? "shadow-lg"
                                      : "hover:shadow-md"
                                  } ${isItemLoading ? "opacity-50" : ""}`}
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
                                        onClick={(e) =>
                                          handleShowModuleDetails(e, module.id)
                                        }
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                      </svg>
                                      <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">
                                          {module.title}
                                        </p>
                                        {/* Display volume and coefficient before the date */}
                                        {(module.assignment_volume !== null && module.assignment_volume !== undefined) ||
                                        (module.assignment_coefficient !== null && module.assignment_coefficient !== undefined) ? (
                                          <div className="mt-1 flex items-center gap-4 text-xs text-gray-600">
                                            {module.assignment_volume !== null && module.assignment_volume !== undefined && (
                                              <span>Volume: <span className="font-medium text-gray-900">{module.assignment_volume}</span></span>
                                            )}
                                            {module.assignment_coefficient !== null && module.assignment_coefficient !== undefined && (
                                              <span>Coefficient: <span className="font-medium text-gray-900">{module.assignment_coefficient}</span></span>
                                            )}
                                          </div>
                                        ) : null}
                                       
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={(e) => handleOpenEditModule(module, e)}
                                        className="inline-flex items-center justify-center w-6 h-6 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        title="Edit volume and coefficient"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                      </button>
                                      <DeleteButton
                                        onClick={(e) => handleDeleteModuleClick(module, e)}
                                        disabled={isAnyMutationPending}
                                        title="Remove module from course (soft delete)"
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
            setSelectedModuleId(null);
          }}
          title={descriptionModal.title}
          description={descriptionModal.description}
          type="module"
        />
      )}

      {courseDescriptionModal && course && (
        <DescriptionModal
          isOpen
          onClose={() => setCourseDescriptionModal(false)}
          title={course.title || `Course #${courseId}`}
          description={course.description ?? ""}
          type="course"
        />
      )}

      {editingModule && (
        <BaseModal
          isOpen
          onClose={handleCloseEditModule}
          title={`Edit Module: ${editingModule.title}`}
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
                onClick={handleCloseEditModule}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveModuleEdit}
                disabled={updateModuleCourse.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {updateModuleCourse.isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </BaseModal>
      )}

      <DeleteModal
        isOpen={deleteModalOpen}
        title="Remove Module from Course"
        entityName={moduleToDelete?.title}
        message={`Are you sure you want to remove "${moduleToDelete?.title}" from this course? This will soft delete the assignment.`}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isLoading={removeModuleFromCourse.isPending || loadingItemId !== null}
      />
    </BaseModal>
  );
};

export default ModuleAssignmentModal;
