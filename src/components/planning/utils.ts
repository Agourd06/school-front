import { DEFAULT_PLANNING_STATUS } from '../../constants/planning';
import type { FormState, PlanningPagination } from './types';

export const INITIAL_PAGINATION: PlanningPagination = {
  page: 1,
  limit: 50,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrevious: false,
};

export const getMonday = (input: Date) => {
  const date = new Date(input);
  const diff = date.getDay() === 0 ? -6 : 1 - date.getDay();
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const formatISODate = (date: Date) => date.toISOString().split('T')[0];

export const normalizeTimeFormat = (time: string) => time?.split(':').slice(0, 2).join(':') || '';

const generateTimeOptions = (): string[] => {
  const options: string[] = [];
  for (let hour = 6; hour < 24; hour++) {
    for (const minute of [0, 15, 30, 45]) {
      options.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    }
  }
  options.push('00:00');
  return options;
};

export const TIME_OPTIONS = generateTimeOptions();

export const INITIAL_FORM = (weekStart: Date): FormState => ({
  school_year_id: '',
  period: '',
  date_day: formatISODate(weekStart),
  hour_start: '06:00',
  hour_end: '07:00',
  class_id: '',
  specialization_id: '',
  teacher_id: '',
  class_room_id: '',
  planning_session_type_id: '',
  course_id: '',
  status: DEFAULT_PLANNING_STATUS,
});

export const extractErrorMessage = (err: unknown): string => {
  if (!err) return 'Unexpected error';
  const axiosError = err as { response?: { data?: { message?: string | string[] } }; message?: string };
  const dataMessage = axiosError?.response?.data?.message;
  if (Array.isArray(dataMessage)) return dataMessage.join(', ');
  if (typeof dataMessage === 'string') return dataMessage;
  if (typeof axiosError.message === 'string') return axiosError.message;
  return 'Unexpected error';
};


