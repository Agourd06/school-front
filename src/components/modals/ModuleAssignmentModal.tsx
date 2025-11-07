import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import BaseModal from './BaseModal';
import { useModuleAssignments } from '../../hooks/useModuleAssignments';
import { useAddModuleToCourse, useRemoveModuleFromCourse, useReorderModuleInCourse } from '../../hooks/useIndividualAssignments';
import type { Module as ModuleEntity } from '../../api/module';

// Import DropResult type separately
import type { DropResult } from '@hello-pangea/dnd';

type AssignmentModule = ModuleEntity & {
  tri?: number;
  assignment_created_at?: string;
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
  courseTitle
}) => {
  const [assignedModules, setAssignedModules] = useState<AssignmentModule[]>([]);
  const [unassignedModules, setUnassignedModules] = useState<AssignmentModule[]>([]);
  const [isMutationLoading, setIsMutationLoading] = useState(false);
  const [loadingItemId, setLoadingItemId] = useState<number | null>(null);

  // React Query hooks
  const { data: moduleAssignments, isLoading, error, refetch: refetchAssignments } = useModuleAssignments(courseId);
  const addModuleToCourse = useAddModuleToCourse();
  const removeModuleFromCourse = useRemoveModuleFromCourse();
  const reorderModuleInCourse = useReorderModuleInCourse();

  // Check if any mutation is pending
  const isAnyMutationPending = addModuleToCourse.isPending || removeModuleFromCourse.isPending || reorderModuleInCourse.isPending;

  // Initialize local state when data changes
  const normalizeAssigned = (items: AssignmentModule[] = []) =>
    items
      .slice()
      .sort((a, b) => (a.tri ?? Number.MAX_SAFE_INTEGER) - (b.tri ?? Number.MAX_SAFE_INTEGER))
      .map((item, index) => ({ ...item, tri: index }));

  useEffect(() => {
    if (moduleAssignments) {
      setAssignedModules(normalizeAssigned(moduleAssignments.assigned || []));
      setUnassignedModules(moduleAssignments.unassigned || []);
    }
  }, [moduleAssignments]);

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

  const updateAssignedState = (updater: (current: AssignmentModule[]) => AssignmentModule[]) => {
    setAssignedModules(prev => normalizeAssigned(updater(prev)));
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

    const moduleId = parseInt(draggableId);
    const module = source.droppableId === 'assigned' 
      ? assignedModules.find(m => m.id === moduleId)
      : unassignedModules.find(m => m.id === moduleId);

    if (!module) return;

    // Optimistically update the UI first
    if (source.droppableId === 'assigned' && destination.droppableId === 'unassigned') {
      // Moving from assigned to unassigned
      updateAssignedState(prev => prev.filter(m => m.id !== moduleId));
      setUnassignedModules(prev => [...prev, module]);
    } else if (source.droppableId === 'unassigned' && destination.droppableId === 'assigned') {
      // Moving from unassigned to assigned
      setUnassignedModules(prev => prev.filter(m => m.id !== moduleId));
      updateAssignedState(prev => [...prev, { ...module, assignment_created_at: new Date().toISOString() }]);
    } else if (source.droppableId === 'assigned' && destination.droppableId === 'assigned') {
      // Reordering within assigned list - update tri values
      // Only reorder if the relationship exists (module is already assigned)
      const existingModule = assignedModules.find(m => m.id === moduleId);
      if (!existingModule) {
        console.warn('Cannot reorder: module not found in assigned list');
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
        setLoadingItemId(moduleId);
        await reorderModuleInCourse.mutateAsync({
          courseId,
          moduleId,
          tri: destination.index,
        });
        // Wait a bit for cache invalidation to propagate, then refetch
        await new Promise(resolve => setTimeout(resolve, 100));
        await refetchAssignments();
      } catch (error: any) {
        console.error('Failed to reorder module:', error);
        // Rollback on error - reload from server
        if (moduleAssignments) {
          setAssignedModules(normalizeAssigned(moduleAssignments.assigned || []));
        }
        // Show error message if it's a 404 (relationship not found)
        if (error?.response?.status === 404) {
          alert('Cannot reorder: Module-course relationship not found. Please refresh and try again.');
        }
      } finally {
        setIsMutationLoading(false);
        setLoadingItemId(null);
      }
      return;
    } else if (source.droppableId === 'unassigned' && destination.droppableId === 'unassigned') {
      setUnassignedModules(prev => {
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
      setLoadingItemId(moduleId);
      if (source.droppableId === 'assigned' && destination.droppableId === 'unassigned') {
        // Remove module from course
        await removeModuleFromCourse.mutateAsync({
          courseId,
          moduleId
        });
      } else if (source.droppableId === 'unassigned' && destination.droppableId === 'assigned') {
        // Add module to course
        await addModuleToCourse.mutateAsync({
          courseId,
          moduleId
        });
      }
      // Wait a bit for cache invalidation to propagate, then refetch
      await new Promise(resolve => setTimeout(resolve, 100));
      await refetchAssignments();
    } catch (error: any) {
      // Rollback UI changes on error
      if (source.droppableId === 'assigned' && destination.droppableId === 'unassigned') {
        updateAssignedState(prev => [...prev, module]);
        setUnassignedModules(prev => prev.filter(m => m.id !== moduleId));
      } else if (source.droppableId === 'unassigned' && destination.droppableId === 'assigned') {
        setUnassignedModules(prev => [...prev, module]);
        updateAssignedState(prev => prev.filter(m => m.id !== moduleId));
      }
      console.error('Failed to update module assignment:', error);
      
      // Show user-friendly error message
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update assignment';
      if (error?.response?.status === 404) {
        alert('Relationship not found. Please refresh and try again.');
      } else if (error?.response?.status === 409) {
        alert('This module is already assigned to this course.');
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


  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title={`Manage Modules for ${courseTitle}`}>
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
                          ? 'border-blue-400 bg-blue-50'
                          : 'border-gray-300 bg-gray-50'
                      } ${isAnyMutationPending ? 'opacity-60 pointer-events-none' : ''}`}
                    >
                      {unassignedModules.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          No available modules
                        </div>
                      ) : (
                        unassignedModules.map((module, index) => {
                          const isItemLoading = loadingItemId === module.id;
                          return (
                            <Draggable key={module.id} draggableId={module.id.toString()} index={index} isDragDisabled={isAnyMutationPending}>
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
                                    <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-900">{module.title}</span>
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
                  Assigned Modules ({assignedModules.length})
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
                      {assignedModules.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          No assigned modules
                        </div>
                      ) : (
                        assignedModules.map((module, index) => {
                          const isItemLoading = loadingItemId === module.id;
                          return (
                            <Draggable key={module.id} draggableId={module.id.toString()} index={index} isDragDisabled={isAnyMutationPending}>
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
                                      <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                      </svg>
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">{module.title}</p>
                                        <p className="text-xs text-gray-500">Added: {formatTimestamp(module.assignment_created_at)}</p>
                                      </div>
                                    </div>
                                    <span className="ml-3 text-xs font-semibold text-gray-500">#{(module.tri ?? index) + 1}</span>
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
    </BaseModal>
  );
};

export default ModuleAssignmentModal;
