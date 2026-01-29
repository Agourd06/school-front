import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import BaseModal from './BaseModal';
import { Button } from '../ui';
import { useCourses } from '../../hooks/useCourses';
import { useTeachers } from '../../hooks/useTeachers';
import { useTeacherCourses, useCreateTeacherCourse, useDeleteTeacherCourse } from '../../hooks/useTeacherCourses';
import type { Teacher } from '../../api/teachers';
import type { Course } from '../../api/courses';
import { ArrowRight, ArrowLeft, GripVertical } from 'lucide-react';

interface TeacherCourseAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher?: Teacher | null;
  course?: Course | null;
  mode: 'teacher' | 'course'; // 'teacher' = assign courses to teacher, 'course' = assign teachers to course
}

const TeacherCourseAssignmentModal: React.FC<TeacherCourseAssignmentModalProps> = ({
  isOpen,
  onClose,
  teacher,
  course,
  mode,
}) => {
  const { t } = useTranslation();
  const [assignedItems, setAssignedItems] = useState<Array<{ id: number; label: string }>>([]);
  const [unassignedItems, setUnassignedItems] = useState<Array<{ id: number; label: string }>>([]);
  const [search, setSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isMoving, setIsMoving] = useState<number | null>(null);

  // Fetch all courses or teachers depending on mode
  const { data: coursesResp } = useCourses({ page: 1, limit: 100, search: search || undefined });
  const { data: teachersResp } = useTeachers({ page: 1, limit: 100, search: search || undefined });

  // Fetch existing assignments
  const { data: assignmentsResp } = useTeacherCourses(
    mode === 'teacher'
      ? { teacher_id: teacher?.id, status: 1 }
      : { course_id: course?.id, status: 1 },
    { enabled: isOpen && (mode === 'teacher' ? !!teacher?.id : !!course?.id) }
  );

  const createMut = useCreateTeacherCourse();
  const deleteMut = useDeleteTeacherCourse();

  const existingAssignments = useMemo(() => {
    return (assignmentsResp?.data || []).map((assignment) =>
      mode === 'teacher' ? assignment.course_id : assignment.teacher_id
    );
  }, [assignmentsResp, mode]);

  // Get all available items
  const allItems = useMemo(() => {
    if (mode === 'teacher') {
      return (coursesResp?.data || [])
        .filter((course) => {
          const matchesSearch = !search || course.title?.toLowerCase().includes(search.toLowerCase());
          return matchesSearch;
        })
        .map((course) => ({
          id: course.id,
          label: course.title || `Course #${course.id}`,
        }));
    } else {
      return (teachersResp?.data || [])
        .filter((teacher) => {
          const matchesSearch = !search || 
            teacher.first_name?.toLowerCase().includes(search.toLowerCase()) ||
            teacher.last_name?.toLowerCase().includes(search.toLowerCase()) ||
            teacher.email?.toLowerCase().includes(search.toLowerCase());
          return teacher.status !== -2 && matchesSearch;
        })
        .map((teacher) => {
          const name = `${teacher.first_name ?? ''} ${teacher.last_name ?? ''}`.trim();
          return {
            id: teacher.id,
            label: name || teacher.email || `Teacher #${teacher.id}`,
          };
        });
    }
  }, [mode, coursesResp, teachersResp, search]);

  // Split items into assigned and unassigned
  useEffect(() => {
    if (isOpen && allItems.length > 0) {
      const assigned = allItems.filter((item) => existingAssignments.includes(item.id));
      const unassigned = allItems.filter((item) => !existingAssignments.includes(item.id));
      setAssignedItems(assigned);
      setUnassignedItems(unassigned);
    } else {
      setAssignedItems([]);
      setUnassignedItems([]);
    }
  }, [isOpen, allItems, existingAssignments]);

  // Handle drag and drop
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const itemId = parseInt(draggableId);
    const item = source.droppableId === 'assigned' 
      ? assignedItems.find((i) => i.id === itemId)
      : unassignedItems.find((i) => i.id === itemId);

    if (!item) return;

    setIsMoving(itemId);

    try {
      if (source.droppableId === 'unassigned' && destination.droppableId === 'assigned') {
        // Assign item
        if (mode === 'teacher') {
          await createMut.mutateAsync({
            teacher_id: teacher!.id,
            course_id: itemId,
            status: 1,
          });
        } else {
          await createMut.mutateAsync({
            teacher_id: itemId,
            course_id: course!.id,
            status: 1,
          });
        }
        // Optimistic update
        setUnassignedItems((prev) => prev.filter((i) => i.id !== itemId));
        setAssignedItems((prev) => [...prev, item]);
      } else if (source.droppableId === 'assigned' && destination.droppableId === 'unassigned') {
        // Unassign item
        if (mode === 'teacher') {
          await deleteMut.mutateAsync({
            teacherId: teacher!.id,
            courseId: itemId,
          });
        } else {
          await deleteMut.mutateAsync({
            teacherId: itemId,
            courseId: course!.id,
          });
        }
        // Optimistic update
        setAssignedItems((prev) => prev.filter((i) => i.id !== itemId));
        setUnassignedItems((prev) => [...prev, item]);
      }
    } catch (error) {
      console.error('Error updating assignment:', error);
      // Revert on error - refetch will restore correct state
    } finally {
      setIsMoving(null);
    }
  };

  // Handle click to move
  const handleItemClick = async (item: { id: number; label: string }, fromAssigned: boolean) => {
    if (isMoving || isSaving) return;

    setIsMoving(item.id);

    try {
      if (!fromAssigned) {
        // Assign item
        if (mode === 'teacher') {
          await createMut.mutateAsync({
            teacher_id: teacher!.id,
            course_id: item.id,
            status: 1,
          });
        } else {
          await createMut.mutateAsync({
            teacher_id: item.id,
            course_id: course!.id,
            status: 1,
          });
        }
        setUnassignedItems((prev) => prev.filter((i) => i.id !== item.id));
        setAssignedItems((prev) => [...prev, item]);
      } else {
        // Unassign item
        if (mode === 'teacher') {
          await deleteMut.mutateAsync({
            teacherId: teacher!.id,
            courseId: item.id,
          });
        } else {
          await deleteMut.mutateAsync({
            teacherId: item.id,
            courseId: course!.id,
          });
        }
        setAssignedItems((prev) => prev.filter((i) => i.id !== item.id));
        setUnassignedItems((prev) => [...prev, item]);
      }
    } catch (error) {
      console.error('Error updating assignment:', error);
    } finally {
      setIsMoving(null);
    }
  };

  const handleSubmit = async () => {
    // Since we're updating immediately on drag/click, Save just closes the modal
    // But we ensure all pending operations are complete first
    if (isMoving !== null || createMut.isPending || deleteMut.isPending) {
      return; // Wait for operations to complete
    }
    onClose();
  };

  const title = mode === 'teacher' 
    ? t('forms.assignCoursesToTeacher') || `Assign Courses to ${teacher?.first_name} ${teacher?.last_name}`
    : t('forms.assignTeachersToCourse') || `Assign Teachers to ${course?.title}`;

  const renderItemList = (items: Array<{ id: number; label: string }>, droppableId: string, isAssigned: boolean) => {
    if (items.length === 0) {
      return (
        <div className="text-sm text-gray-400 text-center py-8">
          {isAssigned 
            ? (mode === 'teacher' ? t('forms.noCoursesAssigned') || 'No courses assigned' : t('forms.noTeachersAssigned') || 'No teachers assigned')
            : (mode === 'teacher' ? t('sections.noCoursesFound') : (t('sections.noTeachersFound') || 'No teachers found'))
          }
        </div>
      );
    }

    return (
      <Droppable droppableId={droppableId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[200px] space-y-2 transition-colors ${
              snapshot.isDraggingOver ? 'bg-primary/5' : ''
            }`}
          >
            {items.map((item, index) => {
              const isMovingItem = isMoving === item.id;
              return (
                <Draggable key={item.id} draggableId={String(item.id)} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`flex items-center gap-2 p-2 rounded-md border transition-all ${
                        snapshot.isDragging
                          ? 'bg-primary/20 border-primary shadow-lg'
                          : isMovingItem
                          ? 'opacity-50 pointer-events-none'
                          : 'bg-white border-gray-200 hover:border-primary/50 hover:shadow-sm cursor-move'
                      }`}
                    >
                      <div {...provided.dragHandleProps} className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing">
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <span 
                        className="text-sm text-body flex-1 cursor-pointer"
                        onClick={() => !isMovingItem && handleItemClick(item, isAssigned)}
                      >
                        {item.label}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isMovingItem) handleItemClick(item, isAssigned);
                        }}
                        className={`p-1.5 rounded transition-colors ${
                          isAssigned
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        disabled={isMovingItem}
                        title={isAssigned ? (t('common.remove') || 'Remove') : (t('common.add') || 'Add')}
                      >
                        {isAssigned ? (
                          <ArrowLeft className="w-4 h-4" />
                        ) : (
                          <ArrowRight className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    );
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4 relative">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-body mb-2">
            {mode === 'teacher' ? t('sidebar.courses') : t('sidebar.teachers')}
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={mode === 'teacher' ? t('sections.searchByCourseTitle') : t('sections.searchByNameOrEmail')}
            className="block w-full rounded-md border border-border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        {/* Dual Panel Layout */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-2 gap-4">
            {/* Unassigned Panel */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                {mode === 'teacher' ? t('forms.availableCourses') || 'Available Courses' : t('forms.availableTeachers') || 'Available Teachers'}
              </h3>
              <div className="max-h-96 overflow-y-auto">
                {renderItemList(unassignedItems, 'unassigned', false)}
              </div>
            </div>

            {/* Assigned Panel */}
            <div className="border border-primary/30 bg-primary/5 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                {mode === 'teacher' ? t('forms.assignedCourses') || 'Assigned Courses' : t('forms.assignedTeachers') || 'Assigned Teachers'}
              </h3>
              <div className="max-h-96 overflow-y-auto">
                {renderItemList(assignedItems, 'assigned', true)}
              </div>
            </div>
          </div>
        </DragDropContext>

        {/* Loading overlay */}
        {(isSaving || isMoving !== null) && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
            <div className="bg-white rounded-lg p-6 shadow-xl border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="text-sm font-medium text-gray-700">
                  {isSaving ? t('common.saving') : t('common.updating')}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-tertiary/20">
          <Button 
            type="button" 
            variant="secondary" 
            onClick={onClose} 
            disabled={isSaving || isMoving !== null || createMut.isPending || deleteMut.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            isLoading={isSaving || createMut.isPending || deleteMut.isPending}
            disabled={isSaving || isMoving !== null || createMut.isPending || deleteMut.isPending}
          >
            {t('common.save')}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

export default TeacherCourseAssignmentModal;
