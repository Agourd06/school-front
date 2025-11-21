import React, { useEffect, useMemo, useState } from 'react';
import BaseModal from './BaseModal';
import { useCreateStudentAttestation, useUpdateStudentAttestation } from '../../hooks/useStudentAttestations';
import { useStudents } from '../../hooks/useStudents';
import { useAttestations } from '../../hooks/useAttestations';
// import { useCompanies } from '../../hooks/useCompanies'; // Removed - company is auto-set from authenticated user
import { STATUS_OPTIONS_FORM } from '../../constants/status';
import { Input, Select, Button } from '../ui';
// import { useCompanyId } from '../../hooks/useCompanyId'; // Removed - company is auto-set from authenticated user
import type { StudentAttestation } from '../../api/studentAttestation';

interface StudentAttestationModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentAttestation?: StudentAttestation | null;
}

const StudentAttestationModal: React.FC<StudentAttestationModalProps> = ({ isOpen, onClose, studentAttestation }) => {
  // companyid is automatically set by the API from authenticated user
  const [form, setForm] = useState({
    Idstudent: '' as number | string | '',
    Idattestation: '' as number | string | '',
    dateask: '',
    datedelivery: '',
    Status: 1,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  const createMutation = useCreateStudentAttestation();
  const updateMutation = useUpdateStudentAttestation();
  const { data: studentsResp } = useStudents({ page: 1, limit: 100 } as any);
  const { data: attestationsResp } = useAttestations({ page: 1, limit: 100 } as any);
  // const { data: companiesResp } = useCompanies({ page: 1, limit: 100 } as any); // Removed - company is auto-set from authenticated user

  const students = useMemo(() => ((studentsResp as any)?.data || []), [studentsResp]);
  const attestations = useMemo(() => ((attestationsResp as any)?.data || []), [attestationsResp]);
  // const companies removed - company is auto-set from authenticated user

  const isEditing = !!studentAttestation;

  useEffect(() => {
    if (studentAttestation) {
      setForm({
        Idstudent: studentAttestation.Idstudent ?? studentAttestation.student?.id ?? '',
        Idattestation: studentAttestation.Idattestation ?? studentAttestation.attestation?.id ?? '',
        dateask: studentAttestation.dateask || '',
        datedelivery: studentAttestation.datedelivery || '',
        Status: typeof studentAttestation.Status === 'number' ? studentAttestation.Status : 1,
      });
    } else {
      setForm({ 
        Idstudent: '', 
        Idattestation: '', 
        dateask: '', 
        datedelivery: '', 
        Status: 1,
      });
    }
    setErrors({});
    setFormError('');
  }, [studentAttestation, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    const newValue = name === 'Status' || name === 'Idstudent' || name === 'Idattestation'
      ? (value ? Number(value) : '') 
      : value;

    setForm(prev => {
      const updatedForm = { ...prev, [name]: newValue };
      
      // Validate date relationship when dates change
      if (name === 'dateask' || name === 'datedelivery') {
        const dateask = name === 'dateask' ? value : updatedForm.dateask;
        const datedelivery = name === 'datedelivery' ? value : updatedForm.datedelivery;
        
        if (dateask && datedelivery) {
          const askDate = new Date(dateask);
          const deliveryDate = new Date(datedelivery);
          
          if (askDate >= deliveryDate) {
            setErrors(prevErrors => ({ 
              ...prevErrors, 
              datedelivery: 'Date Delivery must be after Date Asked'
            }));
          } else {
            setErrors(prevErrors => {
              const next = { ...prevErrors };
              delete next.datedelivery;
              return next;
            });
          }
        } else {
          // Clear date error if one of the dates is cleared
          setErrors(prevErrors => {
            const next = { ...prevErrors };
            delete next.datedelivery;
            return next;
          });
        }
      }
      
      return updatedForm;
    });
    
    // Clear errors for this field (except date validation which is handled above)
    if (errors[name] && name !== 'datedelivery') {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.Idstudent) next.Idstudent = 'Student is required';
    if (!form.Idattestation) next.Idattestation = 'Attestation is required';
    // companyid is automatically set by the API from authenticated user
    
    // Validate date relationship
    if (form.dateask && form.datedelivery) {
      const askDate = new Date(form.dateask);
      const deliveryDate = new Date(form.datedelivery);
      
      if (askDate >= deliveryDate) {
        next.datedelivery = 'Date Delivery must be after Date Asked';
      }
    }
    
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      Idstudent: Number(form.Idstudent),
      Idattestation: Number(form.Idattestation),
      dateask: form.dateask || undefined,
      datedelivery: form.datedelivery || undefined,
      Status: form.Status,
      // companyid is automatically set by the API from authenticated user
    };
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: studentAttestation.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message;
      if (Array.isArray(errorMessage)) {
        setFormError(errorMessage.join(', '));
      } else if (typeof errorMessage === 'string') {
        setFormError(errorMessage);
      } else {
        setFormError(err?.message || 'Failed to save student attestation');
      }
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Student Attestation' : 'Add Student Attestation'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && <p className="text-sm text-red-600">{formError}</p>}
        
        <Select
          label="Student *"
          name="Idstudent"
          value={form.Idstudent}
          onChange={handleChange}
          options={[
            { value: '', label: 'Select a student' },
            ...(students.map((s: any) => ({
              value: s.id,
              label: `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim() || s.email || `Student #${s.id}`,
            })))
          ]}
          error={errors.Idstudent}
          className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />

        <Select
          label="Attestation *"
          name="Idattestation"
          value={form.Idattestation}
          onChange={handleChange}
          options={[
            { value: '', label: 'Select an attestation' },
            ...(attestations.map((a: any) => ({
              value: a.id,
              label: a.title,
            })))
          ]}
          error={errors.Idattestation}
          className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Date Asked"
            type="date"
            name="dateask"
            value={form.dateask}
            onChange={handleChange}
            max={form.datedelivery || undefined}
            className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />

          <Input
            label="Date Delivery"
            type="date"
            name="datedelivery"
            value={form.datedelivery}
            onChange={handleChange}
            min={form.dateask || undefined}
            error={errors.datedelivery}
            className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <Select
          label="Status"
          name="Status"
          value={form.Status}
          onChange={handleChange}
          options={STATUS_OPTIONS_FORM.map(opt => ({
            value: opt.value,
            label: opt.label,
          }))}
          className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">{isEditing ? 'Update' : 'Create'}</Button>
        </div>
      </form>
    </BaseModal>
  );
};

export default StudentAttestationModal;

