import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Input, Button } from '../components/ui';
import { isStudentRole, isTeacherRole } from '../utils/permissions';
import { usersApi } from '../api/users';
import { Camera, X } from 'lucide-react';
import { getFileUrl } from '../utils/apiConfig';

const ProfilePage: React.FC = () => {
  const { user, changePassword, isLoading } = useAuth();
  const navigate = useNavigate();

  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [picturePreview, setPicturePreview] = useState<string | null>(null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [pictureError, setPictureError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Helper function to get picture URL (same pattern as TeachersSection)
  const getPictureUrl = (picture?: string | null) => {
    if (!picture) return null;
    const url = getFileUrl(picture);
    return url?.trim() || null;
  };

  // Normalize user roles once (used in multiple places) - memoized for performance
  const normalizedUserRoles = useMemo(() => {
    if (!user?.roles) return [];
    return user.roles.map(r => String(r).toLowerCase().trim()).filter(Boolean);
  }, [user?.roles]);

  const isStudent = useMemo(() => isStudentRole(normalizedUserRoles), [normalizedUserRoles]);
  const isTeacher = useMemo(() => isTeacherRole(normalizedUserRoles), [normalizedUserRoles]);

  // SECURITY: Redirect students/teachers from /profile (dashboard profile) to their own profile pages
  useEffect(() => {
    if (isLoading || !user) return;
    
    const currentPath = window.location.pathname;
    if (currentPath !== '/profile') return;

    if (isStudent) {
      window.location.replace('/student/profile');
    } else if (isTeacher) {
      window.location.replace('/teacher/profile');
    }
  }, [user, isLoading, isStudent, isTeacher]);

  // Show loading while checking
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-xl font-bold text-primary">Loading...</div>
      </div>
    );
  }

  // SECURITY: Only block rendering if student/teacher accessing /profile (dashboard profile)
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  if ((isStudent || isTeacher) && currentPath === '/profile') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-xl font-bold text-primary">Redirecting...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-xl font-bold text-primary">Please log in to view your profile.</div>
      </div>
    );
  }

  const validatePasswordForm = (): boolean => {
    const errors: Record<string, string> = {};

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
        passwordForm.newPassword,
        passwordForm.confirmPassword
      );
      // Password changed successfully - user will be logged out automatically
      setPasswordSuccess(true);
      setPasswordForm({
        newPassword: '',
        confirmPassword: '',
      });
      setPasswordErrors({});
      
      // Note: logout() is called in AuthContext, which will redirect to login
      // No need to clear success message as user will be redirected
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

  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setPictureError('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setPictureError('Image size must be less than 5MB');
        return;
      }
      
      setPictureFile(file);
      setPictureError(null);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePictureUpload = async () => {
    if (!pictureFile || !user) return;
    
    setIsUploadingPicture(true);
    setPictureError(null);
    
    try {
      // Upload the picture
      const updatedUser = await usersApi.update(user.id, { picture: pictureFile });
      
      // Verify the picture path was returned correctly
      if (!updatedUser.picture) {
        throw new Error('Picture upload succeeded but no picture path was returned');
      }
      
      // Fetch fresh user data from server to ensure we have the correct picture path
      // This ensures the picture path format matches what the backend expects
      try {
        const { authApi } = await import('../api/auth');
        const profileResponse = await authApi.getProfile();
        const serverUser = profileResponse.user;
        
        if (serverUser?.picture) {
          // Update user in context with server-validated picture path
          const updatedUserData = { ...user, picture: serverUser.picture };
          localStorage.setItem('user', JSON.stringify(updatedUserData));
          
          // Clear preview and file - the picture will now come from user.picture
          setPictureFile(null);
          setPicturePreview(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
          
          // Reload to update AuthContext with the new picture
          // This ensures the picture displays correctly after reload
          window.location.reload();
          return;
        }
      } catch (profileError) {
        console.error('Failed to refresh profile after picture upload:', profileError);
        // Continue with the picture from update response
      }
      
      // Fallback: Use picture from update response if profile refresh failed
      const updatedUserData = { ...user, picture: updatedUser.picture };
      localStorage.setItem('user', JSON.stringify(updatedUserData));
      
      // Clear preview and file
      setPictureFile(null);
      setPicturePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      // Reload to update AuthContext
      window.location.reload();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string | string[] } }; message?: string };
      const errorMessage = Array.isArray(axiosError?.response?.data?.message)
        ? axiosError.response.data.message.join(', ')
        : axiosError?.response?.data?.message || axiosError?.message || 'Failed to upload picture';
      setPictureError(errorMessage);
      setIsUploadingPicture(false);
    }
  };

  const handleRemovePicture = async () => {
    if (!user) return;
    
    setIsUploadingPicture(true);
    setPictureError(null);
    
    try {
      await usersApi.update(user.id, { picture: null });
      // Update user in context with removed picture
      const updatedUserData = { ...user, picture: null };
      localStorage.setItem('user', JSON.stringify(updatedUserData));
      setPicturePreview(null);
      setPictureFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      // Reload page to show updated picture
      window.location.reload();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string | string[] } }; message?: string };
      const errorMessage = Array.isArray(axiosError?.response?.data?.message)
        ? axiosError.response.data.message.join(', ')
        : axiosError?.response?.data?.message || axiosError?.message || 'Failed to remove picture';
      setPictureError(errorMessage);
    } finally {
      setIsUploadingPicture(false);
    }
  };

  return (
      <div className="min-h-screen bg-surface py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-heading">My Profile </h1>
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
          <div className="bg-card rounded-lg shadow-sm border border-tertiary p-6">
            <h2 className="text-xl font-semibold text-heading mb-6">Account Information</h2>
            
            {/* Picture Upload Section */}
            <div className="mb-6 pb-6 border-b border-tertiary/20">
              <label className="block text-sm font-medium text-muted mb-2">Profile Picture</label>
              {pictureError && (
                <div className="mb-3 rounded-md border border-danger-light bg-danger-light px-4 py-2 text-sm text-danger-dark">
                  {pictureError}
                </div>
              )}
              <div className="flex items-center gap-4">
                <div className="relative">
                  {(() => {
                    const displayUrl = picturePreview || getPictureUrl(user.picture);
                    const fallbackInitial = user.username?.[0]?.toUpperCase() || 'U';
                    
                    if (!displayUrl) {
                      return (
                        <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-tertiary">
                          <span className="text-2xl font-semibold text-gray-500">{fallbackInitial}</span>
                        </div>
                      );
                    }
                    
                    return (
                      <img
                        src={displayUrl}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover border-2 border-tertiary"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `<div class="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-tertiary"><span class="text-2xl font-semibold text-gray-500">${fallbackInitial}</span></div>`;
                          }
                        }}
                      />
                    );
                  })()}
                  {pictureFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setPictureFile(null);
                        setPicturePreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-danger text-white rounded-full flex items-center justify-center hover:bg-danger/90 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePictureChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPicture}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/95 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    {pictureFile ? 'Change Picture' : 'Upload Picture'}
                  </button>
                  {pictureFile && (
                    <button
                      type="button"
                      onClick={handlePictureUpload}
                      disabled={isUploadingPicture}
                      className="px-4 py-2 bg-success text-white rounded-lg hover:bg-success/95 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploadingPicture ? 'Uploading...' : 'Save Picture'}
                    </button>
                  )}
                  {user.picture && !pictureFile && (
                    <button
                      type="button"
                      onClick={handleRemovePicture}
                      disabled={isUploadingPicture}
                      className="px-4 py-2 bg-danger text-white rounded-lg hover:bg-danger/95 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploadingPicture ? 'Removing...' : 'Remove Picture'}
                    </button>
                  )}
                </div>
              </div>
            </div>

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
                <label className="block text-sm font-medium text-muted mb-1">Roles</label>
                <div className="flex flex-wrap gap-2">
                  {normalizedUserRoles.length > 0 ? (
                    normalizedUserRoles.map((roleCode: string, index: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 capitalize"
                      >
                        {roleCode}
                      </span>
                    ))
                  ) : (
                    <span className="text-base text-muted">No roles assigned</span>
                  )}
                </div>
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
          <div className="bg-card rounded-lg shadow-sm border border-tertiary p-6">
            <h2 className="text-xl font-semibold text-heading mb-6">Change Password</h2>
            
            {passwordSuccess && (
              <div className="mb-4 rounded-md border border-success-light bg-success-light px-4 py-3 text-sm text-success-dark">
                Password changed successfully! You will be logged out and redirected to login.
              </div>
            )}

            {passwordError && (
              <div className="mb-4 rounded-md border border-danger-light bg-danger-light px-4 py-3 text-sm text-danger-dark">
                {passwordError}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
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
