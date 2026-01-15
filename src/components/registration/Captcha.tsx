import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { captchaApi, type CaptchaData } from '../../api/captcha';

interface CaptchaProps {
  onVerify: (token: string, answer: string) => Promise<void>;
  onError?: (error: string) => void;
  disabled?: boolean;
  isVerified?: boolean; // Indicates if CAPTCHA is already verified
}

const Captcha: React.FC<CaptchaProps> = ({ onVerify, onError, disabled = false, isVerified = false }) => {
  const { t } = useTranslation();
  const [captchaData, setCaptchaData] = useState<CaptchaData | null>(null);
  const [userInput, setUserInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verified, setVerified] = useState<boolean>(isVerified);

  // Generate CAPTCHA on mount (only if not already verified)
  useEffect(() => {
    if (!verified) {
      generateCaptcha();
    }
  }, []);

  // Update verified state when prop changes
  useEffect(() => {
    setVerified(isVerified);
  }, [isVerified]);

  const generateCaptcha = async () => {
    try {
      setLoading(true);
      setError('');
      setUserInput(''); // Clear previous input

      const data = await captchaApi.generate();
      setCaptchaData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('registration.captchaFailedToLoad') || 'Failed to load CAPTCHA';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation(); // Prevent any event bubbling
    }
    
    if (!captchaData || !userInput.trim()) {
      setError(t('registration.captchaEnterAnswer') || 'Please enter the characters shown above');
      return;
    }

    try {
      setIsVerifying(true);
      setError('');

      // Normalize input (uppercase, trim)
      const normalizedInput = userInput.trim().toUpperCase();

      // ⚠️ CRITICAL: Pre-verify CAPTCHA IMMEDIATELY when user solves it
      // Original tokens expire after 2 minutes - must pre-verify within this window
      // Pre-verified tokens are valid for 5 minutes, giving user time to fill form
      // DO NOT wait for form submission - pre-verify NOW!
      const preVerifyResult = await captchaApi.preVerify({
        token: captchaData.token,
        answer: normalizedInput,
      });

      if (!preVerifyResult.valid) {
        // Pre-verification failed - don't mark as verified
        throw new Error(preVerifyResult.message || t('registration.captchaVerificationFailed') || 'CAPTCHA verification failed');
      }

      // Pre-verification successful - verify token is stored in cache
      // This is a debugging step to ensure the token was properly stored
      try {
        const tokenStatus = await captchaApi.getTokenStatus(captchaData.token);

        if (!tokenStatus.exists || !tokenStatus.preVerified) {
          // Token wasn't properly stored - this is a critical error
          throw new Error('CAPTCHA token was not properly stored. Please try again.');
        }
      } catch (statusError) {
        // If token status check fails, continue anyway (endpoint might not exist in all environments)
        // The backend will validate the token during registration
      }

      // Pre-verification successful and token confirmed in cache
      // Call parent's onVerify to store the pre-verified token and answer
      await onVerify(captchaData.token, normalizedInput);
      
      // Success - mark as verified, don't regenerate
      setVerified(true);
      setError(''); // Clear any previous errors
    } catch (err) {
      // Extract error message from API response
      let errorMessage = t('registration.captchaVerificationFailed') || 'CAPTCHA verification failed';
      
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { 
          response?: { 
            data?: { 
              message?: string | string[];
            };
          };
        };
        
        if (axiosError.response?.data?.message) {
          const dataMessage = axiosError.response.data.message;
          if (Array.isArray(dataMessage)) {
            errorMessage = dataMessage.join(', ');
          } else if (typeof dataMessage === 'string') {
            errorMessage = dataMessage;
          }
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      // Check if we need to regenerate (expired, max attempts, already used, invalid token)
      const needsRegeneration = errorMessage.toLowerCase().includes('expired') ||
                                errorMessage.toLowerCase().includes('maximum') ||
                                errorMessage.toLowerCase().includes('already been used') ||
                                errorMessage.toLowerCase().includes('invalid or expired');
      
      setError(errorMessage);
      setUserInput(''); // Clear input on error
      setVerified(false);
      
      // Only regenerate CAPTCHA if token is invalid/expired/max attempts
      // For incorrect answers, keep the same token so user can retry
      if (needsRegeneration) {
        generateCaptcha();
      }
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRefresh = () => {
    setVerified(false);
    setUserInput('');
    setError('');
    generateCaptcha();
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-muted">
        <p>{t('registration.captchaLoading') || 'Loading CAPTCHA...'}</p>
      </div>
    );
  }

  if (!captchaData) {
    return (
      <div className="p-4 text-center text-danger">
        <p>{t('registration.captchaFailedToLoad') || 'Failed to load CAPTCHA'}</p>
        <button 
          onClick={generateCaptcha} 
          type="button"
          className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/95 transition-colors"
        >
          {t('registration.retry') || t('common.retry') || 'Retry'}
        </button>
      </div>
    );
  }

  const renderGrid = () => {
    if (!captchaData) return null;

    // Row 1: Display characters in the specified column
    const row1 = [];
    for (let col = 0; col < 5; col++) {
      if (col === captchaData.charactersColumn) {
        // Display characters in this column - match visual height with row 2
        row1.push(
          <div
            key={col}
            className="flex-1 basis-0 min-w-0 flex items-center justify-center py-2.5 px-5 bg-gradient-to-br from-primary/8 to-primary/5 border-2 border-primary/40 rounded-xl shadow-sm"
            aria-label={`Characters column ${col + 1}`}
          >
            <span className="text-2xl font-bold text-heading tracking-[0.15em] font-mono select-none">
              {captchaData.characters}
            </span>
          </div>
        );
      } else {
        // Empty cell - show it with visible styling, match visual height with row 2
        row1.push(
          <div
            key={col}
            className="flex-1 basis-0 min-w-0 flex items-center justify-center py-2.5 px-5 bg-gray-50/60 border-2 border-gray-200/50 rounded-xl"
            aria-label={`Empty column ${col + 1}`}
          ></div>
        );
      }
    }

    // Row 2: Display input field in the specified column
    const row2 = [];
    for (let col = 0; col < 5; col++) {
      if (col === captchaData.inputColumn) {
        // Display input field in this column - keep current padding as reference
        row2.push(
          <div
            key={col}
            className="flex-1 basis-0 min-w-0 flex items-center justify-center py-1.5 px-5 bg-gradient-to-br from-primary/8 to-primary/5 border-2 border-primary/40 rounded-xl shadow-sm"
            aria-label={`Input column ${col + 1}`}
          >
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value.toUpperCase())}
              placeholder=""
              disabled={disabled || isVerifying}
              className="w-full px-1 py-2.5 text-center text-md font-bold border-2 border-primary/50 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none transition-all duration-200 bg-white disabled:bg-gray-50 disabled:cursor-not-allowed font-mono tracking-[0.02em] uppercase shadow-sm"
              maxLength={5}
              required
              aria-label={t('registration.captchaAnswer') || 'Enter CAPTCHA characters'}
              autoComplete="off"
            />
          </div>
        );
      } else {
        // Empty cell - show it with visible styling, match visual height
        row2.push(
          <div
            key={col}
            className="flex-1 basis-0 min-w-0 flex items-center justify-center py-2.5 px-5 bg-gray-50/60 border-2 border-gray-200/50 rounded-xl"
            aria-label={`Empty column ${col + 1}`}
          ></div>
        );
      }
    }

    return (
      <div className="mb-4 space-y-4" role="presentation">
        {/* Row 1: Characters */}
        <div className="flex gap-4 w-full">
          {row1}
        </div>
        {/* Row 2: Input */}
        <div className="flex gap-4 w-full">
          {row2}
        </div>
      </div>
    );
  };

  // Show success state if verified
  if (verified) {
    return (
      <div className="p-4 border-2 border-success/40 rounded-xl bg-success/5">
        <div className="flex items-center justify-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-success rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-success-dark">
              {t('registration.captchaVerified') || 'CAPTCHA verified successfully'}
            </p>
            <p className="text-xs text-muted mt-0.5">
              {t('registration.captchaReadyToSubmit') || 'You can now proceed to create your account'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={disabled}
            className="px-3 py-1.5 text-xs bg-white border border-border/60 rounded-lg hover:bg-[#fafbfc] hover:border-border focus:outline-none focus:ring-2 focus:ring-primary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            aria-label={t('registration.captchaRefresh') || 'Refresh CAPTCHA'}
            title={t('registration.captchaRefresh') || 'Refresh CAPTCHA'}
          >
            {t('registration.captchaRefresh') || 'Refresh'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border border-border/60 rounded-xl bg-[#fafbfc]">
      <div className="mb-4">
        <p className="text-sm text-muted mb-3 text-center">
          {t('registration.captchaInstruction') || 'Enter the characters shown above'}
        </p>
        {renderGrid()}
      </div>

      <div className="space-y-3">
        <div className="flex gap-2 justify-center">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={disabled || isVerifying}
            className="px-4 py-2 bg-white border border-border/60 rounded-xl hover:bg-[#fafbfc] hover:border-border focus:outline-none focus:ring-2 focus:ring-primary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
            aria-label={t('registration.captchaRefresh') || 'Refresh CAPTCHA'}
            title={t('registration.captchaRefresh') || 'Refresh CAPTCHA'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.5m13.5 5v-5H14m-5 5a7.5 7.5 0 01-7.5-7.5V7.5m15 0a7.5 7.5 0 01-7.5 7.5v-5m-7.5 0h5" />
            </svg>
            {t('registration.captchaRefresh') || 'Refresh'}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={disabled || isVerifying || !userInput.trim()}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/95 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
          >
            {isVerifying ? (t('registration.captchaVerifying') || 'Verifying...') : (t('registration.captchaVerify') || 'Verify')}
          </button>
        </div>

        {error && (
          <div className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg p-2.5 text-center" role="alert">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default Captcha;
