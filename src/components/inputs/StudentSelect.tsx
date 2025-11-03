import React from 'react';
import Select from 'react-select';
import { useStudents } from '../../hooks/useStudents';

interface StudentSelectProps {
  label?: string;
  value: number | string | '';
  onChange: (value: number | '') => void;
  placeholder?: string;
  disabled?: boolean;
}

const StudentSelect: React.FC<StudentSelectProps> = ({ label = 'Student', value, onChange, placeholder = 'Search students...', disabled }) => {
  const [query, setQuery] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);

  // Server-side fetch with query as you type
  const { data: resp, isLoading, error } = useStudents({ page: 1, limit: 50, search: query || undefined } as any);
  const all = (resp as any)?.data || [];

  const options = React.useMemo(() => {
    return all.map((s: any) => ({ value: s.id, label: `${s.first_name} ${s.last_name}` }));
  }, [all]);

  const selected = React.useMemo(() => all.find((s: any) => String(s.id) === String(value)), [all, value]);

  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <div className="mt-1">
        <Select
          isClearable
          isDisabled={disabled}
          isLoading={isLoading}
          options={options}
          onMenuOpen={() => setIsOpen(true)}
          onMenuClose={() => setIsOpen(false)}
          onInputChange={(val) => setQuery(val)}
          placeholder={placeholder}
          value={selected ? { value: selected.id, label: `${selected.first_name} ${selected.last_name} ` } : null}
          onChange={(opt: any) => onChange(opt ? Number(opt.value) : '')}
          styles={{
            menu: (base) => ({ ...base, zIndex: 50 }),
          }}
        />
        {error && (<div className="mt-1 text-sm text-red-600">Failed to load students</div>)}
      </div>
    </div>
  );
};

export default StudentSelect;


