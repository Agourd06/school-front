import React from 'react';
import BaseModal from './BaseModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  item: any;
}

const apiBase = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

const DetailRow: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <div className="flex text-sm"><span className="w-32 text-gray-500">{label}</span><span className="text-gray-900">{value || '—'}</span></div>
);

const StudentDiplomeDetailsModal: React.FC<Props> = ({ isOpen, onClose, item }) => {
  if (!item) return null;
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Diplome Details">
      <div className="space-y-4">
        <div>
          <h4 className="text-lg font-semibold text-gray-900">{item.title} — {item.school}</h4>
          <div className="mt-2 space-y-1">
            <DetailRow label="Year" value={item.annee || ''} />
            <DetailRow label="Student ID" value={item.student_id} />
            <DetailRow label="Diplome" value={item.diplome || ''} />
            <DetailRow label="Location" value={<>{item.city || ''}{item.country ? `, ${item.country}` : ''}</>} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {item.diplome_picture_1 && (
            <img src={`${apiBase}${item.diplome_picture_1}`} alt="diplome 1" className="w-full max-h-[70vh] object-contain border rounded" />
          )}
          {item.diplome_picture_2 && (
            <img src={`${apiBase}${item.diplome_picture_2}`} alt="diplome 2" className="w-full max-h-[70vh] object-contain border rounded" />
          )}
          {!item.diplome_picture_1 && !item.diplome_picture_2 && (
            <div className="text-sm text-gray-500">No images uploaded.</div>
          )}
        </div>
      </div>
    </BaseModal>
  );
};

export default StudentDiplomeDetailsModal;


