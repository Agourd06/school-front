import React, { useEffect, useMemo, useState } from 'react';
import BaseModal from './BaseModal';
import { useCreateSchoolYearPeriod, useUpdateSchoolYearPeriod } from '../../hooks/useSchoolYearPeriods';
import { useSchoolYears } from '../../hooks/useSchoolYears';
import type { GetAllSchoolYearsParams } from '../../api/schoolYear';
import { validateRequired, validateDateOrder, validateSelectRequired } from './validations';
import { STATUS_OPTIONS_FORM } from '../../constants/status';

interface SchoolYearPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  period?: any | null;
}

const SchoolYearPeriodModal: React.FC<SchoolYearPeriodModalProps> = ({ isOpen, onClose, period }) => {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<number>(1);
  const [schoolYearId, setSchoolYearId] = useState<number | ''>('');

  const params: GetAllSchoolYearsParams = useMemo(() => ({ limit: 100, page: 1 }), []);
  const { data: yearsData } = useSchoolYears(params);

  const createMutation = useCreateSchoolYearPeriod();
  const updateMutation = useUpdateSchoolYearPeriod();

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (period) {
      setTitle(period.title || '');
      setStartDate(period.start_date || '');
      setEndDate(period.end_date || '');
      setStatus(typeof period.status === 'number' ? period.status : 1);
      setSchoolYearId(period.schoolYearId || period.schoolYear?.id || '');
    } else {
      setTitle('');
      setStartDate('');
      setEndDate('');
      setStatus(1);
      setSchoolYearId('');
    }
  }, [period, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    const requiredTitle = validateRequired(title, 'Title');
    if (requiredTitle) newErrors.title = requiredTitle;
    const startReq = validateRequired(startDate, 'Start date');
    if (startReq) newErrors.start_date = startReq;
    const endReq = validateRequired(endDate, 'End date');
    if (endReq) newErrors.end_date = endReq;
    const dateOrder = validateDateOrder(startDate, endDate, { start: 'start date', end: 'end date' });
    if (!newErrors.start_date && !newErrors.end_date && dateOrder) newErrors.date = dateOrder;
    const yearReq = validateSelectRequired(schoolYearId, 'School year');
    if (yearReq) newErrors.schoolYearId = yearReq;

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    const payload = {
      schoolYearId: Number(schoolYearId),
      title,
      start_date: startDate,
      end_date: endDate,
      status,
    };

    if (period?.id) {
      await updateMutation.mutateAsync({ id: period.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload as any);
    }
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={period ? 'Edit Period' : 'Add Period'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={status}
            onChange={(e) => setStatus(Number(e.target.value))}
          >
            {STATUS_OPTIONS_FORM.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">School Year</label>
          <select
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={schoolYearId}
            onChange={(e) => setSchoolYearId(e.target.value ? Number(e.target.value) : '')}
            required
          >
            <option value="">Select a school year</option>
            {(yearsData?.data || []).map((y: any) => (
              <option key={y.id} value={y.id}>{y.title}</option>
            ))}
          </select>
          {errors.schoolYearId && <p className="mt-1 text-sm text-red-600">{errors.schoolYearId}</p>}
        </div>

        {(errors.start_date || errors.end_date || errors.date) && (
          <div className="text-sm text-red-600">
            {errors.start_date || errors.end_date || errors.date}
          </div>
        )}

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
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {period ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
};

export default SchoolYearPeriodModal;


