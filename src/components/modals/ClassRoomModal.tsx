import React, { useEffect, useState } from "react";
import BaseModal from "./BaseModal";
import {
  useCreateClassRoom,
  useUpdateClassRoom,
} from "../../hooks/useClassRooms";
import { validateRequired, validatePositiveNumber } from "./validations";
import { STATUS_OPTIONS_FORM } from "../../constants/status";
import { Input, Select, Button } from "../ui";

interface ClassRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  classRoom?: any | null;
}

const ClassRoomModal: React.FC<ClassRoomModalProps> = ({
  isOpen,
  onClose,
  classRoom,
}) => {
  const [form, setForm] = useState({
    code: "",
    title: "",
    capacity: "",
    status: 1 as number,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateClassRoom();
  const updateMutation = useUpdateClassRoom();

  const isEditing = !!classRoom;

  useEffect(() => {
    if (classRoom) {
      setForm({
        code: classRoom.code || "",
        title: classRoom.title || "",
        capacity: classRoom.capacity != null ? String(classRoom.capacity) : "",
        status: typeof classRoom.status === "number" ? classRoom.status : 1,
      });
    } else {
      setForm({ code: "", title: "", capacity: "", status: 1 });
    }
    setErrors({});
  }, [classRoom, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "status" ? Number(value) : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const codeErr = validateRequired(form.code, "Code");
    if (codeErr) newErrors.code = codeErr;
    const titleErr = validateRequired(form.title, "Title");
    if (titleErr) newErrors.title = titleErr;
    const capErr = validatePositiveNumber(form.capacity, "Capacity");
    if (capErr) newErrors.capacity = capErr;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const payload: any = {
      code: form.code,
      title: form.title,
      capacity: Number(form.capacity || 0),
      // company_id is automatically set by the API from authenticated user
      status: Number(form.status),
    };

    if (isEditing && classRoom?.id) {
      await updateMutation.mutateAsync({ id: classRoom.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Classroom" : "Add Classroom"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Code"
          name="code"
          value={form.code}
          onChange={handleChange}
          error={errors.code}
          className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />

        <Input
          label="Title"
          name="title"
          value={form.title}
          onChange={handleChange}
          error={errors.title}
          className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />

        <Input
          label="Capacity"
          type="number"
          name="capacity"
          value={form.capacity}
          onChange={handleChange}
          error={errors.capacity}
          className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
        <Select
          label="Status"
          name="status"
          value={form.status}
          onChange={handleChange}
          options={STATUS_OPTIONS_FORM.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
          className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {isEditing ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};

export default ClassRoomModal;
