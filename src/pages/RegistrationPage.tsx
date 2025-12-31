import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { companyApi } from '../api/company';
import { usersApi } from '../api/users';
import type { CreateCompanyRequest } from '../api/company';
import type { CreateUserRequest } from '../api/users';
import {
  ErrorAlert,
  RegistrationSuccess,
} from '../components/registration';
import CombinedRegistrationForm, { type CombinedRegistrationFormData } from '../components/registration/CombinedRegistrationForm';
import { PROFILE_DEFAULT } from '../types/profile';
// Note: PROFILE_DEFAULT is now 'admin' (administrateur) - has access to everything

type Step = 'form' | 'success';

const RegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CombinedRegistrationFormData>({
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    country: '',
    city: '',
    username: '',
    userEmail: '',
  });
  const [createdCompanyName, setCreatedCompanyName] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Step 1: Create company
      const companyPayload: CreateCompanyRequest = {
        name: formData.companyName.trim(),
        email: formData.companyEmail.trim(),
        phone: formData.companyPhone.trim() || undefined,
        country: formData.country.trim() || undefined,
        city: formData.city.trim() || undefined,
      };

      const company = await companyApi.create(companyPayload);

      // Step 2: Create user (always admin profile)
      const userPayload: CreateUserRequest = {
        username: formData.username.trim(),
        email: formData.userEmail.trim(),
        profile: PROFILE_DEFAULT, // Always admin profile
        company_id: company.id,
        // Password is not provided - backend will send invitation email with token link
      };

      // Backend will send an invitation email with a token link to set password
      await usersApi.create(userPayload);
      
      setCreatedCompanyName(company.name);
      setStep('success');
    } catch (err: unknown) {
      console.error('Registration error:', err);
      
      const axiosError = err as { 
        response?: { 
          data?: { 
            message?: string | string[];
            error?: string;
          };
          status?: number;
          statusText?: string;
        }; 
        message?: string;
      };
      
      // Extract error message
      let errorMessage = 'Failed to create account. Please try again.';
      
      if (axiosError.response) {
        const dataMessage = axiosError.response.data?.message;
        const errorField = axiosError.response.data?.error;
        
        if (Array.isArray(dataMessage)) {
          errorMessage = dataMessage.join(', ');
        } else if (typeof dataMessage === 'string') {
          errorMessage = dataMessage;
        } else if (typeof errorField === 'string') {
          errorMessage = errorField;
        } else if (axiosError.response.status) {
          errorMessage = `Error ${axiosError.response.status}: ${axiosError.response.statusText || 'Request failed'}`;
        }
      } else if (typeof axiosError.message === 'string') {
        errorMessage = axiosError.message;
      }
      
      setError(errorMessage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    navigate('/auth?mode=login');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-surface text-body transition-colors"
      style={{
        backgroundImage:
          'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 18%, transparent) 0%, var(--color-surface) 55%, color-mix(in srgb, var(--color-secondary) 15%, transparent) 100%)',
      }}
    >
      <div className="max-w-2xl w-full">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Edusole</h1>
          <p className="text-lg text-gray-600">Get started with your school management system</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10">
          {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

          {step === 'form' && (
            <CombinedRegistrationForm
              data={formData}
              onChange={setFormData}
              onSubmit={handleSubmit}
              loading={loading}
            />
          )}

          {step === 'success' && (
            <RegistrationSuccess
              companyName={createdCompanyName}
              userEmail={formData.userEmail}
              username={formData.username}
              onGoToLogin={handleGoToLogin}
            />
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-muted">
          <p>
            Already have an account?{' '}
            <button
              onClick={handleGoToLogin}
              className="font-medium text-primary hover:text-primary/80"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;

