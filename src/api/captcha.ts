import api from './axios';

export interface CaptchaData {
  token: string;
  characters: string; // 5-character alphanumeric sequence
  charactersColumn: number; // Column index (0-4) where characters are displayed in row 1
  inputColumn: number; // Column index (0-4) where input field is placed in row 2
  type: string; // Always "grid"
}

export interface CaptchaVerifyRequest {
  token: string;
  answer: string; // 5-character alphanumeric string
}

export interface CaptchaVerifyResponse {
  valid: boolean;
  message: string;
}

export interface CaptchaPreVerifyRequest {
  token: string;
  answer: string; // 5-character alphanumeric string
}

export interface CaptchaPreVerifyResponse {
  valid: boolean;
  message: string;
  token: string; // The pre-verified token (same as input)
}

export interface CaptchaValidateResponse {
  valid: boolean;
}

export interface CaptchaTokenStatusResponse {
  exists: boolean;
  preVerified: boolean;
  expiresAt?: string;
  message?: string;
}

export const captchaApi = {
  /**
   * Generate a new CAPTCHA challenge
   * @returns CAPTCHA data with token, challenge, and type
   */
  generate: async (): Promise<CaptchaData> => {
    const response = await api.post('/captcha/generate');
    return response.data;
  },

  /**
   * Pre-verify CAPTCHA answer (recommended flow)
   * Pre-verifies the token immediately when user solves CAPTCHA
   * Token remains valid for 5 minutes for form submission
   * @param data - Token and answer to pre-verify
   * @returns Pre-verification result with token
   */
  preVerify: async (data: CaptchaPreVerifyRequest): Promise<CaptchaPreVerifyResponse> => {
    const response = await api.post('/captcha/pre-verify', data);
    return response.data;
  },

  /**
   * Verify CAPTCHA answer (legacy flow - not recommended for long forms)
   * @param data - Token and answer to verify
   * @returns Verification result
   */
  verify: async (data: CaptchaVerifyRequest): Promise<CaptchaVerifyResponse> => {
    const response = await api.post('/captcha/verify', data);
    return response.data;
  },

  /**
   * Validate if a CAPTCHA token is still valid (optional)
   * @param token - CAPTCHA token to validate
   * @returns Validation result
   */
  validate: async (token: string): Promise<CaptchaValidateResponse> => {
    const response = await api.get(`/captcha/validate?token=${token}`);
    return response.data;
  },

  /**
   * Check the status of a CAPTCHA token (for debugging)
   * @param token - CAPTCHA token to check
   * @returns Token status including existence and pre-verification state
   */
  getTokenStatus: async (token: string): Promise<CaptchaTokenStatusResponse> => {
    const response = await api.get(`/captcha/token-status/${token}`);
    return response.data;
  },
};
