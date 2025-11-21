import React, { useState, useEffect } from 'react';
import { Input, Select, Button } from '../../ui';
import { STATUS_OPTIONS_FORM } from '../../../constants/status';
import { getFileUrl } from '../../../utils/apiConfig';
import type { DiplomeFormData } from './types';

interface DiplomeStepProps {
  form: DiplomeFormData;
  errors: Record<string, string>;
  diplomeFile1: File | null;
  diplomeFile2: File | null;
  currentDiplomePicture1?: string | null;
  currentDiplomePicture2?: string | null;
  studentName: string;
  onFormChange: (field: keyof DiplomeFormData, value: any) => void;
  onFile1Change: (file: File | null) => void;
  onFile2Change: (file: File | null) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  onSkip: () => void;
  isSubmitting: boolean;
  hasDiplome: boolean;
}

const DiplomeStep: React.FC<DiplomeStepProps> = ({
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
}) => {
  const [previewUrl1, setPreviewUrl1] = useState<string | null>(null);
  const [previewUrl2, setPreviewUrl2] = useState<string | null>(null);

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

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {errors.form && <p className="text-sm text-red-600">{errors.form}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Student"
          value={studentName}
          disabled
          className="bg-gray-100 border-gray-200"
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
        <Input
          label="Country"
          value={form.country}
          onChange={(e) => onFormChange('country', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="City"
          value={form.city}
          onChange={(e) => onFormChange('city', e.target.value)}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Diplome picture 1</label>
            <div className="mt-1 flex items-start gap-3">
              {previewUrl1 && (
                <img
                  src={previewUrl1}
                  alt="Diplome picture 1 preview"
                  className="h-16 w-16 rounded object-cover border-2 border-gray-300 flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onFile1Change(e.target.files?.[0] || null)}
                  className="block w-full"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Diplome picture 2</label>
            <div className="mt-1 flex items-start gap-3">
              {previewUrl2 && (
                <img
                  src={previewUrl2}
                  alt="Diplome picture 2 preview"
                  className="h-16 w-16 rounded object-cover border-2 border-gray-300 flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onFile2Change(e.target.files?.[0] || null)}
                  className="block w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between space-x-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onBack}
        >
          Back
        </Button>
        <div className="flex space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onSkip}
          >
            Skip
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            {hasDiplome ? 'Update & Continue' : 'Save & Continue'}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default DiplomeStep;

