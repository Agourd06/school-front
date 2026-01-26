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
    <tr className="border-b border-tertiary/10 hover:bg-gray-50/50 transition-colors group">
      {/* Name Column */}
      <td className="px-4 sm:px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/5">
            <span className="text-sm font-semibold text-primary">
              {user.username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`text-sm font-semibold truncate ${isPending ? 'text-orange-600' : 'text-heading'}`}>
                {user.username}
              </p>
              {isCurrentUser && (
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 flex-shrink-0">
                  {t('common.you') || 'You'}
                </span>
              )}
            </div>
            {/* Show roles on mobile */}
            <div className="md:hidden mt-2 flex items-center gap-2">
              {rolesLoading ? (
                <span className="text-xs text-muted italic">{t('common.loading') || 'Loading...'}</span>
              ) : userRoles && userRoles.length > 0 ? (
                <>
                  <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-secondary/10 text-secondary border border-secondary/30">
                    {userRoles[0].label}
                  </span>
                  {userRoles.length > 1 && (
                    <span className="text-xs text-muted font-medium">
                      +{userRoles.length - 1}
                    </span>
                  )}
                </>
              ) : (
                <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 whitespace-nowrap">
                  {t('sections.noRolesAssigned') || 'No roles'}
                </span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* Email Column */}
      <td className="px-4 sm:px-6 py-4">
        <p className="text-sm text-body truncate max-w-xs" title={user.email}>
          {user.email}
        </p>
      </td>

      {/* Roles Column */}
      <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
        <div className="flex flex-wrap items-center gap-2">
          {rolesLoading ? (
            <span className="text-xs text-muted italic">{t('common.loading') || 'Loading...'}</span>
          ) : userRoles && userRoles.length > 0 ? (
            userRoles.map((role: Role) => (
              <span
                key={role.id}
                className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium bg-secondary/10 text-secondary border border-secondary/30 whitespace-nowrap"
              >
                {role.label}
              </span>
            ))
          ) : (
            <span className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 whitespace-nowrap">
              {t('sections.noRolesAssigned') || 'No roles assigned'}
            </span>
          )}
        </div>
      </td>

      {/* Status Column */}
      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
        <UserStatusBadge value={user.status} />
      </td>

      {/* Actions Column */}
      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
        <div className="relative flex items-center justify-end gap-1.5">
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
              <span>{t('common.resend') || 'Resend'}</span>
            </Button>
          )}
          {!isCurrentUser && (
            <div className="flex items-center gap-1">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onManageRoles(user)}
                className="inline-flex items-center gap-1.5"
                title={t('sections.manageRoles') || 'Manage Roles'}
              >
                <UserCog className="w-4 h-4" />
                <span>{t('sections.roles') || 'Roles'}</span>
              </Button>
              <EditButton 
                onClick={() => onEdit(user)} 
                title={t('common.edit') || 'Edit User'}
              />
              <DeleteButton 
                onClick={() => onDelete(user.id)} 
                title={t('common.delete') || 'Delete User'}
              />
            </div>
          )}
          {isCurrentUser && (
            <span className="text-xs text-muted italic">
              {t('messages.cannotManageYourself') || 'Cannot manage'}
            </span>
          )}
        </div>
      </td>
    </tr>
  );
};

export default UserRow;
