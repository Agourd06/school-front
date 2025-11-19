import React from 'react';
import SearchSelect from '../../inputs/SearchSelect';
import type { PlanningFiltersBarProps } from '../types';

const PlanningFiltersBar: React.FC<PlanningFiltersBarProps> = ({ filters, onFilterChange, options, loading, error }) => (
  <>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
      <SearchSelect
        label="Status"
        value={filters.status}
        onChange={(value) => onFilterChange('status')(value === 'all' ? '' : value)}
        options={options.status}
        placeholder="All statuses"
        isClearable={false}
      />
      <SearchSelect
        label="Class"
        value={filters.class_id}
        onChange={onFilterChange('class_id')}
        options={options.class}
        placeholder="All classes"
        isClearable
        isLoading={loading.classes}
      />
      <SearchSelect
        label="Teacher"
        value={filters.teacher_id}
        onChange={onFilterChange('teacher_id')}
        options={options.teacher}
        placeholder="All teachers"
        isClearable
        isLoading={loading.teachers}
      />
      <SearchSelect
        label="Classroom"
        value={filters.class_room_id}
        onChange={onFilterChange('class_room_id')}
        options={options.room}
        placeholder="All rooms"
        isClearable
        isLoading={loading.rooms}
      />
      <SearchSelect
        label="Specialization"
        value={filters.specialization_id}
        onChange={onFilterChange('specialization_id')}
        options={options.specialization}
        placeholder="All specializations"
        isClearable
        isLoading={loading.specs}
      />
      <SearchSelect
        label="Session Type"
        value={filters.planning_session_type_id}
        onChange={onFilterChange('planning_session_type_id')}
        options={options.sessionType}
        placeholder="All session types"
        isClearable
        isLoading={loading.sessionTypes}
      />
      <SearchSelect
        label="Course"
        value={filters.course_id}
        onChange={onFilterChange('course_id')}
        options={options.course}
        placeholder="All courses"
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

export default PlanningFiltersBar;


