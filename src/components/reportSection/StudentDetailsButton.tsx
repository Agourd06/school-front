import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye } from 'lucide-react';
import BaseModal from '../modals/BaseModal';
import { studentsApi } from '../../api/students';
import type { Student as ApiStudent } from '../../api/students';
import { getFileUrl } from '../../utils/apiConfig';

interface StudentDetailsButtonProps {
  studentId?: number;
}

const StudentDetailsButton: React.FC<StudentDetailsButtonProps> = ({ studentId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [preview, setPreview] = useState<{ src: string; label: string } | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['studentDetails', studentId],
    queryFn: () => studentsApi.getDetails(Number(studentId)),
    enabled: Boolean(isOpen && studentId),
    staleTime: 60_000,
  });

  const student = data?.student as ApiStudent | undefined;
  const diploma = data?.diploma;
  const contact = data?.contact;
  const linkType = data?.linkType ?? contact?.studentLinkType;

  const handleOpen = () => {
    if (!studentId) return;
    setIsOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        disabled={!studentId}
        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="View student details"
        title="View student details"
      >
        <Eye className="h-4 w-4" />
      </button>

      <BaseModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={
          student
            ? `${student.first_name ?? ''} ${student.last_name ?? ''}`.trim() || student.email || 'Student details'
            : 'Student details'
        }
      >
        {isLoading ? (
          <div className="py-8 text-center text-sm text-gray-500">Loading student details…</div>
        ) : error ? (
          <div className="py-2 text-sm text-red-600">Failed to load student details. Please try again.</div>
        ) : (
          <div className="space-y-5">
            {student && (
              <section className="space-y-2">
                <div className="flex items-center gap-3">
                  {student.picture && (
                    <img
                      src={getFileUrl(student.picture)}
                      alt={student.first_name ?? student.email ?? 'student'}
                      className="h-14 w-14 rounded-full object-cover border"
                    />
                  )}
                  <div>
                    <p className="text-base	font-semibold text-gray-900">
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
                    <p>
                      <span className="text-gray-500">Diploma:</span> {diploma.diplome || '—'}
                    </p>
                    <p>
                      <span className="text-gray-500">School:</span> {diploma.school || '—'}
                    </p>
                    <p>
                      <span className="text-gray-500">Year:</span> {diploma.annee || '—'}
                    </p>
                    <p>
                      <span className="text-gray-500">Status:</span> {diploma.status ?? '—'}
                    </p>
                    <p className="sm:col-span-2">
                      <span className="text-gray-500">Location:</span>{' '}
                      {[diploma.city, diploma.country].filter(Boolean).join(', ') || '—'}
                    </p>
                  </div>
                  <div className="space-y-3">
                    {diploma.diplome_picture_1 || diploma.diplome_picture_2 ? (
                      <>
                        {diploma.diplome_picture_1 && (
                          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                            <button
                              type="button"
                              onClick={() =>
                                setPreview({
                                  src: getFileUrl(diploma.diplome_picture_1!),
                                  label: `${diploma.title || 'Diploma'} – picture 1`,
                                })
                              }
                              className="w-full"
                            >
                              <img
                                className="h-40 w-full object-contain transition-transform duration-300 hover:scale-105"
                                src={getFileUrl(diploma.diplome_picture_1)}
                                alt="Diploma picture 1"
                              />
                            </button>
                          </div>
                        )}
                        {diploma.diplome_picture_2 && (
                          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                            <button
                              type="button"
                              onClick={() =>
                                setPreview({
                                  src: getFileUrl(diploma.diplome_picture_2!),
                                  label: `${diploma.title || 'Diploma'} – picture 2`,
                                })
                              }
                              className="w-full"
                            >
                              <img
                                className="h-40 w-full object-contain transition-transform duration-300 hover:scale-105"
                                src={getFileUrl(diploma.diplome_picture_2)}
                                alt="Diploma picture 2"
                              />
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-gray-300 text-xs text-gray-500">
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
                  <p>
                    <span className="text-gray-500">Name:</span>{' '}
                    {`${contact.firstname ?? ''} ${contact.lastname ?? ''}`.trim() || '—'}
                  </p>
                  <p>
                    <span className="text-gray-500">Birthday:</span> {contact.birthday || '—'}
                  </p>
                  <p>
                    <span className="text-gray-500">Email:</span> {contact.email || '—'}
                  </p>
                  <p>
                    <span className="text-gray-500">Phone:</span> {contact.phone || '—'}
                  </p>
                  <p>
                    <span className="text-gray-500">Address:</span> {contact.adress || '—'}
                  </p>
                  <p>
                    <span className="text-gray-500">City:</span> {contact.city || '—'}
                  </p>
                  <p>
                    <span className="text-gray-500">Country:</span> {contact.country || '—'}
                  </p>
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

      <BaseModal isOpen={!!preview} onClose={() => setPreview(null)} title={preview?.label || 'Diploma preview'}>
        {preview && (
          <div className="flex flex-col items-center gap-4">
            <img
              src={preview.src}
              alt={preview.label}
              className="max-h-[70vh] w-full object-contain rounded-2xl border bg-white"
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

export default StudentDetailsButton;


