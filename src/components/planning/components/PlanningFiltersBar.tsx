import React from 'react';
import { useTranslation } from 'react-i18next';
import SearchSelect from '../../inputs/SearchSelect';
import type { PlanningFiltersBarProps } from '../types';

const PlanningFiltersBar: React.FC<PlanningFiltersBarProps> = ({ filters, onFilterChange, options, loading, error }) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <SearchSelect
          label={t('common.status')}
          value={filters.status}
          onChange={(value) => onFilterChange('status')(value === 'all' ? '' : value)}
          options={options.status}
          placeholder={t('sections.allStatuses')}
          isClearable={false}
        />
        <SearchSelect
          label={t('sidebar.classes')}
          value={filters.class_id}
          onChange={onFilterChange('class_id')}
          options={options.class}
          placeholder={t('sections.allClasses')}
          isClearable
          isLoading={loading.classes}
        />
        <SearchSelect
          label={t('sidebar.teachers')}
          value={filters.teacher_id}
          onChange={onFilterChange('teacher_id')}
          options={options.teacher}
          placeholder={t('sections.allTeachers')}
          isClearable
          isLoading={loading.teachers}
        />
        <SearchSelect
          label={t('sidebar.classRooms')}
          value={filters.class_room_id}
          onChange={onFilterChange('class_room_id')}
          options={options.room}
          placeholder={t('sections.allRooms')}
          isClearable
          isLoading={loading.rooms}
        />
        <SearchSelect
          label={t('sections.sessionType')}
          value={filters.planning_session_type_id}
          onChange={onFilterChange('planning_session_type_id')}
          options={options.sessionType}
          placeholder={t('sections.allSessionTypes')}
          isClearable
          isLoading={loading.sessionTypes}
        />
        <SearchSelect
          label={t('sidebar.courses')}
          value={filters.course_id}
          onChange={onFilterChange('course_id')}
          options={options.course}
          placeholder={t('sections.allCourses')}
          isClearable
          isLoading={loading.courses}
        />
      </div>
      {error && (
        <div className="mt-4 px-3 py-2 bg-red-50 border border-red-200 text-sm text-red-700 rounded-md">
          {error}
        </div>
      )}
    </>
  );
};

export default PlanningFiltersBar;


