import React, { useState, useEffect } from 'react';
import { useCreateSchoolYear, useUpdateSchoolYear } from '../../hooks/useSchoolYears';
import { useCompanies } from '../../hooks/useCompanies';
import BaseModal from './BaseModal';
import { validateRequired, validateDateOrder } from './validations';

interface SchoolYear {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  status: number;
  company: { id: number; name: string };
}

interface SchoolYearModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolYear?: SchoolYear | null;
}

const SchoolYearModal: React.FC<SchoolYearModalProps> = ({ isOpen, onClose, schoolYear }) => {
  const [formData, setFormData] = useState({
    title: '',
    start_date: '',
    end_date: '',
    status: 1,
    companyId: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const createSchoolYear = useCreateSchoolYear();
  const updateSchoolYear = useUpdateSchoolYear();
  const { data: companies, isLoading: companiesLoading } = useCompanies();

  const isEditing = !!schoolYear;

  useEffect(() => {
    if (schoolYear) {
      setFormData({
        title: schoolYear.title || '',
        start_date: schoolYear.start_date || '',
        end_date: schoolYear.end_date || '',
        status: schoolYear.status || 1,
        companyId: schoolYear.company?.id || 0,
      });
    } else {
      setFormData({
        title: '',
        start_date: '',
        end_date: '',
        status: 1,
        companyId: 0,
      });
    }
    setErrors({});
  }, [schoolYear, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    const titleErr = validateRequired(formData.title, 'Title');
    if (titleErr) newErrors.title = titleErr;
    const startErr = validateRequired(formData.start_date, 'Start date');
    if (startErr) newErrors.start_date = startErr;
    const endErr = validateRequired(formData.end_date, 'End date');
    if (endErr) newErrors.end_date = endErr;
    const orderErr = validateDateOrder(formData.start_date, formData.end_date, { start: 'start date', end: 'end date' });
    if (!newErrors.start_date && !newErrors.end_date && orderErr) newErrors.end_date = orderErr;
    if (!formData.companyId || formData.companyId === 0) newErrors.companyId = 'Company is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (isEditing && schoolYear) {
        await updateSchoolYear.mutateAsync({
          id: schoolYear.id,
          title: formData.title,
          start_date: formData.start_date,
          end_date: formData.end_date,
          status: formData.status,
          companyId: formData.companyId,
        });
      } else {
        await createSchoolYear.mutateAsync({
          title: formData.title,
          start_date: formData.start_date,
          end_date: formData.end_date,
          status: formData.status,
          companyId: formData.companyId,
        });
      }
      onClose();
    } catch (error) {
      console.error('SchoolYear operation failed:', error);
      alert('Operation failed. Please try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'status' || name === 'companyId' ? Number(value) : value,
    }));

    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit School Year' : 'Add School Year'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
              errors.title ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
        </div>

        <div>
          <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
            Start Date
          </label>
          <input
            type="date"
            id="start_date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
              errors.start_date ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.start_date && <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>}
        </div>

        <div>
          <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
            End Date
          </label>
          <input
            type="date"
            id="end_date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
              errors.end_date ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.end_date && <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>}
        </div>

        <div>
          <label htmlFor="companyId" className="block text-sm font-medium text-gray-700">
            Company
          </label>
          {companiesLoading ? (
            <p>Loading companies...</p>
          ) : (
            <select
              id="companyId"
              name="companyId"
              value={formData.companyId}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value={0} disabled>
                Select a company
              </option>
              {companies?.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          )}
          {errors.companyId && <p className="mt-1 text-sm text-red-600">{errors.companyId}</p>}
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value={1}>Active</option>
            <option value={2}>Pending</option>
            <option value={0}>Disabled</option>
            <option value={-1}>Archived</option>
            <option value={-2}>Deleted</option>
          </select>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createSchoolYear.isPending || updateSchoolYear.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {createSchoolYear.isPending || updateSchoolYear.isPending
              ? 'Saving...'
              : isEditing
              ? 'Update'
              : 'Create'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
};

export default SchoolYearModal;
