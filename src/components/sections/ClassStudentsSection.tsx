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
import type { Student as ApiStudent } from '../../api/students';
import type { DropResult } from '@hello-pangea/dnd';
import type { PaginatedResponse } from '../../types/api';
import type { SchoolYear } from '../../api/schoolYear';
import type { ClassEntity } from '../../api/classes';
import { STATUS_OPTIONS } from '../../constants/status';
import { studentsApi } from '../../api/students';
import BaseModal from '../modals/BaseModal';
import { getFileUrl } from '../../utils/apiConfig';

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

const makeStudentLite = (fallbackId: number, student?: Partial<ApiStudent> | MinimalStudent | StudentLite | null): StudentLite => ({
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

const StudentDetailsButton: React.FC<{ studentId: number }> = ({ studentId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [preview, setPreview] = useState<{ src: string; label: string } | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ['studentDetails', studentId],
    queryFn: () => studentsApi.getDetails(studentId),
    enabled: isOpen && !!studentId,
    staleTime: 60_000,
  });

  const student = data?.student as ApiStudent | undefined;
  const diploma = data?.diploma;
  const contact = data?.contact;
  const linkType = data?.linkType ?? contact?.studentLinkType;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-sm text-blue-600 hover:text-blue-800"
      >
        Details
      </button>
      <BaseModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={student ? `${student.first_name ?? ''} ${student.last_name ?? ''}`.trim() || student.email || 'Student details' : 'Student details'}
      >
        {isLoading ? (
          <div className="py-8 text-center text-sm text-gray-500">Loading student details…</div>
        ) : error ? (
          <div className="py-2 text-sm text-red-600">
            Failed to load student details. Please try again.
          </div>
        ) : (
          <div className="space-y-5">
            {student && (
              <section className="space-y-2">
                <div className="flex items-center gap-3">
                  {student.picture && (
                    <img
                      src={getFileUrl(student.picture)}
                      alt={student.first_name ?? student.email ?? 'student'}
                      className="h-16 w-16 rounded-full object-cover border"
                    />
                  )}
                  <div>
                    <p className="text-base font-semibold text-gray-900">
                      {`${student.first_name ?? ''} ${student.last_name ?? ''}`.trim() || student.email || `#${student.id}`}
                    </p>
                    <p className="text-sm text-gray-500">{student.email}</p>
                    {student.phone && <p className="text-sm text-gray-500">{student.phone}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 uppercase text-xs">Nationality</p>
                    <p className="text-gray-900">{student.nationality || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 uppercase text-xs">Birthday</p>
                    <p className="text-gray-900">{student.birthday || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 uppercase text-xs">City</p>
                    <p className="text-gray-900">{student.city || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 uppercase text-xs">Country</p>
                    <p className="text-gray-900">{student.country || '—'}</p>
                  </div>
                </div>
              </section>
            )}

            {diploma && (
              <section className="rounded-2xl border border-gray-200 p-4 space-y-4 bg-gradient-to-br from-white to-blue-50/40">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-blue-500">Academic Record</p>
                    <h4 className="text-lg font-semibold text-gray-900 mt-1">{diploma.title || 'Diploma'}</h4>
                  </div>
                  <span className="text-xs rounded-full bg-blue-100 px-3 py-0.5 text-blue-700 font-semibold">
                    {diploma.status === 1 ? 'Active' : diploma.status === -1 ? 'Archived' : 'Draft'}
                  </span>
                </div>
                  <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-800">
                    <p><span className="text-gray-500">Diploma:</span> {diploma.diplome || '—'}</p>
                    <p><span className="text-gray-500">School:</span> {diploma.school || '—'}</p>
                    <p><span className="text-gray-500">Year:</span> {diploma.annee || '—'}</p>
                    <p><span className="text-gray-500">Status:</span> {diploma.status ?? '—'}</p>
                    <p className="sm:col-span-2">
                      <span className="text-gray-500">Location:</span>{' '}
                      {[diploma.city, diploma.country].filter(Boolean).join(', ') || '—'}
                    </p>
                  </div>
                  <div className="space-y-3">
                    {(diploma.diplome_picture_1 || diploma.diplome_picture_2) ? (
                      // Precompute safe URLs
                      (() => {
                        const picture1Url = diploma.diplome_picture_1 ? getFileUrl(diploma.diplome_picture_1) : '';
                        const picture2Url = diploma.diplome_picture_2 ? getFileUrl(diploma.diplome_picture_2) : '';
                        return (
                          <>
                            {picture1Url && (
                              <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreview({
                                      src: picture1Url,
                                      label: `${diploma.title || 'Diploma'} – picture 1`,
                                    })
                                  }
                                  className="w-full"
                                >
                                  <img
                                    className="h-48 w-full object-contain transition-transform duration-300 hover:scale-105"
                                    src={picture1Url}
                                    alt="Diploma picture 1"
                                  />
                                </button>
                              </div>
                            )}
                            {picture2Url && (
                              <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreview({
                                      src: picture2Url,
                                      label: `${diploma.title || 'Diploma'} – picture 2`,
                                    })
                                  }
                                  className="w-full"
                                >
                                  <img
                                    className="h-48 w-full object-contain transition-transform duration-300 hover:scale-105"
                                    src={picture2Url}
                                    alt="Diploma picture 2"
                                  />
                                </button>
                              </div>
                            )}
                          </>
                        );
                      })()
                    ) : (
                      <div className="flex h-36 items-center justify-center rounded-2xl border border-dashed border-gray-300 text-xs text-gray-500">
                        No diploma images uploaded.
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {contact && (
              <section className="rounded-lg border border-gray-200 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900">Contact</h4>
                  <span className="text-xs rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">
                    {contact.status === 1 ? 'Active' : contact.status === -1 ? 'Archived' : 'Draft'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
                  <p><span className="text-gray-500">Name:</span> {`${contact.firstname ?? ''} ${contact.lastname ?? ''}`.trim() || '—'}</p>
                  <p><span className="text-gray-500">Birthday:</span> {contact.birthday || '—'}</p>
                  <p><span className="text-gray-500">Email:</span> {contact.email || '—'}</p>
                  <p><span className="text-gray-500">Phone:</span> {contact.phone || '—'}</p>
                  <p><span className="text-gray-500">Address:</span> {contact.adress || '—'}</p>
                  <p><span className="text-gray-500">City:</span> {contact.city || '—'}</p>
                  <p><span className="text-gray-500">Country:</span> {contact.country || '—'}</p>
                </div>
              </section>
            )}

            {linkType && (
              <section className="rounded-lg border border-gray-200 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900">Link Type</h4>
                  <span className="text-xs rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">
                    {linkType.status === 1 ? 'Active' : linkType.status === 0 ? 'Disabled' : 'Draft'}
                  </span>
                </div>
                <p className="text-sm text-gray-700">
                  <span className="text-gray-500">Title:</span> {linkType.title || '—'}
                </p>
                {linkType.student_id && (
                  <p className="text-xs text-gray-500">Linked student ID: {linkType.student_id}</p>
                )}
              </section>
            )}

            {!student && !diploma && !contact && (
              <p className="text-sm text-gray-500">No details available for this student.</p>
            )}
          </div>
        )}
      </BaseModal>
      <BaseModal
        isOpen={!!preview}
        onClose={() => setPreview(null)}
        title={preview?.label || 'Diploma preview'}
      >
        {preview && (
          <div className="flex flex-col items-center gap-4">
            <img
              src={preview.src}
              alt={preview.label}
              className="max-h-[75vh] w-full object-contain rounded-2xl border bg-white"
            />
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Close Preview
            </button>
          </div>
        )}
      </BaseModal>
    </>
  );
};

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

  const { data: studentsResp, isLoading: studentsLoading } = useStudents({ page: 1, limit: MAX_FETCH_LIMIT });
  
  const studentsMap = useMemo(() => {
    const map = new Map<number, StudentLite>();
    ((studentsResp as PaginatedResponse<ApiStudent>)?.data || []).forEach((stu) => {
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

    const students = ((studentsResp as PaginatedResponse<ApiStudent>)?.data || [])
      .filter((stu) => stu?.status !== -2)
      .filter((stu) => !assignedIds.has(stu.id))
      .map((stu) => makeStudentLite(stu.id, stu))
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
  const { data: schoolYearsResp, isLoading: yearsLoading } = useSchoolYears({ page: 1, limit: 100 });
  const yearOptions: SearchSelectOption[] = useMemo(
    () => ((schoolYearsResp as PaginatedResponse<SchoolYear>)?.data || [])
      .map((year) => ({ value: year.id, label: year.title || `Year #${year.id}` })),
    [schoolYearsResp]
  );

  // Fetch classes filtered by year
  const classesParams = useMemo(() => ({
    page: 1,
    limit: 100,
    school_year_id: yearFilter === '' || yearFilter === undefined || yearFilter === null ? undefined : Number(yearFilter),
  }), [yearFilter]);
  
  const { data: classesResp, isLoading: classesLoading } = useClasses(classesParams);
  
  const classOptions: SearchSelectOption[] = useMemo(
    () => ((classesResp as PaginatedResponse<ClassEntity>)?.data || [])
      .filter((cls) => cls?.status !== -2)
      .map((cls) => ({ value: cls.id, label: cls.title || `Class #${cls.id}` })),
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
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as { message?: string })?.message || 'Failed to assign student';
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
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as { message?: string })?.message || 'Failed to unassign student';
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
                                <div className="flex items-center gap-3">
                                  <StudentDetailsButton studentId={item.id} />
                                  <button
                                    type="button"
                                    onClick={() => handleAssign(item.id)}
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                    disabled={isMutationLoading || !classFilter}
                                  >
                                    Assign
                                  </button>
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
                                <div className="flex items-center gap-3">
                                  <StudentDetailsButton studentId={item.student.id} />
                                  <button
                                    type="button"
                                    onClick={() => handleUnassign(item.assignmentId)}
                                    className="text-sm text-red-600 hover:text-red-800"
                                    disabled={isMutationLoading}
                                  >
                                    Remove
                                  </button>
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
          </DragDropContext>
        </div>
      )}

    </>
  );
};

export default ClassStudentsSection;


