import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { companyApi } from '../api/company';
import { authApi } from '../api/auth';
import type { CreateCompanyRequest } from '../api/company';
import type { RegisterRequest } from '../api/auth';
import {
  ErrorAlert,
  RegistrationSuccess,
} from '../components/registration';
import CombinedRegistrationForm, { type CombinedRegistrationFormData } from '../components/registration/CombinedRegistrationForm';
import { generateUsernameFromCompanyName } from '../utils/usernameGenerator';
// Note: profile field has been REMOVED - replaced with roles system
// First user automatically gets admin role - no profile or role_ids needed
// Username is auto-generated as "admin_[companyName]" and email uses company email

type Step = 'form' | 'success';

const RegistrationPage: React.FC = () => {
  const { t, i18n } = useTranslation();
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
    acceptedPrivacyPolicy: false,
    acceptedTermsOfUse: false,
  });
  const [createdCompanyName, setCreatedCompanyName] = useState<string>('');
  const [generatedUsername, setGeneratedUsername] = useState<string>('');
  const [captchaToken, setCaptchaToken] = useState<string>('');
  const [captchaAnswer, setCaptchaAnswer] = useState<string | undefined>(undefined);
  const [captchaError, setCaptchaError] = useState<string>('');
  const [consentErrors, setConsentErrors] = useState<{
    privacyPolicy?: string;
    termsOfUse?: string;
  }>({});

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'fr' : 'en';
    i18n.changeLanguage(newLang);
  };

  const handleCaptchaVerify = async (token: string, answer: string) => {
    // Store pre-verified CAPTCHA data for form submission
    // The CAPTCHA component has already called /api/captcha/pre-verify
    // The token is now pre-verified and valid for 5 minutes
    
    // Validate token and answer before storing
    if (!token || !token.trim()) {
      setCaptchaError(t('registration.captchaVerificationFailed') || 'CAPTCHA verification failed - invalid token');
      return;
    }
    
    if (!answer || !answer.trim()) {
      setCaptchaError(t('registration.captchaVerificationFailed') || 'CAPTCHA verification failed - invalid answer');
      return;
    }
    
    setCaptchaToken(token.trim());
    setCaptchaAnswer(answer.trim());
    setCaptchaError(''); // Clear any previous errors
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setConsentErrors({});
    setLoading(true);

    try {
      // Validate consent checkboxes
      const newConsentErrors: { privacyPolicy?: string; termsOfUse?: string } = {};
      if (!formData.acceptedPrivacyPolicy) {
        newConsentErrors.privacyPolicy = t('registration.mustAcceptConditions');
      }
      if (!formData.acceptedTermsOfUse) {
        newConsentErrors.termsOfUse = t('registration.mustAcceptConditions');
      }
      
      if (Object.keys(newConsentErrors).length > 0) {
        setConsentErrors(newConsentErrors);
        setLoading(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // Step 1: Create company
      // Validate CAPTCHA before proceeding
      if (!captchaToken || !captchaToken.trim() || captchaAnswer === undefined || !captchaAnswer.trim()) {
        throw new Error(t('registration.captchaRequired') || 'Please complete the CAPTCHA verification');
      }

      const companyPayload: CreateCompanyRequest = {
        name: formData.companyName.trim(),
        email: formData.companyEmail.trim(),
        phone: formData.companyPhone.trim() || undefined,
        country: formData.country.trim() || undefined,
        city: formData.city.trim() || undefined,
        captchaToken: captchaToken.trim(), // Include CAPTCHA token (required by backend) - ensure it's a string
        captchaAnswer: (captchaAnswer as string).trim(), // Include CAPTCHA answer (required by backend, validated above)
      };

      const company = await companyApi.create(companyPayload);

      // Step 2: Register first admin user (public endpoint, no auth required)
      // First user automatically gets admin role - no role_ids needed
      // Password is NEVER provided - backend always sends password setup email
      // profile field is REMOVED - backend handles role assignment automatically
      // Username is auto-generated as "admin_[companyName]"
      // Email uses company email
      // NOTE: CAPTCHA was already verified during company creation
      // The backend should allow user registration without CAPTCHA when company_id is provided
      // If backend still requires CAPTCHA, we'll need to handle that case
      
      // Step 2: Register first admin user (public endpoint, no auth required)
      // NOTE: The CAPTCHA token was consumed during company creation
      // For the first user (admin) created as part of company registration, we skip CAPTCHA
      // because it was already verified during company creation. The backend should handle this
      // by checking if this is the first user (userCountForCompany === 0) and skip CAPTCHA verification.
      //
      // IMPORTANT: New admin users should only have access to /settings and /users pages initially.
      // The backend should create a default admin role with only these two pages assigned.
      // The admin can then assign pages to other roles, but cannot modify their own role's pages.
      
      const generatedUsername = generateUsernameFromCompanyName(formData.companyName);
      
      // Skip CAPTCHA for first user - it was already verified during company creation
      // The token was consumed, so we don't send it again
      // Backend should recognize this is the first user and skip CAPTCHA verification
      const userPayload: RegisterRequest = {
        username: generatedUsername,
        email: formData.companyEmail.trim(), // Use company email as user email
        company_id: company.id, // Required: Link user to the created company
        phone: formData.companyPhone.trim() || undefined, // Use company phone for admin user
        privacyPolicyAccepted: formData.acceptedPrivacyPolicy, // Privacy policy consent
        termsAccepted: formData.acceptedTermsOfUse, // Terms of use consent
        // CAPTCHA fields are NOT included - already verified during company creation
        // Backend should skip CAPTCHA verification for first user (userCountForCompany === 0)
        // DO NOT send: profile (removed), role_ids (not accepted), password (email-based)
        // Backend automatically assigns admin role to first user
        // NOTE: Backend should assign a default admin role with only /settings and /users pages
      };
      
      // Use /auth/register endpoint (public, no JWT token needed)
      // Backend automatically assigns admin role to first user for the company
      // Backend will send password setup email with secure token link
      await authApi.register(userPayload);
      
      setCreatedCompanyName(company.name);
      setGeneratedUsername(generatedUsername);
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
      let errorMessage = t('registration.failedToCreateAccount');
      
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
      // Reset CAPTCHA on error - user will need to solve a new one
      setCaptchaToken('');
      setCaptchaAnswer(undefined);
      // Reset CAPTCHA component state by clearing verified status
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
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-surface text-body transition-colors relative"
      style={{
        backgroundImage:
          'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 18%, transparent) 0%, var(--color-surface) 55%, color-mix(in srgb, var(--color-secondary) 15%, transparent) 100%)',
      }}
    >
      {/* Language Switcher Button - Top Right */}
      <button
        onClick={toggleLanguage}
        className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 flex items-center gap-2 px-3.5 py-2.5 bg-white/95 backdrop-blur-md border border-gray-200/60 rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 hover:bg-white hover:border-primary/30 group"
        aria-label={t('language.switchLanguage')}
        title={t('language.switchLanguage')}
      >
        <div className="relative">
          <Globe className="w-5 h-5 text-gray-600 group-hover:text-primary transition-all duration-300 group-hover:rotate-12" />
          <div className="absolute inset-0 rounded-full bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
        </div>
        <span className="text-sm font-bold text-gray-700 group-hover:text-primary transition-all duration-300 min-w-[2.5rem] text-center transform group-hover:scale-110">
          {i18n.language === 'en' ? 'FR' : 'EN'}
        </span>
      </button>

      <div className="max-w-2xl w-full">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src="/edusol_logo.png" 
              alt="Edusole" 
              className="h-16 w-auto object-contain"
            />
          </div>
          <p className="text-lg text-gray-600">{t('registration.tagline')}</p>
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
              captchaToken={captchaToken}
              captchaAnswer={captchaAnswer}
              onCaptchaVerify={handleCaptchaVerify}
              captchaError={captchaError}
              consentErrors={consentErrors}
            />
          )}

          {step === 'success' && (
            <RegistrationSuccess
              companyName={createdCompanyName}
              userEmail={formData.companyEmail}
              username={generatedUsername}
              onGoToLogin={handleGoToLogin}
            />
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-muted">
          <p>
            {t('registration.alreadyHaveAccount')}{' '}
            <button
              onClick={handleGoToLogin}
              className="font-medium text-primary hover:text-primary/80"
            >
              {t('registration.signIn')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;

