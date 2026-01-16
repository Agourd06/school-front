import React from 'react';
import { useTranslation } from 'react-i18next';
import { useUserRoles } from '../hooks/useUserRoles';
import { EditButton, DeleteButton, Button } from './ui';
import UserStatusBadge from './UserStatusBadge';
import type { User } from '../api/users';
import type { Role } from '../api/roles';
import { Mail, UserCog } from 'lucide-react';

interface UserRowProps {
  user: User;
  isCurrentUser: boolean;
  onEdit: (user: User) => void;
  onDelete: (id: number) => void;
  onManageRoles: (user: User) => void;
  onResendInvitation: (userId: number) => void;
  isResendingInvitation: boolean;
}

const UserRow: React.FC<UserRowProps> = ({
  user,
  isCurrentUser,
  onEdit,
  onDelete,
  onManageRoles,
  onResendInvitation,
  isResendingInvitation,
}) => {
  const { t } = useTranslation();
  const { data: userRoles = [], isLoading: rolesLoading } = useUserRoles(user.id);
  const isPending = user.status === 2;

  return (
    <li className="px-6 py-5 hover:bg-gray-50/30 transition-colors border-b border-tertiary/10 last:border-b-0">
      <div className="flex items-center justify-between gap-4">
        {/* Left: User Info */}
        <div className="flex-1 min-w-0">
          {/* Primary: Username */}
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-base font-semibold text-heading truncate">{user.username}</h3>
            {isCurrentUser && (
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                {t('common.you') || 'You'}
              </span>
            )}
          </div>

          {/* Secondary: Roles and Status */}
          <div className="flex flex-wrap items-center gap-3 mt-2.5">
            {/* Roles */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted font-medium">{t('sections.roles') || 'Roles'}:</span>
              <div className="flex flex-wrap gap-1.5">
                {rolesLoading ? (
                  <span className="text-xs text-muted italic">{t('common.loading') || 'Loading...'}</span>
                ) : userRoles && userRoles.length > 0 ? (
                  userRoles.map((role: Role) => (
                    <span
                      key={role.id}
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-secondary/10 text-secondary border border-secondary/30"
                    >
                      {role.label}
                    </span>
                  ))
                ) : (
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                    {t('sections.noRolesAssigned') || 'No roles assigned'}
                  </span>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted font-medium">{t('forms.statusLabel') || 'Status'}:</span>
              <UserStatusBadge value={user.status} />
            </div>
          </div>

          {/* Pending Helper Text */}
          {isPending && (
            <p className="text-xs text-orange-600 mt-2 italic">
              {t('messages.invitationSentHelper') || 'Invitation sent. User has not completed account setup yet.'}
            </p>
          )}

          {/* Current User Helper Text */}
          {isCurrentUser && (
            <p className="text-xs text-muted mt-2 italic">
              {t('messages.cannotManageYourself') || 'You cannot edit, delete, or modify roles for your own account'}
            </p>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isPending && !isCurrentUser && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onResendInvitation(user.id)}
              isLoading={isResendingInvitation}
              disabled={isResendingInvitation}
              className="inline-flex items-center gap-1.5"
              title={t('sections.resendInvitation') || 'Resend Invitation'}
            >
              <Mail className="w-4 h-4" />
              <span>{t('sections.resendInvitation') || 'Resend Invitation'}</span>
            </Button>
          )}
          {!isCurrentUser && (
            <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onManageRoles(user)}
              className="inline-flex items-center gap-1.5"
              title={t('sections.manageRoles') || 'Manage Roles'}
            >
              <UserCog className="w-4 h-4" />
              <span>{t('sections.manageRoles') || 'Manage Roles'}</span>
            </Button>
              <EditButton 
                onClick={() => onEdit(user)} 
                title={t('common.edit') || 'Edit User'}
              />
              <DeleteButton 
                onClick={() => onDelete(user.id)} 
                title={t('common.delete') || 'Delete User'}
              />
            </>
          )}
        </div>
      </div>
    </li>
  );
};

export default UserRow;
