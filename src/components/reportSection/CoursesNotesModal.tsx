import React from 'react';
import BaseModal from '../modals/BaseModal';
import type { CoursePresenceRow } from './Report';
import type { SortKey } from './types';
import CoursesTable from './columns/CoursesColumn';

interface CoursesNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  rows: CoursePresenceRow[];
  sortConfig: { key: SortKey; direction: 'asc' | 'desc' };
  onSort: (key: SortKey) => void;
}

const CoursesNotesModal: React.FC<CoursesNotesModalProps> = ({ isOpen, onClose, title, rows, sortConfig, onSort }) => (
  <BaseModal
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    className="sm:max-w-5xl"
    contentClassName="space-y-4"
  >
    <p className="text-sm text-gray-500">Courses & notes recorded from presences for the selected context.</p>
    <div className="max-h-[70vh] overflow-y-auto">
      <CoursesTable rows={rows} sortConfig={sortConfig} onSort={onSort} />
    </div>
  </BaseModal>
);

export default CoursesNotesModal;

