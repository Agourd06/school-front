# Presence: Single Source of Truth (Backend)

## Problem

Teacher and controller must see **the same** presence data for the same student and same session (same course, same day). If the teacher marks a student as **absent**, the controller must see **absent**. There must be **no duplicate** presence rows per (student, session)—one record shared by both roles.

## Required Backend Behavior

### 1. One row per (student_id, student_planning_id)

- The **student_presence** (or equivalent) table must have **at most one row** per combination of `student_id` and `student_planning_id`.
- **Recommended:** Add a **unique constraint** on `(student_id, student_planning_id)` so the database rejects duplicate rows.
- Teacher and controller **must** read and update this **same** row. Do **not** create separate presence rows per role (e.g. no "teacher_presence" vs "controller_presence").

### 2. API: No role-based filtering of presence rows

- **GET /student-presence?student_planning_id={id}** must return **all** presence rows for that planning session, regardless of which role created or last updated them.
- Do **not** filter by current user role (e.g. do not return only rows “owned” by teacher when the request is from a teacher). Both teacher and controller must get the same list for the same `student_planning_id`.

### 3. Create: Avoid duplicates

- When **creating** a presence row (e.g. when a teacher marks presence for a student):
  - If a row already exists for `(student_id, student_planning_id)`, **update** that row (or return it) instead of creating a second one.
  - Use “upsert” logic: insert only when no row exists for (student_id, student_planning_id); otherwise update.

### 4. Update: Same row for both roles

- **PATCH /student-presence/:id** updates the single presence record by id. Both teacher and controller use the same `id` for the same student/session, so both are updating the same row.

## Summary

| Requirement | Backend action |
|-------------|----------------|
| Single source of truth | One row per (student_id, student_planning_id); unique constraint recommended. |
| Same data for teacher and controller | No role-based filtering on GET; same list for same student_planning_id. |
| No duplicates on create | Upsert: update existing row if (student_id, student_planning_id) exists; otherwise insert. |
| Teacher change visible to controller | Both read/write the same row; no separate “teacher” vs “controller” presence tables or rows. |

If duplicates or role-split data exist today, the fix is on the **backend**: enforce one row per (student_id, student_planning_id) and ensure the API does not filter or split by role.

---

## Backend implementation (done)

| Requirement | Implementation |
|-------------|----------------|
| One row per (student_id, student_planning_id) | **Unique constraint** `UQ_student_presence_student_planning` on `['student_id', 'student_planning_id']` on `StudentPresence` entity. DB rejects a second row for the same pair. |
| Same data for teacher and controller | **GET** presence list filters only by `company_id` and optional query params (`student_planning_id`, `student_id`, etc.). No filter by user/role. |
| No duplicates on create | **Create = upsert** in service: before creating, look up existing row by (student_id, student_planning_id) + company_id and status ≠ -2. If found: update that row with DTO fields and return it. If not found: create new row. |
| Single source of truth | **PATCH** /student-presence/:id unchanged; teacher and controller use the same id for a given student/session. |

**Migration note:** If the DB already has duplicate rows for the same (student_id, student_planning_id), adding the unique constraint will fail until duplicates are removed or merged (e.g. via a one-off migration or script).
