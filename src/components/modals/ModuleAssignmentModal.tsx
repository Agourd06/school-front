import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import BaseModal from './BaseModal';
import { useModuleAssignments } from '../../hooks/useModuleAssignments';
import { useAddModuleToCourse, useRemoveModuleFromCourse } from '../../hooks/useIndividualAssignments';

// Import DropResult type separately
import type { DropResult } from '@hello-pangea/dnd';

interface Module {
  id: number;
  title: string;
}


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
  const [assignedModules, setAssignedModules] = useState<Module[]>([]);
  const [unassignedModules, setUnassignedModules] = useState<Module[]>([]);
  const [isMutationLoading, setIsMutationLoading] = useState(false);

  // React Query hooks
  const { data: moduleAssignments, isLoading, error } = useModuleAssignments(courseId);
  const addModuleToCourse = useAddModuleToCourse();
  const removeModuleFromCourse = useRemoveModuleFromCourse();

  // Initialize local state when data changes
  useEffect(() => {
    if (moduleAssignments) {
      setAssignedModules(moduleAssignments.assigned || []);
      setUnassignedModules(moduleAssignments.unassigned || []);
    }
  }, [moduleAssignments]);


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
      setAssignedModules(prev => prev.filter(m => m.id !== moduleId));
      setUnassignedModules(prev => [...prev, module]);
    } else if (source.droppableId === 'unassigned' && destination.droppableId === 'assigned') {
      // Moving from unassigned to assigned
      setUnassignedModules(prev => prev.filter(m => m.id !== moduleId));
      setAssignedModules(prev => [...prev, module]);
    }

    // Immediately call the API using individual endpoints
    try {
      setIsMutationLoading(true);
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
    } catch (error) {
      // Rollback UI changes on error
      if (source.droppableId === 'assigned' && destination.droppableId === 'unassigned') {
        setAssignedModules(prev => [...prev, module]);
        setUnassignedModules(prev => prev.filter(m => m.id !== moduleId));
      } else if (source.droppableId === 'unassigned' && destination.droppableId === 'assigned') {
        setUnassignedModules(prev => [...prev, module]);
        setAssignedModules(prev => prev.filter(m => m.id !== moduleId));
      }
      console.error('Failed to update module assignment:', error);
    } finally {
      setIsMutationLoading(false);
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
                      } ${isMutationLoading ? 'opacity-60 pointer-events-none' : ''}`}
                    >
                      {unassignedModules.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          No available modules
                        </div>
                      ) : (
                        unassignedModules.map((module, index) => (
                          <Draggable key={module.id} draggableId={module.id.toString()} index={index} isDragDisabled={isMutationLoading}>
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
                                  <span className="text-sm font-medium text-gray-900">{module.title}</span>
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
                      } ${isMutationLoading ? 'opacity-60 pointer-events-none' : ''}`}
                    >
                      {assignedModules.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          No assigned modules
                        </div>
                      ) : (
                        assignedModules.map((module, index) => (
                          <Draggable key={module.id} draggableId={module.id.toString()} index={index} isDragDisabled={isMutationLoading}>
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
                                  <span className="text-sm font-medium text-gray-900">{module.title}</span>
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

export default ModuleAssignmentModal;
