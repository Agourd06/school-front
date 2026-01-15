import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Input, Button } from '../components/ui';
import { getProfileLabel } from '../types/profile';

const ProfilePage: React.FC = () => {
  const { user, changePassword, isLoading } = useAuth();
  const navigate = useNavigate();

  // SECURITY: Redirect students/teachers from /profile (dashboard profile) to their own profile pages
  // BUT allow access to ProfilePage when accessed through /student/profile or /teacher/profile
  // IMPORTANT: Check roles array first (new system), then profile (backwards compatibility)
  useEffect(() => {
    if (!isLoading && user) {
      const userRoles = Array.isArray(user.roles) ? user.roles : [];
      const isStudent = userRoles.includes('student') || user.profile === 'student';
      const isTeacher = userRoles.includes('teacher') || userRoles.includes('prof') || user.profile === 'teacher' || user.profile === 'prof';
      const currentPath = window.location.pathname;
      
      // Only redirect from /profile (dashboard profile) - NOT from /student/profile or /teacher/profile
      if (currentPath === '/profile') {
        if (isStudent) {
          console.log('[ProfilePage] Redirecting student from /profile to /student/profile', { roles: userRoles, profile: user.profile });
          window.location.replace('/student/profile');
        } else if (isTeacher) {
          console.log('[ProfilePage] Redirecting teacher from /profile to /teacher/profile', { roles: userRoles, profile: user.profile });
          window.location.replace('/teacher/profile');
        }
      }
    }
  }, [user, isLoading]);

  // Show loading while checking
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-xl font-bold text-primary">Loading...</div>
      </div>
    );
  }

  // SECURITY: Only block rendering if student/teacher accessing /profile (dashboard profile)
  // Allow access when accessed through /student/profile or /teacher/profile
  // IMPORTANT: Check roles array first (new system), then profile (backwards compatibility)
  const userRoles = Array.isArray(user?.roles) ? user?.roles : [];
  const isStudent = userRoles.includes('student') || user?.profile === 'student';
  const isTeacher = userRoles.includes('teacher') || userRoles.includes('prof') || user?.profile === 'teacher' || user?.profile === 'prof';
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  
  // Only show redirect message if accessing /profile (not /student/profile or /teacher/profile)
  if ((isStudent || isTeacher) && currentPath === '/profile') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-xl font-bold text-primary">Redirecting...</div>
      </div>
    );
  }

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-xl font-bold text-primary">Please log in to view your profile.</div>
      </div>
    );
  }

  const validatePasswordForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!passwordForm.currentPassword.trim()) {
      errors.currentPassword = 'Current password is required';
    } else if (passwordForm.currentPassword.length < 6) {
      errors.currentPassword = 'Current password must be at least 6 characters';
    }

    if (!passwordForm.newPassword.trim()) {
      errors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 6) {
      errors.newPassword = 'New password must be at least 6 characters';
    }

    if (!passwordForm.confirmPassword.trim()) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'New passwords do not match';
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      errors.newPassword = 'New password must be different from current password';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setPasswordError(null);
    setPasswordSuccess(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!validatePasswordForm()) {
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword,
        passwordForm.confirmPassword
      );
      setPasswordSuccess(true);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPasswordErrors({});
      
      // Clear success message after 5 seconds
      setTimeout(() => setPasswordSuccess(false), 5000);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string | string[] } }; message?: string };
      const errorMessage = Array.isArray(axiosError?.response?.data?.message)
        ? axiosError.response.data.message.join(', ')
        : axiosError?.response?.data?.message || axiosError?.message || 'Failed to change password';
      setPasswordError(errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const profileLabel = getProfileLabel(user.profile);

  return (
      <div className="min-h-screen bg-surface py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-heading">My Profile</h1>
          <p className="mt-2 text-sm text-muted">View and manage your account information</p>
          
          {/* Helper message and button for students/teachers - only show on /profile (not on /student/profile) */}
          {(isStudent || isTeacher) && currentPath === '/profile' && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 mb-3">
                {isStudent 
                  ? 'You are a student. Access your student dashboard to view your schedule, grades, and attendance.'
                  : 'You are a teacher. Access your teacher dashboard to manage your classes and students.'}
              </p>
              <button
                onClick={() => navigate(isStudent ? '/student' : '/teacher')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {isStudent ? 'Go to Student Dashboard' : 'Go to Teacher Dashboard'}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* User Information Card */}
          <div className="bg-card rounded-lg shadow-sm border border-border p-6">
            <h2 className="text-xl font-semibold text-heading mb-6">Account Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Username</label>
                <div className="text-base text-heading font-medium">{user.username || '—'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Email</label>
                <div className="text-base text-heading font-medium">{user.email || '—'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Profile</label>
                <div className="text-base text-heading font-medium capitalize">{profileLabel}</div>
              </div>
              {user.company && (
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">Company</label>
                  <div className="text-base text-heading font-medium">{user.company.name || '—'}</div>
                </div>
              )}
            </div>
          </div>

          {/* Change Password Card */}
          <div className="bg-card rounded-lg shadow-sm border border-border p-6">
            <h2 className="text-xl font-semibold text-heading mb-6">Change Password</h2>
            
            {passwordSuccess && (
              <div className="mb-4 rounded-md border border-success-light bg-success-light px-4 py-3 text-sm text-success-dark">
                Password changed successfully!
              </div>
            )}

            {passwordError && (
              <div className="mb-4 rounded-md border border-danger-light bg-danger-light px-4 py-3 text-sm text-danger-dark">
                {passwordError}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                error={passwordErrors.currentPassword}
                helperText="Enter your current password"
                required
                minLength={6}
              />

              <Input
                label="New Password"
                type="password"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                error={passwordErrors.newPassword}
                helperText="Must be at least 6 characters long"
                required
                minLength={6}
              />

              <Input
                label="Confirm New Password"
                type="password"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                error={passwordErrors.confirmPassword}
                helperText="Re-enter your new password to confirm"
                required
                minLength={6}
              />

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isChangingPassword}
                  disabled={isChangingPassword}
                >
                  Change Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
