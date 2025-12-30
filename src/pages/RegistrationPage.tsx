import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { companyApi } from '../api/company';
import { usersApi } from '../api/users';
import type { CreateCompanyRequest } from '../api/company';
import type { CreateUserRequest } from '../api/users';
import {
  RegistrationProgress,
  ErrorAlert,
  CompanyForm,
  UserForm,
  RegistrationSuccess,
  type CompanyFormData,
  type UserFormData,
} from '../components/registration';
import { applyThemeToDocument, mergeTheme, defaultTheme } from '../theme/colors';

type Step = 'company' | 'user' | 'success';

const RegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('company');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companyData, setCompanyData] = useState<CompanyFormData>({
    name: '',
    email: '',
    phone: '',
    website: '',
    primaryColor: defaultTheme.primary,
    secondaryColor: defaultTheme.secondary,
  });
  const [userData, setUserData] = useState<UserFormData>({
    username: '',
    email: '',
    role: 'user',
  });
  const [createdCompanyId, setCreatedCompanyId] = useState<number | null>(null);

  useEffect(() => {
    applyThemeToDocument(
      mergeTheme({
        primary: companyData.primaryColor,
        secondary: companyData.secondaryColor,
        accent: companyData.secondaryColor,
      })
    );
  }, [companyData.primaryColor, companyData.secondaryColor]);

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload: CreateCompanyRequest = {
        name: companyData.name.trim(),
        email: companyData.email.trim(),
        phone: companyData.phone.trim() || undefined,
        website: companyData.website.trim() || undefined,
        primaryColor: companyData.primaryColor,
        secondaryColor: companyData.secondaryColor,
      };

      const company = await companyApi.create(payload);
      if (company.primaryColor || company.secondaryColor) {
        applyThemeToDocument(
          mergeTheme({
            primary: company.primaryColor ?? companyData.primaryColor,
            secondary: company.secondaryColor ?? companyData.secondaryColor,
            accent: company.secondaryColor ?? companyData.secondaryColor,
          })
        );
      }
      setCreatedCompanyId(company.id);
      setStep('user');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string | string[] } }; message?: string };
      const dataMessage = axiosError?.response?.data?.message;
      if (Array.isArray(dataMessage)) {
        setError(dataMessage.join(', '));
      } else if (typeof dataMessage === 'string') {
        setError(dataMessage);
      } else if (typeof axiosError.message === 'string') {
        setError(axiosError.message);
      } else {
        setError('Failed to create company. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!createdCompanyId) {
      setError('Company ID is missing. Please start over.');
      setLoading(false);
      return;
    }

    try {
      const payload: CreateUserRequest = {
        username: userData.username.trim(),
        email: userData.email.trim(),
        role: userData.role,
        company_id: createdCompanyId,
        // Password is not provided - backend will send invitation email with token link
      };

      // Backend will send an invitation email with a token link to set password
      // User must click the link and set their password before they can login
      await usersApi.create(payload);
      
      setStep('success');
    } catch (err: unknown) {
      console.error('User creation error:', err);
      
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
      let errorMessage = 'Failed to create user account. Please try again.';
      
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

  const handleBackToCompany = () => {
    setStep('company');
    setError(null);
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

        <RegistrationProgress currentStep={step} />

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10">
          {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

          {step === 'company' && (
            <CompanyForm
              data={companyData}
              onChange={setCompanyData}
              onSubmit={handleCompanySubmit}
              loading={loading}
            />
          )}

          {step === 'user' && (
            <UserForm
              data={userData}
              companyName={companyData.name}
              onChange={setUserData}
              onSubmit={handleUserSubmit}
              onBack={handleBackToCompany}
              loading={loading}
            />
          )}

          {step === 'success' && (
            <RegistrationSuccess
              companyName={companyData.name}
              userEmail={userData.email}
              username={userData.username}
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

