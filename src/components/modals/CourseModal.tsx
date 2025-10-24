import React, { useState, useEffect } from 'react';
import { useCreateCourse, useUpdateCourse } from '../../hooks/useCourses';
import BaseModal from './BaseModal';
import RichTextEditor from '../RichTextEditor';

interface Course {
  id: number;
  title: string;
  description?: string;
  volume?: number;
  coefficient?: number;
  status: number;
  company_id?: number;
  created_at?: string;
  updated_at?: string;
}

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  course?: Course | null;
}

const CourseModal: React.FC<CourseModalProps> = ({ isOpen, onClose, course }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    volume: '',
    coefficient: '',
    status: 1
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();

  const isEditing = !!course;

  useEffect(() => {
    if (course) {
      console.log('CourseModal: Received course data:', course);
      setFormData({
        title: course.title || '',
        description: course.description || '',
        volume: course.volume ? course.volume.toString() : '',
        coefficient: course.coefficient ? course.coefficient.toString() : '',
        status: course.status || 1
      });
    } else {
      setFormData({
        title: '',
        description: '',
        volume: '',
        coefficient: '',
        status: 1
      });
    }
    setErrors({});
  }, [course, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Course title is required';
    }

    if (formData.volume && (isNaN(Number(formData.volume)) || Number(formData.volume) < 0)) {
      newErrors.volume = 'Volume must be a positive number';
    }

    if (formData.coefficient && (isNaN(Number(formData.coefficient)) || Number(formData.coefficient) < 0)) {
      newErrors.coefficient = 'Coefficient must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      console.log('Submitting course form:', { isEditing, formData });
      
      if (isEditing) {
        console.log('Updating course with data:', formData);
        await updateCourse.mutateAsync({
          id: course.id,
          title: formData.title,
          description: formData.description || undefined,
          volume: formData.volume ? Number(formData.volume) : undefined,
          coefficient: formData.coefficient ? Number(formData.coefficient) : undefined,
          status: formData.status
        });
        console.log('Course updated successfully');
      } else {
        console.log('Creating course with data:', formData);
        await createCourse.mutateAsync({
          title: formData.title,
          description: formData.description || undefined,
          volume: formData.volume ? Number(formData.volume) : undefined,
          coefficient: formData.coefficient ? Number(formData.coefficient) : undefined,
          status: formData.status
        });
        console.log('Course created successfully');
      }
      
      onClose();
    } catch (error) {
      console.error('Course operation failed:', error);
      alert('Operation failed. Please try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]:
        name === 'status' || name === 'volume' || name === 'confusion'
          ? Number(value)
          : value,
    }));
        
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Course' : 'Add Course'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Course Title
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
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <RichTextEditor
            value={formData.description}
            onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
            placeholder="Enter course description..."
            rows={8}
          />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
        </div>

        <div>
          <label htmlFor="volume" className="block text-sm font-medium text-gray-700">
            Volume (optional)
          </label>
          <input
            type="number"
            id="volume"
            name="volume"
            value={formData.volume}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
              errors.volume ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.volume && <p className="mt-1 text-sm text-red-600">{errors.volume}</p>}
        </div>

        <div>
          <label htmlFor="coefficient" className="block text-sm font-medium text-gray-700">
            Coefficient (optional)
          </label>
          <input
            type="number"
            step="0.1"
            id="coefficient"
            name="coefficient"
            value={formData.coefficient}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
              errors.coefficient ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.coefficient && <p className="mt-1 text-sm text-red-600">{errors.coefficient}</p>}
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
            disabled={createCourse.isPending || updateCourse.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {createCourse.isPending || updateCourse.isPending ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
          </button>
        </div>
      </form>
    </BaseModal>
  );
};

export default CourseModal;
