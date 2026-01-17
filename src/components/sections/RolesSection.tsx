import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyRound } from 'lucide-react';
import { useRoles, useDeleteRole } from '../../hooks/useRoles';
import { Button, EditButton, DeleteButton, PageHeader } from '../ui';
import Pagination from '../Pagination';
import DeleteModal from '../modals/DeleteModal';
import RoleModal from '../modals/RoleModal';
import type { Role } from '../../api/roles';
import { usePermissions } from '../../utils/permissions';

const EMPTY_META = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  hasNext: false,
  hasPrevious: false,
};

const RolesSection: React.FC = () => {
  const { t } = useTranslation();
  const { isAdmin } = usePermissions(); // SECURITY: Use server-validated permissions
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [filters] = useState({ search: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const params = useMemo(
    () => ({
      page: pagination.page,
      limit: pagination.limit,
      search: filters.search.trim() || undefined,
    }),
    [filters, pagination]
  );

  const { data: rolesResp, isLoading, refetch } = useRoles(params);
  // Filter out 'prof' role - it's deprecated, use 'teacher' instead
  const roles = (rolesResp?.data ?? []).filter(role => role.code !== 'prof');
  const meta = rolesResp?.meta ?? { ...EMPTY_META, page: pagination.page, limit: pagination.limit };

  const deleteRoleMut = useDeleteRole();

  const openCreateModal = () => {
    setEditingRole(null);
    setModalOpen(true);
  };

  const openEditModal = (role: Role) => {
    setEditingRole(role);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingRole(null);
    refetch(); // Refresh roles list after create/update
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRoleMut.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      setAlert({ type: 'success', message: t('messages.roleDeletedSuccessfully') || 'Role deleted successfully' });
      refetch();
    } catch (error) {
      setAlert({ type: 'error', message: (error as Error).message || 'Failed to delete role' });
    }
  };

  // Only admins can access this page
  if (!isAdmin()) {
    return (
      <div className="p-6 text-center">
        <p className="text-danger">Access denied. Admin role required.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titleKey="pages.rolesTitle"
        descriptionKey="pages.rolesDescription"
        icon={<KeyRound className="w-5 h-5" />}
        actions={
          <Button variant="primary" onClick={openCreateModal}>
            + {t('sections.addRole') || 'Add Role'}
          </Button>
        }
      />

      {alert && (
        <div className={`rounded-md border px-4 py-2 text-sm ${
          alert.type === 'success'
            ? 'border-success-light bg-success-light text-success-dark'
            : 'border-danger-light bg-danger-light text-danger-dark'
        }`}>
          {alert.message}
        </div>
      )}

      <div className="bg-white shadow-md rounded-xl border border-gray-200 overflow-hidden transition-shadow duration-200 hover:shadow-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Label</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Type</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-500">
                    {t('forms.loading') || 'Loading...'}
                  </td>
                </tr>
              ) : roles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-500">
                    {t('forms.noRolesFound') || 'No roles found'}
                  </td>
                </tr>
              ) : (
                roles.map((role) => (
                  <tr key={role.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">#{role.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{role.code}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{role.label}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        role.is_system ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {role.is_system ? 'System' : 'Custom'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {!role.is_system && (
                          <>
                            <EditButton onClick={() => openEditModal(role)} />
                            <DeleteButton onClick={() => setDeleteTarget(role)} />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
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

      <RoleModal
        isOpen={modalOpen}
        onClose={closeModal}
        role={editingRole}
      />

      <DeleteModal
        isOpen={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={deleteRoleMut.isPending}
        title={t('forms.deleteRole') || 'Delete Role'}
        entityName={deleteTarget?.label}
      />
    </div>
  );
};

export default RolesSection;
