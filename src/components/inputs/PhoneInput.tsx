import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

// Common countries with phone codes, flag emojis, and example numbers
const COUNTRIES = [
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', exampleNumber: '0612345678' },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', exampleNumber: '(555) 123-4567' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', exampleNumber: '7700 900123' },
  { code: 'DZ', name: 'Algeria', dialCode: '+213', flag: '🇩🇿', exampleNumber: '0551 23 45 67' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪', exampleNumber: '030 12345678' },
  { code: 'BE', name: 'Belgium', dialCode: '+32', flag: '🇧🇪', exampleNumber: '012 34 56 78' },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸', exampleNumber: '612 34 56 78' },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹', exampleNumber: '312 345 6789' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱', exampleNumber: '0612345678' },
  { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹', exampleNumber: '912 345 678' },
  { code: 'CH', name: 'Switzerland', dialCode: '+41', flag: '🇨🇭', exampleNumber: '021 234 56 78' },
  { code: 'AT', name: 'Austria', dialCode: '+43', flag: '🇦🇹', exampleNumber: '0664 123456' },
  { code: 'SE', name: 'Sweden', dialCode: '+46', flag: '🇸🇪', exampleNumber: '070-123 45 67' },
  { code: 'NO', name: 'Norway', dialCode: '+47', flag: '🇳🇴', exampleNumber: '912 34 567' },
  { code: 'DK', name: 'Denmark', dialCode: '+45', flag: '🇩🇰', exampleNumber: '20 12 34 56' },
  { code: 'FI', name: 'Finland', dialCode: '+358', flag: '🇫🇮', exampleNumber: '050 123 4567' },
  { code: 'PL', name: 'Poland', dialCode: '+48', flag: '🇵🇱', exampleNumber: '512 345 678' },
  { code: 'GR', name: 'Greece', dialCode: '+30', flag: '🇬🇷', exampleNumber: '691 234 5678' },
  { code: 'IE', name: 'Ireland', dialCode: '+353', flag: '🇮🇪', exampleNumber: '085 123 4567' },
  { code: 'CZ', name: 'Czech Republic', dialCode: '+420', flag: '🇨🇿', exampleNumber: '601 123 456' },
  { code: 'RO', name: 'Romania', dialCode: '+40', flag: '🇷🇴', exampleNumber: '0712 345 678' },
  { code: 'HU', name: 'Hungary', dialCode: '+36', flag: '🇭🇺', exampleNumber: '201 234 567' },
  { code: 'BG', name: 'Bulgaria', dialCode: '+359', flag: '🇧🇬', exampleNumber: '0888 123 456' },
  { code: 'HR', name: 'Croatia', dialCode: '+385', flag: '🇭🇷', exampleNumber: '091 234 5678' },
  { code: 'SK', name: 'Slovakia', dialCode: '+421', flag: '🇸🇰', exampleNumber: '912 123 456' },
  { code: 'SI', name: 'Slovenia', dialCode: '+386', flag: '🇸🇮', exampleNumber: '031 234 567' },
  { code: 'LT', name: 'Lithuania', dialCode: '+370', flag: '🇱🇹', exampleNumber: '612 34567' },
  { code: 'LV', name: 'Latvia', dialCode: '+371', flag: '🇱🇻', exampleNumber: '21234567' },
  { code: 'EE', name: 'Estonia', dialCode: '+372', flag: '🇪🇪', exampleNumber: '5123 4567' },
  { code: 'MA', name: 'Morocco', dialCode: '+212', flag: '🇲🇦', exampleNumber: '0520-123456' },
  { code: 'TN', name: 'Tunisia', dialCode: '+216', flag: '🇹🇳', exampleNumber: '20 123 456' },
  { code: 'EG', name: 'Egypt', dialCode: '+20', flag: '🇪🇬', exampleNumber: '0100 123 4567' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦', exampleNumber: '050 123 4567' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪', exampleNumber: '050 123 4567' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', exampleNumber: '(555) 123-4567' },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽', exampleNumber: '55 1234 5678' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷', exampleNumber: '(11) 91234-5678' },
  { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷', exampleNumber: '11 1234-5678' },
  { code: 'CL', name: 'Chile', dialCode: '+56', flag: '🇨🇱', exampleNumber: '9 1234 5678' },
  { code: 'CO', name: 'Colombia', dialCode: '+57', flag: '🇨🇴', exampleNumber: '321 123 4567' },
  { code: 'PE', name: 'Peru', dialCode: '+51', flag: '🇵🇪', exampleNumber: '912 345 678' },
  { code: 'VE', name: 'Venezuela', dialCode: '+58', flag: '🇻🇪', exampleNumber: '0412 1234567' },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳', exampleNumber: '131 2345 6789' },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵', exampleNumber: '90-1234-5678' },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷', exampleNumber: '10-1234-5678' },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳', exampleNumber: '81234 56789' },
  { code: 'ID', name: 'Indonesia', dialCode: '+62', flag: '🇮🇩', exampleNumber: '812-345-678' },
  { code: 'TH', name: 'Thailand', dialCode: '+66', flag: '🇹🇭', exampleNumber: '81 234 5678' },
  { code: 'VN', name: 'Vietnam', dialCode: '+84', flag: '🇻🇳', exampleNumber: '91 234 5678' },
  { code: 'PH', name: 'Philippines', dialCode: '+63', flag: '🇵🇭', exampleNumber: '912 345 6789' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾', exampleNumber: '12-345 6789' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬', exampleNumber: '8123 4567' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺', exampleNumber: '0412 345 678' },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿', exampleNumber: '021 123 4567' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦', exampleNumber: '082 123 4567' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬', exampleNumber: '802 123 4567' },
  { code: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪', exampleNumber: '712 123456' },
  { code: 'GH', name: 'Ghana', dialCode: '+233', flag: '🇬🇭', exampleNumber: '024 123 4567' },
  { code: 'RU', name: 'Russia', dialCode: '+7', flag: '🇷🇺', exampleNumber: '912 345-67-89' },
  { code: 'TR', name: 'Turkey', dialCode: '+90', flag: '🇹🇷', exampleNumber: '532 123 45 67' },
].sort((a, b) => a.name.localeCompare(b.name));

export interface PhoneInputProps {
  label?: string;
  name?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  label,
  name = 'phone',
  value,
  onChange,
  error,
  disabled = false,
  className = '',
  placeholder = 'Phone number',
}) => {
  const [isCountrySearchOpen, setIsCountrySearchOpen] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState('');
  // Default to Morocco
  const defaultCountry = COUNTRIES.find((c) => c.code === 'MA') || COUNTRIES[0];
  const [selectedCountry, setSelectedCountry] = useState(defaultCountry);
  const [phoneNumber, setPhoneNumber] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Parse existing value to extract country code and phone number
  useEffect(() => {
    if (value) {
      // Try to find matching country code (check for dialCode with space or without)
      let foundCountry = COUNTRIES.find((country) => 
        value.startsWith(country.dialCode + ' ') || value === country.dialCode
      );
      
      // If not found with space, try without space
      if (!foundCountry) {
        foundCountry = COUNTRIES.find((country) => value.startsWith(country.dialCode));
      }
      
      if (foundCountry) {
        setSelectedCountry(foundCountry);
        // Remove the dial code (with or without space)
        const phoneOnly = value
          .replace(foundCountry.dialCode, '')
          .replace(/^[\s\-]+/, '')
          .trim();
        setPhoneNumber(phoneOnly);
      } else {
        // If no country code found, assume it's just the phone number
        setPhoneNumber(value);
      }
    } else {
      setPhoneNumber('');
    }
  }, [value]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isCountrySearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isCountrySearchOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsCountrySearchOpen(false);
        setCountrySearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter countries based on search query
  const filteredCountries = countrySearchQuery
    ? COUNTRIES.filter(
        (country) =>
          country.name.toLowerCase().includes(countrySearchQuery.toLowerCase()) ||
          country.dialCode.includes(countrySearchQuery) ||
          country.code.toLowerCase().includes(countrySearchQuery.toLowerCase())
      )
    : COUNTRIES;

  const handleCountrySelect = (country: typeof COUNTRIES[0]) => {
    setSelectedCountry(country);
    setIsCountrySearchOpen(false);
    setCountrySearchQuery('');
    // Update the combined value
    const newValue = country.dialCode + (phoneNumber ? ' ' + phoneNumber : '');
    const syntheticEvent = {
      target: { name, value: newValue },
    } as React.ChangeEvent<HTMLInputElement>;
    onChange(syntheticEvent);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newPhoneNumber = e.target.value;
    
    // Check if user typed + followed by a dial code (try longest matches first)
    if (newPhoneNumber.startsWith('+')) {
      // Sort countries by dial code length (longest first) to match correctly
      const sortedCountries = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
      
      for (const country of sortedCountries) {
        if (newPhoneNumber.startsWith(country.dialCode + ' ') || 
            (newPhoneNumber.startsWith(country.dialCode) && newPhoneNumber.length > country.dialCode.length)) {
          setSelectedCountry(country);
          newPhoneNumber = newPhoneNumber.replace(country.dialCode, '').replace(/^\s+/, '').trim();
          break;
        }
      }
    }
    
    setPhoneNumber(newPhoneNumber);
    // Combine country code with phone number
    const newValue = selectedCountry.dialCode + (newPhoneNumber ? ' ' + newPhoneNumber : '');
    const syntheticEvent = {
      target: { name, value: newValue },
    } as React.ChangeEvent<HTMLInputElement>;
    onChange(syntheticEvent);
  };

  return (
    <div className={`w-full relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-heading mb-1">
          {label}
        </label>
      )}
      <div className={`flex gap-0 border rounded-md overflow-hidden ${
        error ? 'border-danger' : 'border-border'
      } ${error ? 'focus-within:ring-2 focus-within:ring-danger' : 'focus-within:ring-2 focus-within:ring-primary'}`}>
        {/* Country Code Button */}
        <button
          type="button"
          onClick={() => !disabled && setIsCountrySearchOpen(!isCountrySearchOpen)}
          disabled={disabled}
          className={`flex items-center justify-center border-r px-3 py-2 text-sm focus:outline-none transition-all ${
            error
              ? 'border-danger'
              : 'border-border'
          } ${
            disabled
              ? 'cursor-not-allowed bg-muted-foreground text-muted opacity-60'
              : 'bg-card text-body hover:bg-gray-50 cursor-pointer'
          }`}
        >
          <span className="text-lg leading-none">{selectedCountry.flag}</span>
        </button>

        {/* Phone Number Input */}
        <div className="flex-1 relative">
          <input
            type="tel"
            name={name}
            value={phoneNumber}
            onChange={handlePhoneChange}
            disabled={disabled}
            placeholder={selectedCountry.exampleNumber || placeholder}
            className={`w-full px-3 py-2 text-sm focus:outline-none transition-all ${
              disabled
                ? 'cursor-not-allowed bg-muted-foreground text-muted opacity-60'
                : 'bg-card text-body'
            }`}
          />
        </div>
      </div>

      {/* Country Search Dropdown */}
      {isCountrySearchOpen && !disabled && (
        <div
          ref={dropdownRef}
          className="absolute z-[9999] mt-1 w-80 bg-card border border-border rounded-md shadow-lg"
          style={{ top: '100%', left: 0 }}
        >
          {/* Search Input */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                ref={searchInputRef}
                type="text"
                value={countrySearchQuery}
                onChange={(e) => setCountrySearchQuery(e.target.value)}
                placeholder="Type to search for a country"
                className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-card text-body italic text-gray-500 placeholder:text-gray-400"
              />
              {countrySearchQuery && (
                <button
                  type="button"
                  onClick={() => setCountrySearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted hover:text-body"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Country List */}
          <div className="max-h-60 overflow-auto py-1">
            {filteredCountries.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted text-center">No countries found</div>
            ) : (
              filteredCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountrySelect(country)}
                  className={`w-full px-3 py-2 text-sm text-left flex items-center gap-3 hover:bg-primary-transparent hover:text-primary transition-colors ${
                    selectedCountry.code === country.code
                      ? 'bg-primary-transparent text-primary font-medium'
                      : 'text-body'
                  }`}
                >
                  <span className="text-lg">{country.flag}</span>
                  <span className="flex-1">{country.name}</span>
                  <span className="text-xs text-muted">{country.dialCode}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
      {!error && selectedCountry.exampleNumber && (
        <p className="mt-1 text-xs text-gray-500">
          Example: {selectedCountry.exampleNumber}
        </p>
      )}
    </div>
  );
};

export default PhoneInput;

