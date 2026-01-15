import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { pagesApi } from '../../api/pages';
import { useRoles } from '../../hooks/useRoles';
import { useRolePages, useAssignPageToRole, useRemovePageFromRole } from '../../hooks/useRoles';
import { useUserRoles } from '../../hooks/useUserRoles';
import { useAuth } from '../../hooks/useAuth';
import type { Page } from '../../api/pages';
import Button from '../ui/Button';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { rolesApi } from '../../api/roles';
import { Search, FileText, ArrowRight, ArrowLeft, CheckCircle2, Circle, Loader2 } from 'lucide-react';

// Roles that have their own dashboards and cannot be assigned parameter routes
const RESTRICTED_ROLE_CODES = ['teacher', 'prof', 'student', 'parent', 'parents'];

const PageAccessSettings: React.FC = () => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoadingRole, setIsLoadingRole] = useState(false);
  
  // Local state for drag-and-drop
  const [assignedPages, setAssignedPages] = useState<Page[]>([]);
  const [unassignedPages, setUnassignedPages] = useState<Page[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  
  // Search states for each panel
  const [unassignedSearch, setUnassignedSearch] = useState('');
  const [assignedSearch, setAssignedSearch] = useState('');

  // Get current user's roles to prevent self-modification
  const { data: currentUserRoles = [] } = useUserRoles(currentUser?.id ?? null);
  const currentUserRoleIds = useMemo(
    () => new Set(currentUserRoles.map((r: { id: number }) => r.id)),
    [currentUserRoles]
  );
  
  const isManagingOwnRole = selectedRoleId !== null && currentUserRoleIds.has(selectedRoleId);

  // Fetch all roles
  const { data: rolesResp } = useRoles({ page: 1, limit: 100 });
  const allRoles = rolesResp?.data ?? [];
  
  // Filter out restricted roles
  const roles = useMemo(() => {
    return allRoles.filter(role => !RESTRICTED_ROLE_CODES.includes(role.code.toLowerCase()));
  }, [allRoles]);
  
  const isRestrictedRole = useMemo(() => {
    if (!selectedRoleId) return false;
    const selectedRole = allRoles.find(r => r.id === selectedRoleId);
    return selectedRole ? RESTRICTED_ROLE_CODES.includes(selectedRole.code.toLowerCase()) : false;
  }, [selectedRoleId, allRoles]);

  // Fetch all pages using custom query to handle pagination limit
  const { 
    data: allPages = [], 
    isLoading: pagesLoading, 
    isError: pagesError,
    error: pagesErrorData 
  } = useQuery({
    queryKey: ['pages', 'all'],
    queryFn: () => pagesApi.getAllPages(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 2, // Retry failed requests twice
  });

  // Fetch pages assigned to selected role (lazy loaded - only when role is selected)
  const { 
    data: rolePages, 
    isLoading: rolePagesLoading, 
    isError: rolePagesError,
    error: rolePagesErrorData,
    refetch: refetchRolePages 
  } = useRolePages(selectedRoleId);
  
  // Initialize local state when role or pages change
  // Only update when both allPages and rolePages are ready (prevent race conditions)
  useEffect(() => {
    // Don't update if pages are still loading or if there's no role selected
    if (!selectedRoleId || pagesLoading || rolePagesLoading) {
      if (!selectedRoleId) {
        // Clear state when no role is selected
        setAssignedPages([]);
        setUnassignedPages([]);
        setHasUnsavedChanges(false);
      }
      return;
    }

    // Only update if we have allPages data
    if (allPages.length > 0) {
      const assignedIds = new Set((rolePages || []).map(p => p.id));
      const assigned = allPages.filter(p => assignedIds.has(p.id));
      const unassigned = allPages.filter(p => !assignedIds.has(p.id));
      
      setAssignedPages(assigned);
      setUnassignedPages(unassigned);
      setHasUnsavedChanges(false);
    }
  }, [selectedRoleId, rolePages, allPages, pagesLoading, rolePagesLoading]);

  // Mutations
  const assignPageMut = useAssignPageToRole();
  const removePageMut = useRemovePageFromRole();

  // Show success message
  useEffect(() => {
    if (assignPageMut.isSuccess || removePageMut.isSuccess) {
      setSuccess(true);
      setError(null);
      setHasUnsavedChanges(false);
      refetchRolePages();
      queryClient.invalidateQueries({ queryKey: ['roles', 'all-pages'] });
      const timer = setTimeout(() => setSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [assignPageMut.isSuccess, removePageMut.isSuccess, refetchRolePages, queryClient]);

  // Show error
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

  const handleRoleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRoleId = e.target.value ? Number(e.target.value) : null;
    setIsLoadingRole(true);
    setSelectedRoleId(newRoleId);
    setUnassignedSearch('');
    setAssignedSearch('');
    setHasUnsavedChanges(false);
    setTimeout(() => setIsLoadingRole(false), 100);
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination || !selectedRoleId) return;

    // Prevent modifying own role or restricted roles
    if (isManagingOwnRole || isRestrictedRole) return;

    // Prevent drag if data is still loading
    if (loading || isAnyMutationPending) return;

    // If dropped in the same position
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const pageId = parseInt(draggableId);
    const page = source.droppableId === 'unassigned' 
      ? unassignedPages.find(p => p.id === pageId)
      : assignedPages.find(p => p.id === pageId);

    if (!page) return;

    setIsAssigning(true);
    setError(null);

    try {
      if (source.droppableId === 'unassigned' && destination.droppableId === 'assigned') {
        // Assign page
        await assignPageMut.mutateAsync({ roleId: selectedRoleId, pageId });
        // Optimistic update
        setUnassignedPages(prev => prev.filter(p => p.id !== pageId));
        setAssignedPages(prev => [...prev, page]);
        setHasUnsavedChanges(false);
      } else if (source.droppableId === 'assigned' && destination.droppableId === 'unassigned') {
        // Remove page
        await removePageMut.mutateAsync({ roleId: selectedRoleId, pageId });
        // Optimistic update
        setAssignedPages(prev => prev.filter(p => p.id !== pageId));
        setUnassignedPages(prev => [...prev, page]);
        setHasUnsavedChanges(false);
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || t('settings.failedToUpdateAccess');
      setError(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
      // Revert optimistic update on error
      refetchRolePages();
    } finally {
      setIsAssigning(false);
    }
  };

  const handleAssignAll = async () => {
    if (!selectedRoleId || isManagingOwnRole || isRestrictedRole || loading || isAnyMutationPending) return;
    
    setIsAssigning(true);
    setError(null);

    try {
      await Promise.all(
        unassignedPages.map(page => 
          assignPageMut.mutateAsync({ roleId: selectedRoleId, pageId: page.id })
        )
      );
      refetchRolePages();
      setHasUnsavedChanges(false);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || t('settings.failedToUpdateAccess');
      setError(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveAll = async () => {
    if (!selectedRoleId || isManagingOwnRole || isRestrictedRole || loading || isAnyMutationPending) return;
    
    setIsAssigning(true);
    setError(null);

    try {
      await Promise.all(
        assignedPages.map(page => 
          removePageMut.mutateAsync({ roleId: selectedRoleId, pageId: page.id })
        )
      );
      refetchRolePages();
      setHasUnsavedChanges(false);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || t('settings.failedToUpdateAccess');
      setError(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
    } finally {
      setIsAssigning(false);
    }
  };

  // Filter pages by search
  const filteredUnassigned = useMemo(() => {
    if (!unassignedSearch.trim()) return unassignedPages;
    const search = unassignedSearch.toLowerCase();
    return unassignedPages.filter(p => 
      p.title.toLowerCase().includes(search) || 
      p.route.toLowerCase().includes(search)
    );
  }, [unassignedPages, unassignedSearch]);

  const filteredAssigned = useMemo(() => {
    if (!assignedSearch.trim()) return assignedPages;
    const search = assignedSearch.toLowerCase();
    return assignedPages.filter(p => 
      p.title.toLowerCase().includes(search) || 
      p.route.toLowerCase().includes(search)
    );
  }, [assignedPages, assignedSearch]);

  const loading = pagesLoading || rolePagesLoading || isLoadingRole;
  const selectedRole = allRoles.find(r => r.id === selectedRoleId);
  const isAnyMutationPending = isAssigning || assignPageMut.isPending || removePageMut.isPending;
  
  // Show error if pages failed to load
  useEffect(() => {
    if (pagesError) {
      const errorMessage = (pagesErrorData as any)?.response?.data?.message || 
                          (pagesErrorData as any)?.message || 
                          t('settings.failedToLoadPages') || 
                          'Failed to load pages';
      setError(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
    }
  }, [pagesError, pagesErrorData, t]);

  useEffect(() => {
    if (rolePagesError && selectedRoleId) {
      const errorMessage = (rolePagesErrorData as any)?.response?.data?.message || 
                          (rolePagesErrorData as any)?.message || 
                          t('settings.failedToLoadRolePages') || 
                          'Failed to load role pages';
      setError(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
    }
  }, [rolePagesError, rolePagesErrorData, selectedRoleId, t]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-1">
          {t('settings.pageAccessManagement')}
        </h3>
        <p className="text-sm text-gray-600">
          {t('settings.assignPagesToProfiles')}
        </p>
      </div>

      {/* Info about restricted roles */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <p className="font-medium mb-1">
          {t('messages.restrictedRolesInfo') || 'Note: Teacher, Student, and Parent Roles'}
        </p>
        <p className="text-xs">
          {t('messages.restrictedRolesInfoDescription') || 'Teacher, student, and parent roles have their own dedicated dashboards and cannot be assigned parameter routes. They are automatically excluded from this page.'}
        </p>
      </div>

      {/* Error/Success Messages */}
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

      {/* Role Selector */}
      <div className="bg-white border-b border-gray-200 pb-4">
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
              className="w-full sm:w-auto min-w-[280px] rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none bg-white disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      {!selectedRoleId ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">{t('settings.pleaseSelectProfile')}</p>
          <p className="text-sm text-gray-400 mt-1">Select a role to manage page access</p>
        </div>
      ) : selectedRole && (
        <div className="space-y-6">
          {/* Warnings */}
          {isManagingOwnRole && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <p className="font-medium mb-1">
                {t('messages.selfManagementRestricted') || 'Self-Management Restricted'}
              </p>
              <p className="text-xs">
                {t('messages.cannotModifyOwnRolePagesDescription') || 'You cannot modify pages for your own role. Please ask another administrator to manage this role.'}
              </p>
            </div>
          )}
          
          {isRestrictedRole && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              <p className="font-medium mb-1">
                {t('messages.restrictedRoleInfo') || 'Dedicated Dashboard Role'}
              </p>
              <p className="text-xs">
                {t('messages.restrictedRoleInfoDescription') || 'This role has its own dedicated dashboard and cannot be assigned parameter routes.'}
              </p>
            </div>
          )}

          {/* Error State */}
          {(pagesError || (rolePagesError && selectedRoleId)) && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              <p className="font-medium mb-1">Error Loading Data</p>
              <p className="text-sm">
                {pagesError 
                  ? (t('settings.failedToLoadPages') || 'Failed to load pages. Please refresh the page.')
                  : (t('settings.failedToLoadRolePages') || 'Failed to load role pages. Please try again.')
                }
              </p>
            </div>
          )}

          {/* Drag and Drop Interface */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-3 text-gray-600">
                {pagesLoading 
                  ? (t('settings.loadingPages') || 'Loading pages...')
                  : (t('settings.loadingRolePages') || 'Loading role pages...')
                }
              </span>
            </div>
          ) : allPages.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No pages available</p>
              <p className="text-sm text-gray-400 mt-1">Pages will appear here once they are created</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Unassigned Pages Panel */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Circle className="w-4 h-4 text-gray-400" />
                        <h4 className="text-sm font-semibold text-gray-900">
                          Unassigned Pages
                        </h4>
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded-full">
                          {filteredUnassigned.length}
                        </span>
                      </div>
                      {filteredUnassigned.length > 0 && !isManagingOwnRole && !isRestrictedRole && (
                        <Button
                          onClick={handleAssignAll}
                          disabled={isAnyMutationPending || loading}
                          variant="secondary"
                          size="sm"
                          className="text-xs"
                        >
                          Assign All
                        </Button>
                      )}
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={unassignedSearch}
                        onChange={(e) => setUnassignedSearch(e.target.value)}
                        placeholder="Search pages..."
                        className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none bg-white"
                      />
                    </div>
                  </div>
                  <Droppable droppableId="unassigned">
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`min-h-[400px] max-h-[600px] overflow-y-auto p-4 transition-colors ${
                          snapshot.isDraggingOver
                            ? 'bg-blue-50'
                            : 'bg-white'
                        }`}
                      >
                        {isAssigning && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-xl z-20">
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="w-6 h-6 animate-spin text-primary" />
                              <span className="text-sm text-gray-600">Updating...</span>
                            </div>
                          </div>
                        )}
                        {filteredUnassigned.length === 0 ? (
                          <div className="text-center py-12">
                            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                            <p className="text-sm text-gray-500 font-medium">
                              {unassignedSearch ? 'No pages found' : 'All pages assigned'}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {unassignedSearch ? 'Try a different search term' : 'Drag pages here to remove access'}
                            </p>
                          </div>
                        ) : (
                          filteredUnassigned.map((page, index) => (
                            <Draggable
                              key={page.id}
                              draggableId={page.id.toString()}
                              index={index}
                              isDragDisabled={isAnyMutationPending || isManagingOwnRole || isRestrictedRole || loading}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`mb-2 p-3 bg-white border border-gray-200 rounded-lg shadow-sm cursor-move transition-all hover:shadow-md hover:border-gray-300 ${
                                    snapshot.isDragging
                                      ? 'shadow-lg border-primary ring-2 ring-primary ring-opacity-20'
                                      : ''
                                  } ${isAnyMutationPending ? 'opacity-50' : ''}`}
                                >
                                  <div className="flex items-start gap-3">
                                    <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-sm text-gray-900 truncate">
                                        {page.title}
                                      </div>
                                      <div className="text-xs text-gray-500 font-mono mt-0.5 truncate">
                                        {page.route}
                                      </div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
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

                {/* Assigned Pages Panel */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <h4 className="text-sm font-semibold text-gray-900">
                          Assigned Pages
                        </h4>
                        <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                          {filteredAssigned.length}
                        </span>
                      </div>
                      {filteredAssigned.length > 0 && !isManagingOwnRole && !isRestrictedRole && (
                        <Button
                          onClick={handleRemoveAll}
                          disabled={isAnyMutationPending || loading}
                          variant="secondary"
                          size="sm"
                          className="text-xs"
                        >
                          Remove All
                        </Button>
                      )}
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={assignedSearch}
                        onChange={(e) => setAssignedSearch(e.target.value)}
                        placeholder="Search pages..."
                        className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none bg-white"
                      />
                    </div>
                  </div>
                  <Droppable droppableId="assigned">
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`min-h-[400px] max-h-[600px] overflow-y-auto p-4 transition-colors ${
                          snapshot.isDraggingOver
                            ? 'bg-green-50'
                            : 'bg-white'
                        }`}
                      >
                        {filteredAssigned.length === 0 ? (
                          <div className="text-center py-12">
                            <CheckCircle2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                            <p className="text-sm text-gray-500 font-medium">
                              {assignedSearch ? 'No pages found' : 'No pages assigned'}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {assignedSearch ? 'Try a different search term' : 'Drag pages here to grant access'}
                            </p>
                          </div>
                        ) : (
                          filteredAssigned.map((page, index) => (
                            <Draggable
                              key={page.id}
                              draggableId={page.id.toString()}
                              index={index}
                              isDragDisabled={isAnyMutationPending || isManagingOwnRole || isRestrictedRole || loading}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`mb-2 p-3 bg-white border border-green-200 rounded-lg shadow-sm cursor-move transition-all hover:shadow-md hover:border-green-300 ${
                                    snapshot.isDragging
                                      ? 'shadow-lg border-green-500 ring-2 ring-green-500 ring-opacity-20'
                                      : ''
                                  } ${isAnyMutationPending ? 'opacity-50' : ''}`}
                                >
                                  <div className="flex items-start gap-3">
                                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-sm text-gray-900 truncate">
                                        {page.title}
                                      </div>
                                      <div className="text-xs text-gray-500 font-mono mt-0.5 truncate">
                                        {page.route}
                                      </div>
                                    </div>
                                    <ArrowLeft className="w-4 h-4 text-gray-400 flex-shrink-0" />
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
          )}
        </div>
      )}
    </div>
  );
};

export default PageAccessSettings;
