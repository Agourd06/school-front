/**
 * Generates a username from a company name
 * Format: "admin_" + normalized company name
 * 
 * @param companyName - The company name to generate username from
 * @returns Generated username (e.g., "admin_acme_schools")
 */
export const generateUsernameFromCompanyName = (companyName: string): string => {
  if (!companyName || !companyName.trim()) {
    return 'admin';
  }

  // Normalize the company name:
  // 1. Convert to lowercase
  // 2. Replace spaces and special characters with underscores
  // 3. Remove multiple consecutive underscores
  // 4. Remove leading/trailing underscores
  const normalized = companyName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/[\s-]+/g, '_') // Replace spaces and hyphens with underscores
    .replace(/_+/g, '_') // Replace multiple underscores with single underscore
    .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores

  // If normalization results in empty string, use default
  if (!normalized) {
    return 'admin';
  }

  return `admin_${normalized}`;
};
