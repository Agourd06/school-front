import type { PlanningStatus } from '../../constants/planning';
import type { PlanningStudentEntry } from '../../api/planningStudent';
import type { ClassEntity } from '../../api/classes';
import type { Course } from '../../api/course';
import type { ClassStudentAssignment } from '../../api/classStudent';
import type { SearchSelectOption } from '../inputs/SearchSelect';

export type PlanningViewMode = 'week' | 'month';

export interface PlanningFilters {
  status: PlanningStatus | '' | 'all';
  class_id: number | '';
  class_room_id: number | '';
  teacher_id: number | '';
  specialization_id: number | '';
  planning_session_type_id: number | '';
  course_id: number | '';
}

export interface PlanningPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PlanningState {
  data: PlanningStudentEntry[];
  loading: boolean;
  error: string | null;
  pagination: PlanningPagination;
  filters: PlanningFilters;
}

export interface FormState {
  school_year_id: number | '';
  period: string;
  date_day: string;
  hour_start: string;
  hour_end: string;
  class_id: number | '';
  specialization_id: number | '';
  teacher_id: number | '';
  class_room_id: number | '';
  planning_session_type_id: number | '';
  course_id: number | '';
  status: PlanningStatus;
}

export interface FormAlert {
  type: 'success' | 'error';
  message: string;
}

export interface PlanningFormProps {
  form: FormState;
  formErrors: Record<string, string>;
  formAlert: FormAlert | null;
  isSubmitting: boolean;
  isDeleting: boolean;
  selectedEntry: PlanningStudentEntry | null;
  resetForm: () => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleDelete: () => Promise<void>;
  handleSelectChange: (name: keyof FormState) => (value: number | '' | string) => void;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  setFormErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  teacherOptions: SearchSelectOption[];
  specializationOptions: SearchSelectOption[];
  classOptions: SearchSelectOption[];
  roomOptions: SearchSelectOption[];
  periodOptions: SearchSelectOption[];
  sessionTypeOptions: SearchSelectOption[];
  courseOptions: SearchSelectOption[];
  yearOptions: SearchSelectOption[];
  periodsLoading: boolean;
  teachersLoading: boolean;
  classesLoading: boolean;
  roomsLoading: boolean;
  yearsLoading: boolean;
  sessionTypesLoading: boolean;
  coursesLoading: boolean;
  onOpenSessionTypeModal?: () => void;
  isCreatingSessionType?: boolean;
  classDetails: ClassEntity | null;
  courseDetails: Course | null;
  classStudents: ClassStudentAssignment[];
  classStudentsLoading: boolean;
  classStudentsError: string | null;
}

export interface PlanningHeaderProps {
  viewMode: PlanningViewMode;
  onViewModeChange: (mode: PlanningViewMode) => void;
  showForm: boolean;
  onToggleForm: () => void;
}

export interface PlanningFiltersBarProps {
  filters: PlanningFilters;
  onFilterChange: (name: keyof PlanningFilters) => (value: number | string | '') => void;
  options: {
    status: Array<{ value: string | number; label: string }>;
    class: SearchSelectOption[];
    teacher: SearchSelectOption[];
    room: SearchSelectOption[];
    specialization: SearchSelectOption[];
    sessionType: SearchSelectOption[];
    course: SearchSelectOption[];
  };
  loading: {
    classes: boolean;
    teachers: boolean;
    rooms: boolean;
    specs: boolean;
    sessionTypes: boolean;
    courses: boolean;
  };
  error: string | null;
}


