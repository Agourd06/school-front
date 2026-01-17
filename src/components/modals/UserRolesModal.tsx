import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import BaseModal from './BaseModal';
import ConfirmModal from './ConfirmModal';
import { useUserRoles, useAssignRoleToUser, useRemoveRoleFromUser } from '../../hooks/useUserRoles';
import { useRoles } from '../../hooks/useRoles';
import { useAuth } from '../../hooks/useAuth';
import { useConfirm } from '../../hooks/useConfirm';
import { Button } from '../ui';
import type { User } from '../../api/users';
import type { Role } from '../../api/roles';

interface UserRolesModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
}

const UserRolesModal: React.FC<UserRolesModalProps> = ({ isOpen, onClose, user }) => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth(); // Get current logged-in user
  const userId = user?.id ?? null;
  
  const { data: userRoles = [], refetch: refetchUserRoles } = useUserRoles(userId);
  const { data: rolesResp } = useRoles({ page: 1, limit: 100 });
  // Filter out 'prof' role - it's deprecated, use 'teacher' instead
  const allRoles = (rolesResp?.data ?? []).filter(role => role.code !== 'prof');
  
  const assignRoleMut = useAssignRoleToUser();
  const removeRoleMut = useRemoveRoleFromUser();
  
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingRoleId, setProcessingRoleId] = useState<number | null>(null);
  const { confirm, showConfirm, closeConfirm, handleConfirm } = useConfirm();

  const assignedRoleIds = new Set(userRoles.map((r: Role) => r.id));
  
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

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${t('sections.manageRolesFor') || 'Manage Roles for'} ${user.username || user.email}`}
      className="sm:max-w-2xl"
    >
      <div className="space-y-4">
        {alert && (
          <div className={`rounded-md border px-4 py-2 text-sm ${
            alert.type === 'success'
              ? 'border-success-light bg-success-light text-success-dark'
              : 'border-danger-light bg-danger-light text-danger-dark'
          }`}>
            {alert.message}
          </div>
        )}

        {isManagingSelf && (
          <div className="rounded-md border border-warning-light bg-warning-light px-4 py-3 text-sm text-warning-dark">
            <p className="font-medium mb-1">{t('messages.selfManagementRestricted') || 'Self-Management Restricted'}</p>
            <p className="text-xs">
              {t('messages.cannotModifyOwnRolesDescription') || 'You cannot modify roles for your own account. Please ask another administrator to manage your roles.'}
            </p>
          </div>
        )}

        <div>
          <p className="text-sm text-muted mb-4">
            {t('sections.selectRolesForUser') || 'Select roles to assign to this user. Users with multiple roles will have access to all pages assigned to any of their roles.'}
          </p>

          <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-300 rounded-md p-4">
            {allRoles.length === 0 ? (
              <p className="text-sm text-muted text-center py-4">
                {t('forms.loadingRoles') || 'Loading roles...'}
              </p>
            ) : (
              allRoles.map((role: Role) => {
                const isAssigned = assignedRoleIds.has(role.id);
                return (
                  <div
                    key={role.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      isAssigned
                        ? 'bg-primary-transparent border-primary'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-heading">{role.label}</span>
                        <span className="text-xs text-muted">({role.code})</span>
                        {role.is_system && (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
                            System
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant={isAssigned ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => handleToggleRole(role)}
                      disabled={loading || isManagingSelf || processingRoleId !== null}
                      isLoading={processingRoleId === role.id}
                      className="ml-4"
                      title={isManagingSelf ? (t('messages.cannotModifyOwnRoles') || 'You cannot modify your own roles') : undefined}
                    >
                      {isAssigned ? t('common.remove') || 'Remove' : t('common.assign') || 'Assign'}
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {userRoles.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-heading mb-2">
              {t('sections.currentRoles') || 'Current Roles'}:
            </h4>
            <div className="flex flex-wrap gap-2">
              {userRoles.map((role: Role) => (
                <span
                  key={role.id}
                  className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-primary-transparent text-primary border border-primary"
                >
                  {role.label}
                  {role.is_system && <span className="ml-1 text-xs">(System)</span>}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose}>
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
