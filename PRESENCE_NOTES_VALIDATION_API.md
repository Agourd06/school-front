# Presence & Notes Two-Step Validation (Backend Contract)

## Purpose

Presence and Notes use a **mandatory two-step validation** process: teacher validation first, then controller validation. No data becomes final without both steps. Presence and Notes have **independent** validation states.

## Validation States

| Value | Constant | Meaning |
|-------|----------|---------|
| 0 | DRAFT | Editable by teacher. Not yet validated. |
| 1 | TEACHER_VALIDATED | Teacher has validated. Data read-only for teacher. Controller can perform final validation. |
| 2 | LOCKED | Controller has validated. Data permanently read-only. PDF is final. |

## Planning / Session Fields (students-plannings)

The backend should expose (and accept on PATCH) **two optional fields** on the planning/session resource:

| Field | Type | Description |
|-------|------|-------------|
| `presence_validation_status` | number \| null | 0=DRAFT, 1=TEACHER_VALIDATED, 2=LOCKED. Independent from notes. |
| `notes_validation_status` | number \| null | 0=DRAFT, 1=TEACHER_VALIDATED, 2=LOCKED. Independent from notes. |

- **Default:** If not sent, frontend treats as `0` (DRAFT).
- **Independence:** Locking Presence does not lock Notes, and vice versa.
- **PATCH:** When teacher validates Presence, send `presence_validation_status: 1`. When controller validates Presence, send `presence_validation_status: 2`. Same for `notes_validation_status` for Notes.

## Workflow

### Presence

1. **DRAFT:** Teacher can edit presence (mark present/absent). Teacher can click "Validate Presence" → backend sets `presence_validation_status = 1`.
2. **TEACHER_VALIDATED:** Presence data is read-only for teacher. Controller can view and click "Validate Presence (Final)" → backend sets `presence_validation_status = 2`.
3. **LOCKED:** Presence is permanently read-only. Presence PDF is final and marked "Final / Controller Validated".

### Notes

1. **DRAFT:** Teacher can edit notes (for present students). Teacher can click "Validate Notes" → backend sets `notes_validation_status = 1`.
2. **TEACHER_VALIDATED:** Notes data is read-only for teacher. Controller can view and click "Validate Notes (Final)" → backend sets `notes_validation_status = 2`.
3. **LOCKED:** Notes are permanently read-only. Notes PDF is final and marked "Final / Controller Validated".

## Roles (from JWT / profile)

- **Teacher** (`profile === 'teacher'`): Can edit when DRAFT; can perform first validation (→ TEACHER_VALIDATED). Cannot perform final validation.
- **Controller** (`profile === 'direction'` or `profile === 'admin'`): Cannot edit. Can perform final validation when status is TEACHER_VALIDATED (→ LOCKED).

## PDF Labels

- When status is **TEACHER_VALIDATED:** PDF badge/label = "Teacher Validated".
- When status is **LOCKED:** PDF badge/label = "Final / Controller Validated".
- When status is **DRAFT:** No final badge (or "Draft"); PDF can still be generated but is not final.

## Response

- **GET** `/students-plannings` (and by id): Include `presence_validation_status` and `notes_validation_status` in each planning entry when implemented.
- **PATCH** `/students-plannings/:id`: Accept `presence_validation_status` and/or `notes_validation_status` (0, 1, or 2). Backend should enforce: only teacher can set 1 from 0; only controller can set 2 from 1 (or backend may allow both and enforce by role).

## Summary for backend

1. Add optional `presence_validation_status` and `notes_validation_status` (integer 0, 1, 2) to the planning/session resource.
2. Default to 0 (DRAFT) for new or existing records without these fields.
3. Accept these fields on PATCH for validation actions.
4. Enforce rules: teacher sets 1 from 0; controller sets 2 from 1; no bypass of teacher validation.
