import React, { useMemo, useState, useEffect } from 'react';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { useQuery } from '@tanstack/react-query';
import { useDeleteClassStudent, useCreateClassStudent } from '../../hooks/useClassStudents';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import { useClasses } from '../../hooks/useClasses';
import { useStudents } from '../../hooks/useStudents';
import { useSchoolYears } from '../../hooks/useSchoolYears';
import { classStudentApi } from '../../api/classStudent';
import type { MinimalStudent, GetClassStudentParams } from '../../api/classStudent';
import type { Student } from '../../api/students';
import type { DropResult } from '@hello-pangea/dnd';
import { STATUS_OPTIONS } from '../../constants/status';

type StudentLite = {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  status?: number | null;
};

type AssignedStudent = {
  assignmentId: number;
  student: StudentLite;
  tri: number;
  status: number;
  createdAt?: string;
};

const MAX_FETCH_LIMIT = 100;

const makeStudentLite = (fallbackId: number, student?: Partial<Student> | MinimalStudent | StudentLite | null): StudentLite => ({
  id: student?.id ?? fallbackId,
  first_name: student?.first_name ?? null,
  last_name: student?.last_name ?? null,
  email: student?.email ?? null,
  status: student?.status ?? null,
});

const getStudentLabel = (student: StudentLite) => {
  const fullName = `${student.first_name ?? ''} ${student.last_name ?? ''}`.trim();
  return fullName || student.email || `Student #${student.id}`;
};

const sortStudentsByLabel = (a: StudentLite, b: StudentLite) => getStudentLabel(a).localeCompare(getStudentLabel(b));

const ClassStudentsSection: React.FC = () => {
  const [yearFilter, setYearFilter] = useState<number | ''>('');
  const [classFilter, setClassFilter] = useState<number | ''>('');
  const [statusFilter, setStatusFilter] = useState<number | ''>('');
  const [assignedStudents, setAssignedStudents] = useState<AssignedStudent[]>([]);
  const [unassignedStudents, setUnassignedStudents] = useState<StudentLite[]>([]);
  const [assignedFilter, setAssignedFilter] = useState<number | ''>('');
  const [unassignedFilter, setUnassignedFilter] = useState<number | ''>('');
  const [assignedSearch, setAssignedSearch] = useState('');
  const [unassignedSearch, setUnassignedSearch] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const createMut = useCreateClassStudent();
  const deleteMut = useDeleteClassStudent();

  const { data: studentsResp, isLoading: studentsLoading } = useStudents({ page: 1, limit: MAX_FETCH_LIMIT } as any);
  
  const studentsMap = useMemo(() => {
    const map = new Map<number, StudentLite>();
    (((studentsResp as any)?.data) || []).forEach((stu: Student) => {
      map.set(stu.id, makeStudentLite(stu.id, stu));
    });
    return map;
  }, [studentsResp]);

  const assignedQuery = useQuery({
    queryKey: ['classStudents', 'byClass', classFilter || 'none', statusFilter || 'all'],
    queryFn: () => {
      const params: GetClassStudentParams = {
        class_id: Number(classFilter),
        limit: MAX_FETCH_LIMIT,
        status: statusFilter === '' ? undefined : Number(statusFilter),
      };
      return classStudentApi.getAll(params);
    },
    enabled: typeof classFilter === 'number' && classFilter > 0,
  });

  const allAssignmentsQuery = useQuery({
    queryKey: ['classStudents', 'all'],
    queryFn: () => classStudentApi.getAll({ page: 1, limit: MAX_FETCH_LIMIT }),
    enabled: !!classFilter,
  });

  useEffect(() => {
    if (!classFilter || !assignedQuery.data) {
      setAssignedStudents([]);
      return;
    }

    const assignments = assignedQuery.data?.data || [];
    const next = assignments
      .filter((item) => item.status !== -2 && item.student_id)
      .map((item) => {
        const fallback = studentsMap.get(item.student_id);
        return {
          assignmentId: item.id,
          student: makeStudentLite(item.student_id, item.student ?? fallback ?? { id: item.student_id }),
          tri: item.tri ?? 1,
          status: item.status,
          createdAt: item.created_at,
        } as AssignedStudent;
      })
      .sort((a, b) => (a.tri ?? 0) - (b.tri ?? 0));

    setAssignedStudents(next);
  }, [assignedQuery.data, classFilter, studentsMap]);

  useEffect(() => {
    if (!classFilter) return;
    const assignments = allAssignmentsQuery.data?.data || [];
    const assignedIds = new Set<number>();
    assignments.forEach((item) => {
      if (item.status !== -2 && item.student_id) {
        assignedIds.add(item.student_id);
      }
    });

    const students = (((studentsResp as any)?.data) || [])
      .filter((stu: Student) => stu?.status !== -2)
      .filter((stu: Student) => !assignedIds.has(stu.id))
      .map((stu: Student) => makeStudentLite(stu.id, stu))
      .sort(sortStudentsByLabel);

    setUnassignedStudents(students);
  }, [allAssignmentsQuery.data, studentsResp, classFilter]);

  const assignedFilterOptions: SearchSelectOption[] = useMemo(
    () =>
      assignedStudents.map((item) => ({
        value: item.student.id,
        label: getStudentLabel(item.student),
      })),
    [assignedStudents]
  );

  const unassignedFilterOptions: SearchSelectOption[] = useMemo(
    () =>
      unassignedStudents.map((item) => ({
        value: item.id,
        label: getStudentLabel(item),
      })),
    [unassignedStudents]
  );

  const assignedSearchLower = assignedSearch.trim().toLowerCase();
  const unassignedSearchLower = unassignedSearch.trim().toLowerCase();

  const filteredAssigned = useMemo(() => {
    return assignedStudents.filter((item) => {
      if (assignedFilter !== '' && item.student.id !== Number(assignedFilter)) return false;
      if (!assignedSearchLower) return true;
      return getStudentLabel(item.student).toLowerCase().includes(assignedSearchLower);
    });
  }, [assignedStudents, assignedFilter, assignedSearchLower]);

  const filteredUnassigned = useMemo(() => {
    return unassignedStudents.filter((item) => {
      if (unassignedFilter !== '' && item.id !== Number(unassignedFilter)) return false;
      if (!unassignedSearchLower) return true;
      return getStudentLabel(item).toLowerCase().includes(unassignedSearchLower);
    });
  }, [unassignedStudents, unassignedFilter, unassignedSearchLower]);

  const isMutationLoading = createMut.isPending || deleteMut.isPending;
  const isAssignedLoading = assignedQuery.isLoading || assignedQuery.isFetching;
  const isUnassignedLoading = studentsLoading || allAssignmentsQuery.isLoading;

  // Fetch school years
  const { data: schoolYearsResp, isLoading: yearsLoading } = useSchoolYears({ page: 1, limit: 100 } as any);
  const yearOptions: SearchSelectOption[] = useMemo(
    () => (((schoolYearsResp as any)?.data) || [])
      .map((year: any) => ({ value: year.id, label: year.title || `Year #${year.id}` })),
    [schoolYearsResp]
  );

  // Fetch classes filtered by year
  const { data: classesResp, isLoading: classesLoading } = useClasses({ 
    page: 1, 
    limit: 100,
    school_year_id: yearFilter === '' ? undefined : Number(yearFilter),
  } as any);
  const classOptions: SearchSelectOption[] = useMemo(
    () => (((classesResp as any)?.data) || [])
      .filter((cls: any) => cls?.status !== -2)
      .map((cls: any) => ({ value: cls.id, label: cls.title || `Class #${cls.id}` })),
    [classesResp]
  );

  const handleAssign = async (studentId: number) => {
    if (!classFilter || typeof classFilter !== 'number') {
      setFeedback('Select a class first to assign students.');
      return;
    }

    const student = unassignedStudents.find((item) => item.id === studentId);
    if (!student) return;
    if (assignedStudents.some((item) => item.student.id === studentId)) return;

    try {
      const response = await createMut.mutateAsync({
        class_id: Number(classFilter),
        student_id: studentId,
        status: 1,
        tri: assignedStudents.length + 1,
      });

      const assignedStudent: AssignedStudent = {
        assignmentId: response.id,
        student: makeStudentLite(studentId, response.student ?? student),
        tri: response.tri ?? assignedStudents.length + 1,
        status: response.status,
        createdAt: response.created_at,
      };

      setAssignedStudents((prev) => [...prev, assignedStudent].sort((a, b) => a.tri - b.tri));
      setUnassignedStudents((prev) => prev.filter((item) => item.id !== studentId));
      setAssignedFilter('');
      setAssignedSearch('');
      setFeedback(null);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to assign student';
      setFeedback(message);
    }
  };

  const handleUnassign = async (assignmentId: number) => {
    const target = assignedStudents.find((item) => item.assignmentId === assignmentId);
    if (!target) return;

    try {
      await deleteMut.mutateAsync(assignmentId);
      setAssignedStudents((prev) => prev
        .filter((item) => item.assignmentId !== assignmentId)
        .map((item, index) => ({ ...item, tri: index + 1 }))
      );
      setUnassignedStudents((prev) => {
        if (prev.some((item) => item.id === target.student.id)) return prev;
        return [...prev, target.student].sort(sortStudentsByLabel);
      });
      setUnassignedFilter('');
      setUnassignedSearch('');
      setFeedback(null);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to unassign student';
      setFeedback(message);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const studentId = Number(draggableId);
    if (!studentId) return;

    if (source.droppableId === 'unassigned' && destination.droppableId === 'assigned') {
      await handleAssign(studentId);
    } else if (source.droppableId === 'assigned' && destination.droppableId === 'unassigned') {
      const target = assignedStudents.find((item) => item.student.id === studentId);
      if (target) {
        await handleUnassign(target.assignmentId);
      }
    }
  };

  // Reset class filter when year changes
  const handleYearChange = (value: string | number | '') => {
    setYearFilter(value === '' || value === undefined ? '' : Number(value));
    setClassFilter(''); // Reset class when year changes
    setAssignedStudents([]);
    setUnassignedStudents([]);
  };

  const statusFilterOptions: SearchSelectOption[] = useMemo(
    () => [
      { value: '', label: 'All statuses' },
      ...STATUS_OPTIONS.map((opt) => ({ value: String(opt.value), label: opt.label })),
    ],
    []
  );

  return (
    <>
      <div className="mb-6">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Class Assignments</h2>
          <p className="text-sm text-gray-500 mt-1">Manage student assignments to classes by year and class.</p>
        </div>

        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <SearchSelect
            label="Filter by Year *"
            value={yearFilter}
            onChange={handleYearChange}
            options={yearOptions}
            placeholder="Select year"
            isClearable
            isLoading={yearsLoading}
          />
          <SearchSelect
            label="Filter by Class *"
            value={classFilter}
            onChange={(value) => {
              setClassFilter(value === '' ? '' : Number(value));
              setAssignedStudents([]);
              setUnassignedStudents([]);
            }}
            options={classOptions}
            placeholder="Select class"
            isClearable
            isLoading={classesLoading}
            disabled={!yearFilter}
          />
          <SearchSelect
            label="Status"
            value={statusFilter === '' ? '' : String(statusFilter)}
            onChange={(value) => setStatusFilter(value === '' || value === undefined ? '' : Number(value))}
            options={statusFilterOptions}
            placeholder="All statuses"
            isClearable
            disabled={!classFilter}
          />
        </div>
      </div>

      {!yearFilter || !classFilter ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Please select a year and class to manage students.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {feedback && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{feedback}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SearchSelect
              label="Assigned filter"
              value={assignedFilter}
              onChange={(value) => setAssignedFilter(value === '' ? '' : Number(value))}
              options={assignedFilterOptions}
              placeholder="Filter assigned"
              isClearable
              onSearchChange={setAssignedSearch}
              noOptionsMessage={(query) => (query ? 'No assigned students match' : 'No assigned students')}
            />
            <SearchSelect
              label="Unassigned filter"
              value={unassignedFilter}
              onChange={(value) => setUnassignedFilter(value === '' ? '' : Number(value))}
              options={unassignedFilterOptions}
              placeholder="Filter unassigned"
              isClearable
              onSearchChange={setUnassignedSearch}
              noOptionsMessage={(query) => (query ? 'No students match' : 'No unassigned students')}
            />
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Assigned Students</h3>
                    <p className="text-sm text-gray-500">
                      {classOptions.find(opt => Number(opt.value) === classFilter)?.label || 'Class'}
                    </p>
                  </div>
                  <span className="text-sm text-gray-500">{filteredAssigned.length}</span>
                </div>
                <Droppable droppableId="assigned" isDropDisabled={!classFilter || isMutationLoading}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[320px] p-4 border-2 border-dashed rounded-lg transition-colors ${
                        snapshot.isDraggingOver
                          ? 'border-blue-400 bg-blue-50'
                          : 'border-gray-300 bg-gray-50'
                      } ${(isAssignedLoading || !classFilter) ? 'opacity-70' : ''}`}
                    >
                      {!classFilter ? (
                        <div className="text-center text-gray-500 py-12">Select a class to manage assignments.</div>
                      ) : isAssignedLoading ? (
                        <div className="text-center text-gray-500 py-12">Loading assigned students...</div>
                      ) : filteredAssigned.length === 0 ? (
                        <div className="text-center text-gray-500 py-12">No students assigned.</div>
                      ) : (
                        filteredAssigned.map((item, index) => (
                          <Draggable
                            key={`assigned-${item.student.id}`}
                            draggableId={item.student.id.toString()}
                            index={index}
                            isDragDisabled={isMutationLoading}
                          >
                            {(dragProvided, dragSnapshot) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                className={`mb-3 p-3 bg-white border border-gray-200 rounded-md shadow-sm flex items-center justify-between ${
                                  dragSnapshot.isDragging ? 'shadow-lg' : 'hover:shadow-md'
                                }`}
                              >
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{getStudentLabel(item.student)}</p>
                                  {item.student.email && (
                                    <p className="text-xs text-gray-500">{item.student.email}</p>
                                  )}
                                  <p className="text-xs text-gray-400 mt-1">Order: #{item.tri}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleUnassign(item.assignmentId)}
                                  className="text-sm text-red-600 hover:text-red-800"
                                  disabled={isMutationLoading}
                                >
                                  Remove
                                </button>
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

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Unassigned Students</h3>
                    <p className="text-sm text-gray-500">Students not assigned to any class.</p>
                  </div>
                  <span className="text-sm text-gray-500">{filteredUnassigned.length}</span>
                </div>
                <Droppable droppableId="unassigned" isDropDisabled={isMutationLoading}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[320px] p-4 border-2 border-dashed rounded-lg transition-colors ${
                        snapshot.isDraggingOver
                          ? 'border-green-400 bg-green-50'
                          : 'border-gray-300 bg-gray-50'
                      } ${isUnassignedLoading ? 'opacity-70' : ''}`}
                    >
                      {isUnassignedLoading ? (
                        <div className="text-center text-gray-500 py-12">Loading students...</div>
                      ) : filteredUnassigned.length === 0 ? (
                        <div className="text-center text-gray-500 py-12">No available students.</div>
                      ) : (
                        filteredUnassigned.map((item, index) => (
                          <Draggable
                            key={`unassigned-${item.id}`}
                            draggableId={item.id.toString()}
                            index={index}
                            isDragDisabled={isMutationLoading || !classFilter}
                          >
                            {(dragProvided, dragSnapshot) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                className={`mb-3 p-3 bg-white border border-gray-200 rounded-md shadow-sm flex items-center justify-between ${
                                  dragSnapshot.isDragging ? 'shadow-lg' : 'hover:shadow-md'
                                }`}
                              >
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{getStudentLabel(item)}</p>
                                  {item.email && <p className="text-xs text-gray-500">{item.email}</p>}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleAssign(item.id)}
                                  className="text-sm text-blue-600 hover:text-blue-800"
                                  disabled={isMutationLoading || !classFilter}
                                >
                                  Assign
                                </button>
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
          </DragDropContext>
        </div>
      )}

    </>
  );
};

export default ClassStudentsSection;


