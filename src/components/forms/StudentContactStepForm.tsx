import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Select, Button } from '../ui';
import SearchSelect from '../inputs/SearchSelect';
import PhoneInput from '../inputs/PhoneInput';
import { countriesApi } from '../../api/countries';
import type { ContactFormData } from '../modals/student/types';
import type { StudentLinkType } from '../../api/studentLinkType';
import type { StudentContact } from '../../api/studentContact';
import type { PaginatedResponse } from '../../types/api';
import { Pencil, Trash2 } from 'lucide-react';

interface StudentContactStepFormProps {
  form: ContactFormData;
  errors: Record<string, string>;
  linkTypesData: PaginatedResponse<StudentLinkType> | null | undefined;
  studentName: string;
  onFormChange: (field: keyof ContactFormData, value: string | number | '') => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  onSkip: () => void;
  isSubmitting: boolean;
  hasContact: boolean;
  justSaved?: boolean;
  onAddAnother?: () => void;
  onContinue?: () => void;
  allContacts?: StudentContact[];
  onEditContact?: (contact: StudentContact) => void;
  onDeleteContact?: (contactId: number) => void;
  currentContactId?: number;
  isDeletingContact?: boolean;
}

const StudentContactStepForm: React.FC<StudentContactStepFormProps> = ({
  form,
  errors,
  linkTypesData,
  studentName,
  onFormChange,
  onSubmit,
  onBack,
  onSkip,
  isSubmitting,
  hasContact,
  justSaved = false,
  onAddAnother,
  onContinue,
  allContacts = [],
  onEditContact,
  onDeleteContact,
  currentContactId,
  isDeletingContact,
}) => {
  const navigate = useNavigate();
  const [countries, setCountries] = useState<Array<{ name: string }>>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  
  const linkTypes = linkTypesData?.data || [];
  const hasLinkTypes = linkTypes.length > 0;

  // Load countries on mount
  useEffect(() => {
    const loadCountries = async () => {
      setLoadingCountries(true);
      try {
        const countriesList = await countriesApi.getCountries();
        setCountries(countriesList.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (error) {
        console.error('Failed to load countries:', error);
      } finally {
        setLoadingCountries(false);
      }
    };
    loadCountries();
  }, []);

  // Load cities when country changes
  useEffect(() => {
    if (form.country) {
      const loadCities = async () => {
        setLoadingCities(true);
        setCities([]);
        onFormChange('city', ''); // Reset city when country changes
        try {
          const citiesList = await countriesApi.getCities(form.country);
          setCities(citiesList);
        } catch (error) {
          console.error('Failed to load cities:', error);
        } finally {
          setLoadingCities(false);
        }
      };
      loadCities();
    } else {
      setCities([]);
      onFormChange('city', '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.country]);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {errors.form && <p className="text-sm text-danger">{errors.form}</p>}
      
      {!hasLinkTypes && (
        <div className="rounded-md border border-orange-300 bg-orange-50 px-3 py-2 text-sm text-orange-800">
          <strong>Warning:</strong> No link types available. Please create a link type first in{' '}
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="font-medium text-orange-900 hover:text-orange-950 underline cursor-pointer transition-colors"
          >
            settings &gt; types &gt; link types
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Student"
          value={studentName}
          disabled
          className="bg-muted-foreground border-border"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="First name"
          value={form.firstname}
          onChange={(e) => onFormChange('firstname', e.target.value)}
          error={errors.firstname}
        />
        <Input
          label="Last name"
          value={form.lastname}
          onChange={(e) => onFormChange('lastname', e.target.value)}
          error={errors.lastname}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Birthday"
          type="date"
          value={form.birthday}
          onChange={(e) => onFormChange('birthday', e.target.value)}
          max={new Date().toISOString().split('T')[0]}
        />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => onFormChange('email', e.target.value)}
          error={errors.email}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PhoneInput
          label="Phone"
          value={form.phone}
          onChange={(e) => onFormChange('phone', e.target.value)}
          error={errors.phone}
        />
        <div>
          <Select
            label="Link type"
            value={form.studentlinktypeId}
            onChange={(e) => onFormChange('studentlinktypeId', e.target.value ? Number(e.target.value) : '')}
            options={[
              { value: '', label: 'Select link type' },
              ...(linkTypes.map((lt: StudentLinkType) => ({
                value: lt.id,
                label: lt.title,
              })))
            ]}
          />
          {hasLinkTypes && (
            <p className="mt-1 text-xs text-gray-500">
              To create a type:{' '}
              <button
                type="button"
                onClick={() => navigate('/settings')}
                className="font-medium text-secondary hover:text-secondary/80 underline cursor-pointer transition-colors"
              >
                settings
              </button>
              {' > types > link types'}
            </p>
          )}
        </div>
      </div>

      <Input
        label="Address"
        value={form.adress}
        onChange={(e) => onFormChange('adress', e.target.value)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SearchSelect
          label="Country"
          value={form.country || ''}
          onChange={(value) => onFormChange('country', value as string)}
          options={countries.map((country) => ({
            value: country.name,
            label: country.name,
          }))}
          placeholder={loadingCountries ? 'Loading countries...' : 'Search country...'}
          isLoading={loadingCountries}
        />
        <SearchSelect
          label="City"
          value={form.city || ''}
          onChange={(value) => onFormChange('city', value as string)}
          options={cities.map((city) => ({
            value: city,
            label: city,
          }))}
          placeholder={!form.country ? 'Select a country first' : loadingCities ? 'Loading cities...' : 'Search city...'}
          disabled={!form.country || loadingCities}
          isLoading={loadingCities}
        />
      </div>

      {justSaved && onAddAnother && onContinue ? (
        <div className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800 mb-4">
          Contact saved successfully!
        </div>
      ) : null}

      {allContacts.length > 0 && (
        <div className="mt-6 pt-6 border-t border-tertiary/20">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Existing Contacts</h3>
          <div className="space-y-2">
            {allContacts.map((contact) => {
              // Find the link type from linkTypesData
              const linkType = linkTypesData?.data?.find(
                (lt) => lt.id === contact.studentlinktypeId
              );
              
              return (
                <div
                  key={contact.id}
                  className={`flex items-center justify-between p-3 rounded-md border ${
                    currentContactId === contact.id
                      ? 'border-primary bg-primary/5'
                      : 'border-primary/20 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-900">
                      {contact.firstname} {contact.lastname}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {contact.email && <span>{contact.email}</span>}
                      {contact.email && contact.phone && <span className="mx-1">•</span>}
                      {contact.phone && <span>{contact.phone}</span>}
                      {linkType && (
                        <>
                          {(contact.email || contact.phone) && <span className="mx-1">•</span>}
                          <span>{linkType.title}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="ml-3 flex items-center gap-1">
                    {onEditContact && (
                      <button
                        type="button"
                        onClick={() => onEditContact(contact)}
                        className="p-1.5 text-gray-400 hover:text-primary transition-colors"
                        title="Edit contact"
                        disabled={isDeletingContact}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    {onDeleteContact && (
                      <button
                        type="button"
                        onClick={() => onDeleteContact(contact.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete contact"
                        disabled={isDeletingContact}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex justify-between space-x-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onBack}
          disabled={justSaved}
        >
          Back
        </Button>
        <div className="flex space-x-3">
          {!justSaved && (
            <Button
              type="button"
              variant="secondary"
              onClick={onSkip}
            >
              Skip
            </Button>
          )}
          {justSaved && onAddAnother && onContinue ? (
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={onAddAnother}
              >
                Add Another
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={onContinue}
              >
                Continue
              </Button>
            </>
          ) : (
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              {hasContact ? 'Update & Continue' : 'Save & Continue'}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
};

export default StudentContactStepForm;

