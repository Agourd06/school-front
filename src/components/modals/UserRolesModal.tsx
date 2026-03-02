import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import BaseModal from './BaseModal';
import ConfirmModal from './ConfirmModal';
import { useUserRoles, useAssignRoleToUser, useRemoveRoleFromUser } from '../../hooks/useUserRoles';
import { useRoles } from '../../hooks/useRoles';
import { useAuth } from '../../hooks/useAuth';
import { useConfirm } from '../../hooks/useConfirm';
import { Button } from '../ui';
import { ChevronRight, ChevronLeft, Shield, ShieldCheck, User as UserIcon } from 'lucide-react';
import { getFileUrl } from '../../utils/apiConfig';
import type { User } from '../../api/users';
import type { Role } from '../../api/roles';

const RESTRICTED_ROLE_CODES = ['teacher', 'student', 'parent', 'parents', 'prof', 'eleve', 'etudiant'];

interface UserRolesModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
}

const UserRolesModal: React.FC<UserRolesModalProps> = ({ isOpen, onClose, user }) => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const userId = user?.id ?? null;
  
  const { data: userRoles = [], refetch: refetchUserRoles } = useUserRoles(userId);
  const { data: rolesResp } = useRoles({ page: 1, limit: 100 });
  
  // Filter out restricted roles (teacher, student, parent, prof)
  const filteredRoles = useMemo(() => {
    return (rolesResp?.data ?? []).filter(
      role => !RESTRICTED_ROLE_CODES.includes(role.code?.toLowerCase() ?? '')
    );
  }, [rolesResp?.data]);
  
  const assignRoleMut = useAssignRoleToUser();
  const removeRoleMut = useRemoveRoleFromUser();
  
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingRoleId, setProcessingRoleId] = useState<number | null>(null);
  const { confirm, showConfirm, closeConfirm, handleConfirm } = useConfirm();

  const assignedRoleIds = new Set(userRoles.map((r: Role) => r.id));
  
  // Split roles into available (not assigned) and assigned, excluding restricted roles
  const availableRoles = useMemo(() => {
    return filteredRoles.filter(role => !assignedRoleIds.has(role.id));
  }, [filteredRoles, assignedRoleIds]);
  
  const assignedRoles = useMemo(() => {
    return userRoles.filter((role: Role) => 
      !RESTRICTED_ROLE_CODES.includes(role.code?.toLowerCase() ?? '')
    );
  }, [userRoles]);
  
  // Check if user is trying to manage their own roles
  const isManagingSelf = currentUser?.id === userId;

  useEffect(() => {
    if (isOpen && userId) {
      refetchUserRoles();
    }
  }, [isOpen, userId, refetchUserRoles]);

  useEffect(() => {
    if (alert) {
      const timeout = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timeout);
    }
  }, [alert]);

  const performRoleAction = async (role: Role) => {
    if (!userId) return;
    
    setLoading(true);
    setProcessingRoleId(role.id);
    setAlert(null);

    try {
      if (assignedRoleIds.has(role.id)) {
        await removeRoleMut.mutateAsync({ userId, roleId: role.id });
        setAlert({ type: 'success', message: t('messages.roleRemovedFromUser') || `Role "${role.label}" removed successfully` });
      } else {
        await assignRoleMut.mutateAsync({ userId, roleId: role.id });
        setAlert({ type: 'success', message: t('messages.roleAssignedToUser') || `Role "${role.label}" assigned successfully` });
      }
      refetchUserRoles();
    } catch (error: unknown) {
      const errorMessage = (error as Error)?.message || t('messages.unexpectedError') || 'An error occurred';
      setAlert({ type: 'error', message: errorMessage });
    } finally {
      setLoading(false);
      setProcessingRoleId(null);
    }
  };

  const handleToggleRole = async (role: Role) => {
    if (!userId) return;
    
    // Prevent managing own roles
    if (isManagingSelf) {
      setAlert({ 
        type: 'error', 
        message: t('messages.cannotModifyOwnRoles') || 'You cannot modify roles for your own account' 
      });
      return;
    }
    
    // Prevent multiple simultaneous assignments
    if (loading || processingRoleId !== null) {
      return;
    }
    
    // Check if assigning admin role - show confirmation modal
    const isAdminRole = role.code?.toLowerCase() === 'admin';
    if (!assignedRoleIds.has(role.id) && isAdminRole) {
      const confirmMessage = t('messages.confirmAssignAdminRole') || 
        `Are you sure you want to assign the "Admin" role to this user? This will give them full administrative access.`;
      
      showConfirm(confirmMessage, () => {
        performRoleAction(role);
      }, {
        title: t('common.confirm') || 'Confirm',
        confirmText: t('common.assign') || 'Assign',
        cancelText: t('common.cancel') || 'Cancel',
      });
      return;
    }
    
    // No confirmation needed, perform action directly
    await performRoleAction(role);
  };

  if (!user) return null;

  const pictureUrl = user.picture ? getFileUrl(user.picture) : null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      className="!w-full !max-w-4xl"
    >
      <div className="space-y-6">
        {/* Header with user info */}
        <div className="flex items-center gap-4 pb-5 border-b border-gray-200">
          <div className="flex-shrink-0 h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg overflow-hidden">
            {pictureUrl ? (
              <img
                src={pictureUrl}
                alt={user.username || 'User'}
                className="w-full h-full object-cover"
              />
            ) : (
              <UserIcon className="w-7 h-7 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-heading truncate">
              {user.username || user.email}
            </h2>
            <p className="text-sm text-muted mt-0.5">{user.email}</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-heading">
              {assignedRoles.length} {t('sections.assignedRights') || 'Assigned'}
            </span>
          </div>
        </div>

        {/* Alert messages */}
        {alert && (
          <div className={`rounded-xl border-l-4 px-5 py-4 ${
            alert.type === 'success'
              ? 'border-l-green-500 bg-green-50 text-green-800'
              : 'border-l-red-500 bg-red-50 text-red-800'
          }`}>
            <p className="font-medium">{alert.message}</p>
          </div>
        )}

        {isManagingSelf && (
          <div className="rounded-xl border-l-4 border-l-amber-500 bg-amber-50 px-5 py-4">
            <p className="font-semibold text-amber-800 mb-1">
              {t('messages.selfManagementRestricted') || 'Self-Management Restricted'}
            </p>
            <p className="text-sm text-amber-700">
              {t('messages.cannotModifyOwnRolesDescription') || 'You cannot modify roles for your own account. Please ask another administrator to manage your roles.'}
            </p>
          </div>
        )}

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column - Available roles */}
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Shield className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-heading">
                    {t('sections.availableRights') || 'Available Rights'}
                  </h4>
                  <p className="text-xs text-muted mt-0.5">
                    {t('sections.availableRightsDesc') || 'Click to assign'}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-3 min-h-[320px] max-h-[400px] overflow-y-auto bg-gray-50/50">
              {filteredRoles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Shield className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-sm text-muted">
                    {t('forms.loadingRoles') || 'Loading roles...'}
                  </p>
                </div>
              ) : availableRoles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ShieldCheck className="w-12 h-12 text-green-300 mb-3" />
                  <p className="text-sm font-medium text-green-600">
                    {t('sections.allRightsAssigned') || 'All rights are assigned'}
                  </p>
                </div>
              ) : (
                availableRoles.map((role: Role) => (
                  <button
                    key={role.id}
                    onClick={() => handleToggleRole(role)}
                    disabled={loading || isManagingSelf || processingRoleId !== null}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                      processingRoleId === role.id
                        ? 'bg-gray-100 border-gray-300 scale-[0.98]'
                        : 'bg-white border-gray-200 hover:border-primary hover:shadow-md hover:scale-[1.01]'
                    } ${isManagingSelf ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center gap-3 text-left">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Shield className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <span className="font-semibold text-heading block">{role.label}</span>
                        {role.is_system && (
                          <span className="text-xs text-blue-600 font-medium">System Role</span>
                        )}
                      </div>
                    </div>
                    {processingRoleId === role.id ? (
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <div className="flex items-center gap-2 text-primary">
                        <span className="text-sm font-medium hidden sm:inline">{t('common.assign') || 'Assign'}</span>
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right column - Assigned roles */}
          <div className="border-2 border-primary/30 rounded-xl overflow-hidden shadow-sm bg-primary/5">
            <div className="bg-gradient-to-r from-primary/10 to-primary/20 px-5 py-4 border-b border-primary/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-primary">
                    {t('sections.assignedRights') || 'Assigned Rights'}
                  </h4>
                  <p className="text-xs text-primary/70 mt-0.5">
                    {t('sections.assignedRightsDesc') || 'Click to remove'}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-3 min-h-[320px] max-h-[400px] overflow-y-auto">
              {assignedRoles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Shield className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-sm text-muted">
                    {t('sections.noRightsAssigned') || 'No rights assigned'}
                  </p>
                  <p className="text-xs text-muted mt-1">
                    {t('sections.selectFromAvailable') || 'Select from available rights'}
                  </p>
                </div>
              ) : (
                assignedRoles.map((role: Role) => (
                  <button
                    key={role.id}
                    onClick={() => handleToggleRole(role)}
                    disabled={loading || isManagingSelf || processingRoleId !== null}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                      processingRoleId === role.id
                        ? 'bg-primary/20 border-primary/40 scale-[0.98]'
                        : 'bg-white border-primary/30 hover:border-red-400 hover:bg-red-50 hover:shadow-md hover:scale-[1.01]'
                    } ${isManagingSelf ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer group'}`}
                  >
                    <div className="flex items-center gap-2 text-red-500 group-hover:text-red-600">
                      {processingRoleId === role.id ? (
                        <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <ChevronLeft className="w-5 h-5" />
                          <span className="text-sm font-medium hidden sm:inline">{t('common.remove') || 'Remove'}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <span className="font-semibold text-heading block">{role.label}</span>
                        {role.is_system && (
                          <span className="text-xs text-blue-600 font-medium">System Role</span>
                        )}
                      </div>
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <ShieldCheck className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-5 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose} className="px-6">
            {t('common.close') || 'Close'}
          </Button>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirm.isOpen}
        message={confirm.message}
        title={confirm.title}
        confirmText={confirm.confirmText}
        cancelText={confirm.cancelText}
        confirmVariant={confirm.confirmVariant}
        onConfirm={handleConfirm}
        onCancel={closeConfirm}
      />
    </BaseModal>
  );
};

export default UserRolesModal;
