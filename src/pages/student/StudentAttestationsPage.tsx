import React, { useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useStudentByEmail } from '../../hooks/useStudentByEmail';
import { useStudentAttestations } from '../../hooks/useStudentAttestations';
import SearchSelect, { type SearchSelectOption } from '../../components/inputs/SearchSelect';
import Pagination from '../../components/Pagination';
import BaseModal from '../../components/modals/BaseModal';
import { FileCheck, CheckCircle2, Clock, XCircle } from 'lucide-react';
import type { StudentAttestation } from '../../api/studentAttestation';
import { STATUS_VALUE_LABEL } from '../../constants/status';

const EMPTY_META = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  hasNext: false,
  hasPrevious: false,
};

const statusStyles: Record<number, string> = {
  2: 'bg-warning-badge text-warning-dark',
  1: 'bg-success-badge text-success-dark',
  0: 'bg-muted-badge text-muted-dark',
  [-1]: 'bg-accent-badge text-accent-dark',
  [-2]: 'bg-danger-badge text-danger-dark',
};

const getStatusFilterOptions = (): SearchSelectOption[] => [
  { value: 'all', label: 'All Statuses' },
  { value: '0', label: 'Pending' },
  { value: '1', label: 'Delivered' },
  { value: '2', label: 'In Progress' },
];

const formatDate = (dateString?: string | null): string => {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
};

const StudentAttestationsPage: React.FC = () => {
  const { user } = useAuth();
  const { data: studentByEmail } = useStudentByEmail(user?.email);
  const studentId = studentByEmail?.id;

  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [filters, setFilters] = useState({
    status: 'all',
  });
  const [detailsAttestation, setDetailsAttestation] = useState<StudentAttestation | null>(null);

  const statusFilterOptions = useMemo(() => getStatusFilterOptions(), []);

  const params = useMemo(
    () => ({
      page: pagination.page,
      limit: pagination.limit,
      Idstudent: studentId,
      Status:
        filters.status === 'all'
          ? undefined
          : filters.status !== ''
          ? Number(filters.status)
          : undefined,
    }),
    [filters, pagination, studentId]
  );

  const {
    data: studentAttestationsResp,
    isLoading,
  } = useStudentAttestations(params);

  const studentAttestations = studentAttestationsResp?.data ?? [];
  const meta = studentAttestationsResp?.meta ?? { ...EMPTY_META, page: pagination.page, limit: pagination.limit };

  const handleFilterChange = (field: keyof typeof filters) => (value: number | string | '') => {
    setFilters((prev) => ({
      ...prev,
      [field]: value === undefined || value === null ? 'all' : String(value),
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const getStatusIcon = (status: number) => {
    switch (status) {
      case 1:
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 2:
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 0:
        return <Clock className="w-5 h-5 text-gray-600" />;
      default:
        return <XCircle className="w-5 h-5 text-red-600" />;
    }
  };

  if (!studentId) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">Student profile not found</div>
        <p className="text-sm text-gray-400">
          Please contact your administrator to set up your student account.
        </p>
      </div>
    );
  }

  // Group attestations by status
  const deliveredAttestations = studentAttestations.filter((sa) => {
    const status = typeof sa.Status === 'number' ? sa.Status : 0;
    return status === 1; // Delivered
  });

  const requestedAttestations = studentAttestations.filter((sa) => {
    const status = typeof sa.Status === 'number' ? sa.Status : 0;
    return status !== 1; // Not delivered (pending, in progress, etc.)
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <FileCheck className="w-6 h-6 text-primary" />
          My Attestations
        </h2>
        <p className="text-gray-600">View your requested and delivered attestations</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Delivered Card */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-green-700 mb-1">Delivered</div>
              <div className="text-3xl font-bold text-green-900">{deliveredAttestations.length}</div>
              <div className="text-xs text-green-600 mt-1">Attestations ready</div>
            </div>
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
        </div>

        {/* Requested Card */}
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-yellow-700 mb-1">Requested</div>
              <div className="text-3xl font-bold text-yellow-900">{requestedAttestations.length}</div>
              <div className="text-xs text-yellow-600 mt-1">In progress or pending</div>
            </div>
            <Clock className="w-12 h-12 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SearchSelect
            label="Status"
            value={filters.status}
            onChange={handleFilterChange('status')}
            options={statusFilterOptions}
            isClearable={false}
          />
        </div>
      </div>

      {/* Attestations List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading your attestations...</div>
        </div>
      ) : studentAttestations.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
          <FileCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <div className="text-gray-500 mb-2 text-lg font-medium">No attestations found</div>
          <p className="text-sm text-gray-400">
            {filters.status !== 'all'
              ? 'Try adjusting your filters to see more results.'
              : 'You have not requested any attestations yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Attestation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Requested Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Delivery Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {studentAttestations.map((sa) => {
                  const statusValue = typeof sa.Status === 'number' ? sa.Status : 0;
                  const isDelivered = statusValue === 1;
                  return (
                    <tr key={sa.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {sa.attestation?.title || 'Attestation'}
                        </div>
                        {sa.attestation?.description && (
                          <div 
                            className="text-xs text-gray-500 mt-1 line-clamp-2 prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: sa.attestation.description }}
                          />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatDate(sa.dateask)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {isDelivered && sa.datedelivery ? (
                          <span className="flex items-center gap-1 text-green-600 font-medium">
                            <CheckCircle2 className="w-4 h-4" />
                            {formatDate(sa.datedelivery)}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            statusStyles[statusValue] ?? 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {getStatusIcon(statusValue)}
                          {STATUS_VALUE_LABEL[statusValue] ?? 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setDetailsAttestation(sa)}
                          className="text-primary hover:text-primary/80 font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={meta.page}
            totalPages={meta.totalPages}
            totalItems={meta.total}
            itemsPerPage={meta.limit}
            hasNext={meta.hasNext}
            hasPrevious={meta.hasPrevious}
            onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
            onPageSizeChange={(limit) => setPagination({ page: 1, limit })}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Details Modal */}
      <BaseModal
        isOpen={!!detailsAttestation}
        onClose={() => setDetailsAttestation(null)}
        title={detailsAttestation?.attestation?.title || 'Attestation Details'}
        className="sm:max-w-2xl"
      >
        {detailsAttestation && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <div 
                className="text-sm text-gray-900 prose prose-sm max-w-none border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-[60vh] overflow-y-auto"
                dangerouslySetInnerHTML={{ 
                  __html: detailsAttestation.attestation?.description || '<p class="text-gray-500 italic">No description available</p>' 
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Requested Date</label>
                <div className="text-sm text-gray-900">{formatDate(detailsAttestation.dateask)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
                <div className="text-sm text-gray-900">
                  {detailsAttestation.datedelivery ? formatDate(detailsAttestation.datedelivery) : '—'}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${
                  statusStyles[typeof detailsAttestation.Status === 'number' ? detailsAttestation.Status : 0] ??
                  'bg-gray-100 text-gray-600'
                }`}
              >
                {getStatusIcon(typeof detailsAttestation.Status === 'number' ? detailsAttestation.Status : 0)}
                {STATUS_VALUE_LABEL[typeof detailsAttestation.Status === 'number' ? detailsAttestation.Status : 0] ??
                  'Unknown'}
              </span>
            </div>
            {detailsAttestation.description && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                <div 
                  className="text-sm text-gray-900 prose prose-sm max-w-none border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-[60vh] overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: detailsAttestation.description }}
                />
              </div>
            )}
          </div>
        )}
      </BaseModal>
    </div>
  );
};

export default StudentAttestationsPage;
