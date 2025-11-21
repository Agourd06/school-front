# UI Components Usage Examples

This document shows how to use the reusable UI components in forms and modals.

## Components Available

- `Input` - Text, email, date, number inputs
- `Select` - Dropdown selects
- `FileInput` - File upload with optional preview
- `Button` - Buttons with variants (primary, secondary, danger, ghost)
- `Textarea` - Multi-line text input
- `FormField` - Wrapper for consistent form field layout

## Examples

### Input Component

```tsx
import { Input } from '../../ui';

// Basic input
<Input
  label="First name"
  value={form.firstname}
  onChange={(e) => onFormChange('firstname', e.target.value)}
  error={errors.firstname}
/>

// Email input
<Input
  label="Email"
  type="email"
  value={form.email}
  onChange={(e) => onFormChange('email', e.target.value)}
  error={errors.email}
/>

// Date input
<Input
  label="Birthday"
  type="date"
  value={form.birthday}
  onChange={(e) => onFormChange('birthday', e.target.value)}
/>

// Disabled input
<Input
  label="Student"
  value={studentName}
  disabled
/>
```

### Select Component

```tsx
import { Select } from '../../ui';

// Basic select
<Select
  label="Status"
  value={form.status}
  onChange={(e) => onFormChange('status', Number(e.target.value))}
  options={STATUS_OPTIONS_FORM.map(opt => ({
    value: opt.value,
    label: opt.label
  }))}
/>

// Select with placeholder
<Select
  label="Link type"
  value={form.studentlinktypeId}
  onChange={(e) => onFormChange('studentlinktypeId', e.target.value ? Number(e.target.value) : '')}
  placeholder="Select link type"
  options={(linkTypesData?.data || []).map((lt: any) => ({
    value: lt.id,
    label: lt.title
  }))}
/>
```

### FileInput Component

```tsx
import { FileInput } from '../../ui';

// Basic file input
<FileInput
  label="Upload picture"
  accept="image/*"
  onChange={(file) => setPictureFile(file)}
  helperText="JPG, PNG, GIF, WEBP up to 2MB"
  error={errors.picture}
/>

// File input with preview
<FileInput
  label="Diplome picture"
  accept="image/*"
  onChange={(file) => setDiplomeFile1(file)}
  currentFileUrl={currentDiplomePicture1}
  preview
/>
```

### Button Component

```tsx
import { Button } from '../../ui';

// Primary button (default)
<Button
  type="submit"
  isLoading={isSubmitting}
  disabled={isSubmitting}
>
  {hasContact ? 'Update & Continue' : 'Save & Continue'}
</Button>

// Secondary button
<Button
  type="button"
  variant="secondary"
  onClick={onBack}
>
  Back
</Button>

// Danger button
<Button
  type="button"
  variant="danger"
  onClick={handleDelete}
>
  Delete
</Button>

// Ghost button
<Button
  type="button"
  variant="ghost"
  onClick={onSkip}
>
  Skip
</Button>
```

### Textarea Component

```tsx
import { Textarea } from '../../ui';

<Textarea
  label="Description"
  value={form.description}
  onChange={(e) => onFormChange('description', e.target.value)}
  error={errors.description}
  rows={4}
/>
```

### FormField Component (Optional Wrapper)

```tsx
import { FormField, Input } from '../../ui';

<FormField
  label="First name"
  error={errors.firstname}
  required
>
  <Input
    value={form.firstname}
    onChange={(e) => onFormChange('firstname', e.target.value)}
  />
</FormField>
```

## Complete Form Example

```tsx
import { Input, Select, Button } from '../../ui';

<form onSubmit={onSubmit} className="space-y-4">
  {errors.form && <p className="text-sm text-red-600">{errors.form}</p>}
  
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <Input
      label="First name"
      value={form.firstname}
      onChange={(e) => onFormChange('firstname', e.target.value)}
      error={errors.firstname}
    />
    <Input
      label="Last name"
      value={form.lastname}
      onChange={(e) => onFormChange('lastname', e.target.value)}
      error={errors.lastname}
    />
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <Input
      label="Email"
      type="email"
      value={form.email}
      onChange={(e) => onFormChange('email', e.target.value)}
      error={errors.email}
    />
    <Select
      label="Status"
      value={form.status}
      onChange={(e) => onFormChange('status', Number(e.target.value))}
      options={statusOptions}
    />
  </div>

  <div className="flex justify-between space-x-3 pt-4">
    <Button
      type="button"
      variant="secondary"
      onClick={onBack}
    >
      Back
    </Button>
    <Button
      type="submit"
      isLoading={isSubmitting}
    >
      Save
    </Button>
  </div>
</form>
```

## Benefits

1. **Consistent Styling** - All inputs, selects, and buttons have the same look and feel
2. **Error Handling** - Built-in error display with consistent styling
3. **Accessibility** - Proper labels, IDs, and ARIA attributes
4. **Type Safety** - Full TypeScript support
5. **Less Code** - No need to repeat className strings
6. **Easy Maintenance** - Update styles in one place

