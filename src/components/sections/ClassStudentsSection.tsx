import React, { useMemo, useState } from 'react';
import StatusBadge from '../../components/StatusBadge';
import { useClassStudents, useDeleteClassStudent } from '../../hooks/useClassStudents';
import { ClassStudentModal, DeleteModal } from '../modals';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import { useClasses } from '../../hooks/useClasses';
import { useStudents } from '../../hooks/useStudents';
import { useCompanies } from '../../hooks/useCompanies';
import type { ClassStudentAssignment, GetClassStudentParams } from '../../api/classStudent';
import BaseModal from '../modals/BaseModal';

const ClassStudentsSection: React.FC = () => {
  const [classFilter, setClassFilter] = useState<number | ''>('');
  const [studentFilter, setStudentFilter] = useState<number | ''>('');
  const [companyFilter, setCompanyFilter] = useState<number | ''>('');
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [detailsClassId, setDetailsClassId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name?: string } | null>(null);

  // Fetch assignments to group by class (using max allowed limit)
  const params: GetClassStudentParams = {
    page: 1,
    limit: 100, // Max allowed by API
    class_id: classFilter === '' ? undefined : Number(classFilter),
    student_id: studentFilter === '' ? undefined : Number(studentFilter),
    company_id: companyFilter === '' ? undefined : Number(companyFilter),
  };

  const { data: response, isLoading, error } = useClassStudents(params);

  // Group assignments by class_id
  const classesWithStudents = useMemo(() => {
    if (!response?.data) return [];
    
    const grouped = new Map<number, {
      class: { id: number; title?: string; status?: number };
      students: ClassStudentAssignment[];
    }>();

    response.data.forEach((assignment: ClassStudentAssignment) => {
      const classId = assignment.class_id;
      if (!grouped.has(classId)) {
        grouped.set(classId, {
          class: assignment.class || { id: classId, title: `Class #${classId}` },
          students: [],
        });
      }
      grouped.get(classId)!.students.push(assignment);
    });

    // Sort students by tri, then by name
    grouped.forEach((group) => {
      group.students.sort((a, b) => {
        if (a.tri !== b.tri) return (a.tri ?? 0) - (b.tri ?? 0);
        const aName = `${a.student?.first_name ?? ''} ${a.student?.last_name ?? ''}`.trim();
        const bName = `${b.student?.first_name ?? ''} ${b.student?.last_name ?? ''}`.trim();
        return aName.localeCompare(bName);
      });
    });

    return Array.from(grouped.values()).sort((a, b) => 
      (a.class.title || `Class #${a.class.id}`).localeCompare(b.class.title || `Class #${b.class.id}`)
    );
  }, [response?.data]);

  const { data: classesResp, isLoading: classesLoading } = useClasses({ page: 1, limit: 100 } as any);
  const classOptions: SearchSelectOption[] = useMemo(
    () => (((classesResp as any)?.data) || [])
      .filter((cls: any) => cls?.status !== -2)
      .map((cls: any) => ({ value: cls.id, label: cls.title || `Class #${cls.id}` })),
    [classesResp]
  );
  // classLabelMap removed as it's not used in the new layout

  const { data: studentsResp, isLoading: studentsLoading } = useStudents({ page: 1, limit: 100 } as any);
  const studentOptions: SearchSelectOption[] = useMemo(
    () => (((studentsResp as any)?.data) || [])
      .filter((stu: any) => stu?.status !== -2)
      .map((stu: any) => {
        const fullName = `${stu.first_name ?? ''} ${stu.last_name ?? ''}`.trim();
        return { value: stu.id, label: fullName || stu.email || `Student #${stu.id}` };
      }),
    [studentsResp]
  );
  const studentLabelMap = useMemo(() => new Map(studentOptions.map((opt) => [Number(opt.value), opt.label])), [studentOptions]);

  const { data: companiesResp, isLoading: companiesLoading } = useCompanies({ page: 1, limit: 100 } as any);
  const companyOptions: SearchSelectOption[] = useMemo(
    () => (((companiesResp as any)?.data) || [])
      .filter((company: any) => company?.status !== -2)
      .map((company: any) => ({
        value: company.id,
        label: company.title || company.name || `Company #${company.id}`,
      })),
    [companiesResp]
  );
  const companyLabelMap = useMemo(() => new Map(companyOptions.map((opt) => [Number(opt.value), opt.label])), [companyOptions]);

  const deleteMut = useDeleteClassStudent();

  const handleDeleteClass = (classId: number) => {
    const classData = classesWithStudents.find(c => c.class.id === classId);
    if (!classData) return;
    const className = classData.class.title || `Class #${classId}`;
    setDeleteTarget({ id: classId, name: className });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    // Delete all assignments for this class
    const classData = classesWithStudents.find(c => c.class.id === deleteTarget.id);
    if (classData) {
      try {
        // Delete all student assignments for this class
        await Promise.all(
          classData.students.map(assignment => 
            deleteMut.mutateAsync(assignment.id)
          )
        );
        setDeleteTarget(null);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const getStudentDisplay = (student: ClassStudentAssignment['student'], studentId: number) => {
    if (student?.first_name || student?.last_name) {
      return `${student.first_name ?? ''} ${student.last_name ?? ''}`.trim();
    }
    return studentLabelMap.get(studentId) || student?.email || `Student #${studentId}`;
  };

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Class Assignments</h2>
          <button
            onClick={() => {
              setSelectedClassId(null);
              setIsManageModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Assign Student to Class
          </button>
        </div>

        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <SearchSelect
            label="Filter by Class"
            value={classFilter}
            onChange={(value) => setClassFilter(value === '' ? '' : Number(value))}
            options={classOptions}
            placeholder="All classes"
            isClearable
            isLoading={classesLoading}
          />
          <SearchSelect
            label="Filter by Student"
            value={studentFilter}
            onChange={(value) => setStudentFilter(value === '' ? '' : Number(value))}
            options={studentOptions}
            placeholder="All students"
            isClearable
            isLoading={studentsLoading}
          />
          <SearchSelect
            label="Filter by Company"
            value={companyFilter}
            onChange={(value) => setCompanyFilter(value === '' ? '' : Number(value))}
            options={companyOptions}
            placeholder="All companies"
            isClearable
            isLoading={companiesLoading}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          <span className="ml-2 text-gray-600">Loading classes...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Error loading classes: {(error as any)?.message || 'Unknown error'}</p>
        </div>
      ) : classesWithStudents.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No classes found. Click "Assign Student to Class" to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classesWithStudents.map(({ class: classData, students }) => (
            <div
              key={classData.id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Class Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {classData.title || `Class #${classData.id}`}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {students.length} {students.length === 1 ? 'student' : 'students'}
                    </p>
                  </div>
                  <StatusBadge value={classData.status ?? 1} />
                </div>
              </div>

              {/* Students Grid */}
              <div className="p-4">
                {students.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No students assigned</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {students.slice(0, 6).map((assignment) => {
                      const studentDisplay = getStudentDisplay(assignment.student, assignment.student_id);
                      return (
                        <div
                          key={assignment.id}
                          className="p-2 bg-gray-50 rounded-md text-center border border-gray-200 hover:bg-gray-100 transition-colors"
                          title={studentDisplay}
                        >
                          <p className="text-xs font-medium text-gray-900 truncate">
                            {studentDisplay}
                          </p>
                          {assignment.tri !== undefined && (
                            <p className="text-xs text-gray-500 mt-1">#{assignment.tri + 1}</p>
                          )}
                        </div>
                      );
                    })}
                    {students.length > 6 && (
                      <div className="p-2 bg-blue-50 rounded-md text-center border border-blue-200">
                        <p className="text-xs font-medium text-blue-900">
                          +{students.length - 6} more
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t border-gray-200 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setSelectedClassId(classData.id);
                    setIsManageModalOpen(true);
                  }}
                  className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                >
                  Manage
                </button>
                <button
                  onClick={() => setDetailsClassId(classData.id)}
                  className="flex-1 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors"
                >
                  Details
                </button>
                <button
                  onClick={() => handleDeleteClass(classData.id)}
                  className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                  title="Delete all assignments for this class"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manage Class Modal */}
      {isManageModalOpen && (
        <ClassStudentModal
          isOpen
          onClose={() => {
            setIsManageModalOpen(false);
            setSelectedClassId(null);
          }}
          classId={selectedClassId}
        />
      )}

      {/* Details Modal */}
      {detailsClassId !== null && (
        <BaseModal
          isOpen
          onClose={() => setDetailsClassId(null)}
          title={`Class Details: ${classesWithStudents.find(c => c.class.id === detailsClassId)?.class.title || `Class #${detailsClassId}`}`}
        >
          <div className="max-h-96 overflow-y-auto">
            {(() => {
              const classData = classesWithStudents.find(c => c.class.id === detailsClassId);
              if (!classData) return null;

              return (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Class Information</h4>
                    <div className="bg-gray-50 p-3 rounded-md space-y-1">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Title:</span> {classData.class.title || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Status:</span> <StatusBadge value={classData.class.status ?? 1} />
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Total Students:</span> {classData.students.length}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">All Students ({classData.students.length})</h4>
                    <div className="space-y-2">
                      {classData.students.map((assignment) => {
                        const studentDisplay = getStudentDisplay(assignment.student, assignment.student_id);
                        const companyLabel = assignment.company?.title || assignment.company?.name || 
                          (assignment.company_id ? companyLabelMap.get(assignment.company_id) : '—');
                        const createdAt = assignment.created_at ? new Date(assignment.created_at).toLocaleString() : null;

                        return (
                          <div key={assignment.id} className="bg-gray-50 p-3 rounded-md border border-gray-200">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{studentDisplay}</p>
                                {assignment.student?.email && (
                                  <p className="text-xs text-gray-500 mt-1">{assignment.student.email}</p>
                                )}
                                <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                                  <span>Order: #{assignment.tri !== undefined ? assignment.tri + 1 : '—'}</span>
                                  {companyLabel !== '—' && <span>• Company: {companyLabel}</span>}
                                  <span>• Status: <StatusBadge value={assignment.status} /></span>
                                </div>
                                {createdAt && (
                                  <p className="text-xs text-gray-400 mt-1">Assigned: {createdAt}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </BaseModal>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={!!deleteTarget}
        title="Delete All Assignments"
        entityName={deleteTarget?.name ? `all student assignments for ${deleteTarget.name}` : undefined}
        message={deleteTarget ? `Are you sure you want to remove all students from this class? This action cannot be undone.` : undefined}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMut.isPending}
      />
    </>
  );
};

export default ClassStudentsSection;


