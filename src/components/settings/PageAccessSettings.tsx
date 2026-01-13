import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { usePages } from '../../hooks/usePages';
import { useRoles } from '../../hooks/useRoles';
import { useRolePages, useAssignPageToRole, useRemovePageFromRole } from '../../hooks/useRoles';
import type { Page } from '../../api/pages';
import Button from '../ui/Button';
import CreatePagesSection from './CreatePagesSection';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { rolesApi } from '../../api/roles';

const EMPTY_META = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrevious: false,
};

const PageAccessSettings: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [search, setSearch] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoadingRole, setIsLoadingRole] = useState(false);

  const params = useMemo(
    () => ({
      page: pagination.page,
      limit: pagination.limit,
      search: search.trim() || undefined,
    }),
    [pagination, search]
  );

  // Fetch all roles
  const { data: rolesResp } = useRoles({ page: 1, limit: 100 });
  const roles = rolesResp?.data ?? [];

  // Fetch pages with pagination and search
  const { data: pagesResp, isLoading: pagesLoading } = usePages(params);
  const pages = pagesResp?.data ?? [];
  const meta = pagesResp?.meta ?? EMPTY_META;

  // Fetch pages assigned to selected role
  const { data: rolePages, isLoading: rolePagesLoading } = useRolePages(selectedRoleId);
  const assignedPageIds = useMemo(
    () => new Set((rolePages || []).map(p => p.id)),
    [rolePages]
  );

  // Fetch pages for all roles to show in summary
  const rolePagesQueries = useQuery({
    queryKey: ['roles', 'all-pages'],
    queryFn: async () => {
      const rolePagesMap = new Map<number, Page[]>();
      await Promise.all(
        roles.map(async (role) => {
          try {
            const pages = await rolesApi.getPages(role.id);
            rolePagesMap.set(role.id, pages);
          } catch (error) {
            console.error(`Failed to fetch pages for role ${role.id}:`, error);
            rolePagesMap.set(role.id, []);
          }
        })
      );
      return rolePagesMap;
    },
    enabled: roles.length > 0,
  });

  const rolePagesMap = rolePagesQueries.data || new Map<number, Page[]>();

  // Mutations for assigning/removing pages
  const assignPageMut = useAssignPageToRole();
  const removePageMut = useRemovePageFromRole();

  // Show success message after successful mutation
  useEffect(() => {
    if (assignPageMut.isSuccess || removePageMut.isSuccess) {
      setSuccess(true);
      setError(null);
      const timer = setTimeout(() => setSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [assignPageMut.isSuccess, removePageMut.isSuccess]);

  // Show error on mutation failure
  useEffect(() => {
    if (assignPageMut.isError) {
      const errorMessage = (assignPageMut.error as any)?.response?.data?.message || t('settings.failedToUpdateAccess');
      setError(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
    }
    if (removePageMut.isError) {
      const errorMessage = (removePageMut.error as any)?.response?.data?.message || t('settings.failedToUpdateAccess');
      setError(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
    }
  }, [assignPageMut.isError, removePageMut.isError, t]);

  // Clear loading state when role pages finish loading
  useEffect(() => {
    if (!rolePagesLoading && isLoadingRole) {
      setIsLoadingRole(false);
    }
  }, [rolePagesLoading, isLoadingRole]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleRoleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRoleId = e.target.value ? Number(e.target.value) : null;
    setIsLoadingRole(true);
    setSelectedRoleId(newRoleId);
    setPagination({ page: 1, limit: 10 });
    setSearch('');
    // Wait a bit to show loading state, then it will be cleared when rolePagesLoading becomes false
    setTimeout(() => setIsLoadingRole(false), 100);
  };

  const handleTogglePage = async (pageId: number) => {
    if (!selectedRoleId) return;

    setError(null);
    if (assignedPageIds.has(pageId)) {
      await removePageMut.mutateAsync({ roleId: selectedRoleId, pageId });
    } else {
      await assignPageMut.mutateAsync({ roleId: selectedRoleId, pageId });
    }
    // Invalidate the all-pages query to refresh summary
    queryClient.invalidateQueries({ queryKey: ['roles', 'all-pages'] });
  };

  const loading = pagesLoading || rolePagesLoading || isLoadingRole;
  const selectedRole = roles.find(r => r.id === selectedRoleId);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('settings.pageAccessManagement')}</h3>
        <p className="text-sm text-gray-600">
          {t('settings.assignPagesToProfiles')}
        </p>
      </div>

      {/* Create Pages Section */}
      <CreatePagesSection onPagesCreated={() => {}} />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {t('settings.accessUpdatedSuccessfully')}
        </div>
      )}

      <div>
        <label htmlFor="role-select" className="block text-sm font-medium text-gray-700 mb-2">
          {t('settings.selectProfile')}
        </label>
        <div className="relative">
          <select
            id="role-select"
            value={selectedRoleId || ''}
            onChange={handleRoleChange}
            disabled={isLoadingRole || rolePagesLoading}
            className="w-full sm:w-auto rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none bg-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">{t('settings.selectProfilePlaceholder')}</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.label} ({role.code})
              </option>
            ))}
          </select>
          {(isLoadingRole || rolePagesLoading) && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            </div>
          )}
        </div>
        {(isLoadingRole || rolePagesLoading) && (
          <p className="mt-2 text-sm text-gray-500">{t('settings.loadingRolePages')}</p>
        )}
      </div>

      {selectedRoleId && selectedRole && (
        <div className="space-y-4">
          {/* Search Input */}
          <div>
            <label htmlFor="page-search" className="block text-sm font-medium text-gray-700 mb-2">
              {t('settings.searchPages')}
            </label>
            <input
              id="page-search"
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder={t('settings.searchByTitleOrRoute')}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none bg-white"
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {t('settings.checkPagesToAssign')} <strong>{selectedRole.label}</strong> {t('settings.profile')}
            </p>
            <span className="text-sm font-medium text-gray-700">
              {t('settings.showingPagesOf', { count: pages.length, total: meta.total })}
              {assignedPageIds.size > 0 && ` • ${assignedPageIds.size} ${t('settings.selected')}`}
            </span>
          </div>

          {loading && pages.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">{t('settings.loadingPages')}</p>
            </div>
          ) : pages.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">
                {search ? t('settings.noPagesFound') : t('settings.noPagesAvailable')}
              </p>
            </div>
          ) : (
            <>
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {pages.map((page) => (
                  <label
                    key={page.id}
                    className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={assignedPageIds.has(page.id)}
                      onChange={() => handleTogglePage(page.id)}
                      disabled={assignPageMut.isPending || removePageMut.isPending}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded disabled:opacity-50"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{page.title}</div>
                      <div className="text-sm text-gray-500 font-mono">{page.route}</div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Pagination Controls */}
              {meta.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                  <div className="text-sm text-gray-600">
                    {t('settings.pageOfTotal', { page: meta.page, totalPages: meta.totalPages })} • {meta.total} {t('settings.totalPages')}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                      disabled={!meta.hasPrevious || loading}
                      variant="secondary"
                      size="sm"
                    >
                      {t('common.previous')}
                    </Button>
                    <Button
                      onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                      disabled={!meta.hasNext || loading}
                      variant="secondary"
                      size="sm"
                    >
                      {t('common.next')}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {(assignPageMut.isPending || removePageMut.isPending) && (
            <div className="text-sm text-gray-600 text-center">
              {t('settings.saving')}
            </div>
          )}
        </div>
      )}

      {!selectedRoleId && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">{t('settings.pleaseSelectProfile')}</p>
        </div>
      )}

      {/* Summary Section: Show pages assigned to each role */}
      {roles.length > 0 && (
        <div className="mt-8 border-t border-gray-200 pt-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">
            {t('settings.rolePagesSummary')}
          </h4>
          <p className="text-sm text-gray-600 mb-4">
            {t('settings.rolePagesSummaryDescription')}
          </p>
          
          {rolePagesQueries.isLoading ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">{t('settings.loadingRolePagesSummary')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {roles.map((role) => {
                const rolePages = rolePagesMap.get(role.id) || [];
                return (
                  <div
                    key={role.id}
                    className={`border rounded-lg p-4 ${
                      selectedRoleId === role.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-900">
                        {role.label} ({role.code})
                      </h5>
                      <span className="text-sm text-gray-500">
                        {rolePages.length} {t('settings.pagesAssigned')}
                      </span>
                    </div>
                    {rolePages.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">
                        {t('settings.noPagesAssignedToRole')}
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {rolePages.map((page) => (
                          <span
                            key={page.id}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-700 border border-gray-200"
                          >
                            <span className="font-semibold">{page.title}</span>
                            <span className="text-gray-500 font-mono">({page.route})</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PageAccessSettings;

