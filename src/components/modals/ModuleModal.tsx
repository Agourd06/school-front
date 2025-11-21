import React, { useState, useEffect } from "react";
import { useCreateModule, useUpdateModule } from "../../hooks/useModules";
import BaseModal from "./BaseModal";
import RichTextEditor from "../inputs/RichTextEditor";
import { STATUS_OPTIONS_FORM } from "../../constants/status";
import { Input, Select, Button } from "../ui";

interface Module {
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

interface ModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  module?: Module | null;
}

const ModuleModal: React.FC<ModuleModalProps> = ({
  isOpen,
  onClose,
  module,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    volume: "",
    coefficient: "",
    status: 1,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createModule = useCreateModule();
  const updateModule = useUpdateModule();

  const isEditing = !!module;

  useEffect(() => {
    if (module) {
      console.log("ModuleModal: Received module data:", module);
      setFormData({
        title: module.title || "",
        description: module.description || "",
        volume: module.volume ? module.volume.toString() : "",
        coefficient: module.coefficient ? module.coefficient.toString() : "",
        status: module.status || 1,
      });
    } else {
      setFormData({
        title: "",
        description: "",
        volume: "",
        coefficient: "",
        status: 1,
      });
    }
    setErrors({});
  }, [module, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Module title is required";
    }

    if (
      formData.volume &&
      (isNaN(Number(formData.volume)) || Number(formData.volume) < 0)
    ) {
      newErrors.volume = "Volume must be a positive number";
    }

    if (
      formData.coefficient &&
      (isNaN(Number(formData.coefficient)) || Number(formData.coefficient) < 0)
    ) {
      newErrors.coefficient = "Coefficient must be a positive number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      // Save HTML as-is so it can be displayed with formatting
      const descriptionToSave = formData.description.trim() || undefined;

      if (isEditing) {
        await updateModule.mutateAsync({
          id: module.id,
          title: formData.title,
          description: descriptionToSave,
          volume: formData.volume ? Number(formData.volume) : undefined,
          coefficient: formData.coefficient
            ? Number(formData.coefficient)
            : undefined,
          status: formData.status,
        });
      } else {
        await createModule.mutateAsync({
          title: formData.title,
          description: descriptionToSave,
          volume: formData.volume ? Number(formData.volume) : undefined,
          coefficient: formData.coefficient
            ? Number(formData.coefficient)
            : undefined,
          status: formData.status,
        });
      }

      onClose();
    } catch (error) {
      console.error("Module operation failed:", error);
      alert("Operation failed. Please try again.");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "status" || name === "volume" || name === "confusion"
          ? Number(value)
          : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Module" : "Add Module"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Module Title"
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          error={errors.title}
          className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />

        <Input
          label="Volume (optional)"
          type="number"
          name="volume"
          value={formData.volume}
          onChange={handleChange}
          error={errors.volume}
          disabled
          className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />

        <Input
          label="Coefficient (optional)"
          type="text"
          name="coefficient"
          value={formData.coefficient}
          onChange={handleChange}
          error={errors.coefficient}
          className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />

        <Select
          label="Status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          options={STATUS_OPTIONS_FORM.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
          className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Description
          </label>
          <RichTextEditor
            value={formData.description}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, description: value }))
            }
            placeholder="Enter module description..."
            rows={8}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={createModule.isPending || updateModule.isPending}
            disabled={createModule.isPending || updateModule.isPending}
          >
            {isEditing ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};

export default ModuleModal;
