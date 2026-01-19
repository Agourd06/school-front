import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { STATUS_OPTIONS_FORM } from '../../constants/status';
import { getFileUrl } from '../../utils/apiConfig';
import { Input, Select, Button, FileInput } from '../ui';
import SearchSelect from '../inputs/SearchSelect';
import { countriesApi } from '../../api/countries';
import type { DiplomeFormData } from '../modals/student/types';
import type { StudentDiplome } from '../../api/studentDiplome';
import { Pencil, Trash2 } from 'lucide-react';

interface StudentDiplomeStepFormProps {
  form: DiplomeFormData;
  errors: Record<string, string>;
  diplomeFile1: File | null;
  diplomeFile2: File | null;
  currentDiplomePicture1?: string | null;
  currentDiplomePicture2?: string | null;
  studentName: string;
  onFormChange: (field: keyof DiplomeFormData, value: string | number | '') => void;
  onFile1Change: (file: File | null) => void;
  onFile2Change: (file: File | null) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  onSkip: () => void;
  isSubmitting: boolean;
  hasDiplome: boolean;
  justSaved?: boolean;
  onAddAnother?: () => void;
  onContinue?: () => void;
  allDiplomes?: StudentDiplome[];
  onEditDiplome?: (diplome: StudentDiplome) => void;
  onDeleteDiplome?: (diplomeId: number) => void;
  currentDiplomeId?: number;
  isDeletingDiplome?: boolean;
}

const StudentDiplomeStepForm: React.FC<StudentDiplomeStepFormProps> = ({
  form,
  errors,
  diplomeFile1,
  diplomeFile2,
  currentDiplomePicture1,
  currentDiplomePicture2,
  studentName,
  onFormChange,
  onFile1Change,
  onFile2Change,
  onSubmit,
  onBack,
  onSkip,
  isSubmitting,
  hasDiplome,
  justSaved = false,
  onAddAnother,
  onContinue,
  allDiplomes = [],
  onEditDiplome,
  onDeleteDiplome,
  currentDiplomeId,
  isDeletingDiplome,
}) => {
  const { t } = useTranslation();
  const [previewUrl1, setPreviewUrl1] = useState<string | null>(null);
  const [previewUrl2, setPreviewUrl2] = useState<string | null>(null);
  const [countries, setCountries] = useState<Array<{ name: string }>>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // Show preview of newly selected file, or existing picture for diplome 1
  useEffect(() => {
    if (diplomeFile1) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl1(reader.result as string);
      };
      reader.readAsDataURL(diplomeFile1);
    } else if (currentDiplomePicture1) {
      setPreviewUrl1(getFileUrl(currentDiplomePicture1));
    } else {
      setPreviewUrl1(null);
    }
  }, [diplomeFile1, currentDiplomePicture1]);

  // Show preview of newly selected file, or existing picture for diplome 2
  useEffect(() => {
    if (diplomeFile2) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl2(reader.result as string);
      };
      reader.readAsDataURL(diplomeFile2);
    } else if (currentDiplomePicture2) {
      setPreviewUrl2(getFileUrl(currentDiplomePicture2));
    } else {
      setPreviewUrl2(null);
    }
  }, [diplomeFile2, currentDiplomePicture2]);

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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Input
          label="Student"
          value={studentName}
          disabled
          className="bg-muted-foreground border-border"
        />
        <Select
          label="Status"
          value={form.status}
          onChange={(e) => onFormChange('status', Number(e.target.value))}
          options={STATUS_OPTIONS_FORM.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Input
          label="Title"
          value={form.title}
          onChange={(e) => onFormChange('title', e.target.value)}
          error={errors.title}
        />
        <Input
          label="School"
          value={form.school}
          onChange={(e) => onFormChange('school', e.target.value)}
          error={errors.school}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Input
          label="Diplome"
          value={form.diplome}
          onChange={(e) => onFormChange('diplome', e.target.value)}
        />
        <Input
          label="Year (YYYY)"
          value={form.annee}
          onChange={(e) => onFormChange('annee', e.target.value)}
          error={errors.annee}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-heading">Diplome picture 1</label>
            <div className="mt-1 flex items-start gap-3">
              {previewUrl1 && (
                <img
                  src={previewUrl1}
                  alt="Diplome picture 1 preview"
                  className="h-16 w-16 rounded object-cover border-2 border-border flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <div className="flex-1">
                <FileInput
                  accept="image/*"
                  onChange={onFile1Change}
                  error={errors.diplome_picture_1}
                  className="block w-full"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-heading">Diplome picture 2</label>
            <div className="mt-1 flex items-start gap-3">
              {previewUrl2 && (
                <img
                  src={previewUrl2}
                  alt="Diplome picture 2 preview"
                  className="h-16 w-16 rounded object-cover border-2 border-border flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <div className="flex-1">
                <FileInput
                  accept="image/*"
                  onChange={onFile2Change}
                  error={errors.diplome_picture_2}
                  className="block w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {justSaved && onAddAnother && onContinue ? (
        <div className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800 mb-4">
          Diplome saved successfully!
        </div>
      ) : null}

      {allDiplomes.length > 0 && (
        <div className="mt-6 pt-6 border-t border-tertiary/20">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Existing Diplomes</h3>
          <div className="space-y-2">
            {allDiplomes.map((diplome) => (
              <div
                key={diplome.id}
                className={`flex items-center justify-between p-3 rounded-md border ${
                  currentDiplomeId === diplome.id
                    ? 'border-primary bg-primary/5'
                    : 'border-primary/20 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900">
                    {diplome.title} {diplome.school && `— ${diplome.school}`}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {diplome.diplome && <span>{diplome.diplome}</span>}
                    {diplome.diplome && diplome.annee && <span className="mx-1">•</span>}
                    {diplome.annee && <span>Year: {diplome.annee}</span>}
                    {(diplome.city || diplome.country) && (
                      <>
                        {(diplome.diplome || diplome.annee) && <span className="mx-1">•</span>}
                        <span>{diplome.city || ''}{diplome.city && diplome.country ? ', ' : ''}{diplome.country || ''}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="ml-3 flex items-center gap-1">
                  {onEditDiplome && (
                    <button
                      type="button"
                      onClick={() => onEditDiplome(diplome)}
                      className="p-1.5 text-gray-400 hover:text-primary transition-colors"
                      title={t('forms.editDiplome')}
                      disabled={isDeletingDiplome}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                  {onDeleteDiplome && (
                    <button
                      type="button"
                      onClick={() => onDeleteDiplome(diplome.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete diplome"
                      disabled={isDeletingDiplome}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
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
                {t('forms.addAnother')}
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
              {hasDiplome ? 'Update & Continue' : 'Save & Continue'}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
};

export default StudentDiplomeStepForm;

