# Endpoint Specification: `/students/:id/with-class` or `/students/:id/attestation-data`

## Purpose
This endpoint returns student data along with their current class information (including specialization, level, and school year) needed for generating student attestations.

## Endpoint Details

### Route
```
GET /students/:id/with-class
```
OR
```
GET /students/:id/attestation-data
```

### Authentication
- Requires JWT authentication
- Company ID is automatically extracted from JWT token

### Response Structure

```typescript
{
  student: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    birthday?: string; // YYYY-MM-DD format
    // ... other student fields (optional)
  };
  class: {
    id: number;
    title: string;
    specialization: {
      id: number;
      title: string;
    } | null;
    level: {
      id: number;
      title: string;
    } | null;
    schoolYear: {
      id: number;
      title: string;
    } | null;
    // ... other class fields (optional)
  } | null; // null if student has no active class
}
```

### Response Example

```json
{
  "student": {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "birthday": "2000-06-11"
  },
  "class": {
    "id": 5,
    "title": "Class A - 2024",
    "specialization": {
      "id": 2,
      "title": "Computer Science"
    },
    "level": {
      "id": 3,
      "title": "Level 1"
    },
    "schoolYear": {
      "id": 1,
      "title": "2024-2025"
    }
  }
}
```

### Response Example (No Class)

```json
{
  "student": {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "birthday": "2000-06-11"
  },
  "class": null
}
```

## Business Logic Requirements

1. **Student Selection**:
   - Return the student with the given ID
   - Verify the student belongs to the company from the JWT token

2. **Class Selection**:
   - Get the student's **active class** (status !== -2, not deleted)
   - If multiple active classes exist, return the **most recent** or **primary** one
   - Priority: Get the class with the highest `tri` value, or most recent `created_at`
   - Include full class details with nested relations:
     - `specialization` (with `id` and `title`)
     - `level` (with `id` and `title`)
     - `schoolYear` (with `id` and `title`)

3. **Relations to Include**:
   - Class → Specialization (id, title)
   - Class → Level (id, title)
   - Class → SchoolYear (id, title)

4. **Error Handling**:
   - 404 if student not found
   - 403 if student doesn't belong to the company
   - 200 with `class: null` if student has no active class

## Database Query Requirements

The endpoint should:
1. Fetch student by ID (filtered by company_id from JWT)
2. Join with `class_student` table to get student's class assignments
3. Filter for active classes (status !== -2)
4. Join with `classes` table
5. Join with `specializations` table (via `classes.specialization_id`)
6. Join with `levels` table (via `classes.level_id`)
7. Join with `school_years` table (via `classes.school_year_id`)
8. Select the most relevant class (highest `tri` or most recent)

## Frontend Usage

The frontend will use this data to format:
```
firstName# John
lastname# Doe
fullname# John Doe
datebirth# 2000/06/11
classe# Class A - 2024
specialization# Computer Science
level # Level 1
YearGraduation# 2024-2025
```

## Notes

- The endpoint should be efficient (single query with joins preferred)
- All nested relations should be loaded in one request
- If a student has no class, return `class: null` (not an error)
- The `birthday` field should be in `YYYY-MM-DD` format

