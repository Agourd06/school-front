import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface CustomSelectProps {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  value?: string | number;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  name?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * A fully customizable Select component with complete styling control.
 * Replaces native select to avoid browser default styling limitations.
 * 
 * @example
 * ```tsx
 * <CustomSelect
 *   label="Status"
 *   name="status"
 *   value={form.status}
 *   onChange={handleChange}
 *   options={[
 *     { value: '', label: 'Select status' },
 *     { value: 1, label: 'Active' },
 *     { value: 0, label: 'Inactive' },
 *   ]}
 *   error={errors.status}
 * />
 * ```
 */
const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  error,
  helperText,
  options,
  placeholder,
  value,
  onChange,
  name,
  id,
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const selectId = React.useId();
  const finalId = id || selectId;
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Memoize selected option lookup to avoid recalculation on every render
  const selectedOption = useMemo(
    () => options.find((opt) => String(opt.value) === String(value)),
    [options, value]
  );
  
  const displayValue = useMemo(
    () => selectedOption?.label || placeholder || 'Select...',
    [selectedOption, placeholder]
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Memoize handleSelect to avoid recreating on every render
  const handleSelect = useCallback((option: SelectOption) => {
    if (disabled) return;

    // Create a synthetic change event
    const syntheticEvent = {
      target: {
        name: name || '',
        value: option.value,
      },
      currentTarget: {
        name: name || '',
        value: option.value,
      },
    } as React.ChangeEvent<HTMLSelectElement>;

    onChange?.(syntheticEvent);
    setIsOpen(false);
    setFocusedIndex(-1);
    buttonRef.current?.focus();
  }, [disabled, name, onChange]);

  // Memoize toggleDropdown
  const toggleDropdown = useCallback(() => {
    if (disabled) return;
    setIsOpen((prev) => {
      if (!prev) {
        // Set initial focus to selected option or first option
        const currentIndex = options.findIndex((opt) => String(opt.value) === String(value));
        setFocusedIndex(currentIndex >= 0 ? currentIndex : 0);
      }
      return !prev;
    });
  }, [disabled, options, value]);

  // Handle keyboard navigation - memoize options length
  const optionsLength = options.length;
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
        setFocusedIndex(-1);
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        setFocusedIndex((prev) => {
          const next = prev < optionsLength - 1 ? prev + 1 : 0;
          // Scroll into view
          const optionElement = listRef.current?.children[next] as HTMLElement;
          if (optionElement) {
            optionElement.scrollIntoView({ block: 'nearest' });
          }
          return next;
        });
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setFocusedIndex((prev) => {
          const next = prev > 0 ? prev - 1 : optionsLength - 1;
          // Scroll into view
          const optionElement = listRef.current?.children[next] as HTMLElement;
          if (optionElement) {
            optionElement.scrollIntoView({ block: 'nearest' });
          }
          return next;
        });
      } else if (event.key === 'Enter' && focusedIndex >= 0) {
        event.preventDefault();
        const option = options[focusedIndex];
        if (option && !disabled) {
          handleSelect(option);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, focusedIndex, optionsLength, options, disabled, handleSelect]);

  return (
    <div className={`w-full ${className}`} ref={containerRef}>
      {label && (
        <label 
          htmlFor={finalId} 
          className="block text-sm font-medium text-heading mb-1"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {/* Hidden native select for form submission */}
        <select
          id={finalId}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Custom dropdown button */}
        <button
          ref={buttonRef}
          type="button"
          onClick={toggleDropdown}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-labelledby={label ? `${finalId}-label` : undefined}
          className={`custom-select-button w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 transition-all duration-200 text-left flex items-center justify-between ${
            error 
              ? 'border-danger focus:ring-danger focus:border-danger bg-card text-body' 
              : 'border-border focus:border-primary focus:ring-primary bg-card text-body'
          } ${
            disabled 
              ? 'cursor-not-allowed bg-muted-foreground text-muted opacity-60' 
              : 'hover:border-primary cursor-pointer'
          } ${!selectedOption && placeholder ? 'text-muted' : ''} ${label ? 'mt-1' : ''}`}
        >
          <span className="truncate">{displayValue}</span>
          <ChevronDown 
            className={`h-4 w-4 flex-shrink-0 ml-2 transition-transform duration-200 ${
              isOpen ? 'transform rotate-180' : ''
            } ${error ? 'text-danger' : 'text-muted'}`}
          />
        </button>

        {/* Custom dropdown menu */}
        {isOpen && !disabled && (
          <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-auto">
            <ul
              ref={listRef}
              role="listbox"
              className="py-1"
            >
              {options.map((option, index) => {
                const isSelected = String(option.value) === String(value);
                const isFocused = index === focusedIndex;
                return (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(option)}
                    onMouseEnter={() => setFocusedIndex(index)}
                    className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-foreground font-medium'
                        : isFocused
                        ? 'bg-primary-transparent text-primary'
                        : 'text-body hover:bg-primary-transparent hover:text-primary'
                    }`}
                  >
                    {option.label}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-xs text-muted">
          {helperText}
        </p>
      )}
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export default React.memo(CustomSelect);
export type { SelectOption, CustomSelectProps };

