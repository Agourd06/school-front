# Planning List: Date Range Filter (Backend Contract)

## Purpose

The **Academic Planning** page (global planning) displays sessions for a specific week (Monday–Sunday). To avoid empty grids and to handle data efficiently, the frontend asks the backend for **only the plannings that fall within that date range**. This document describes the contract so the backend can implement the filter and both sides stay aligned.

## Benefits

- **Correct data**: The displayed week always shows the sessions that exist for that range (no "empty planning" when sessions exist on later pages).
- **Better performance**: Only the requested week's data is returned instead of the first N records.
- **Predictable behavior**: Same week range always returns the same filtered set.

---

## Endpoint

```
GET /students-plannings
```

(Existing endpoint; query parameters below extend the current contract.)

---

## Query Parameters (Date Range)

The frontend sends these query parameters when loading the global planning week/month view:

| Parameter       | Type   | Required | Description |
|----------------|--------|----------|-------------|
| `date_day_from` | string | No*      | Start of range (inclusive). Format: `YYYY-MM-DD`. |
| `date_day_to`   | string | No*      | End of range (inclusive). Format: `YYYY-MM-DD`. |

\* When the Academic Planning page loads a week, it **always** sends both `date_day_from` and `date_day_to`. If the backend does not support them yet, it should ignore them and keep current behavior (no date filter).

### When the frontend sends them

- **Week view**: On load and when changing week (Prev/Next or date picker).
  - `date_day_from` = Monday of the displayed week (e.g. `2026-01-26`).
  - `date_day_to` = Sunday of the displayed week (e.g. `2026-02-01`).
- **Month view**: The frontend can send the first and last day of the displayed month in the same way (same parameter names, same format).

### Backend behavior (requested)

- If **both** `date_day_from` and `date_day_to` are present:
  - Filter results so that `date_day >= date_day_from` **and** `date_day <= date_day_to`.
  - `date_day` is the planning's date field (same format `YYYY-MM-DD`).
- If only one of them is sent, the backend can either ignore the date filter or apply a single-bound filter (e.g. only "from" or only "to"), as agreed.
- If neither is sent, do **not** apply any date filter (current behavior).

### Example request

```
GET /students-plannings?page=1&limit=50&order=ASC&date_day_from=2026-01-26&date_day_to=2026-02-01
```

Optional filters (unchanged) can still be sent: `class_id`, `teacher_id`, `status`, `school_year_id`, `course_id`, etc.

---

## Response

Unchanged: same paginated list of planning entries. Only the **set of rows** should be restricted to those whose `date_day` is in `[date_day_from, date_day_to]` when both parameters are provided.

---

## Frontend usage

- **API client**: `src/api/planningStudent.ts` — `GetPlanningStudentParams` includes `date_day_from` and `date_day_to`; `buildQueryString` appends them when set.
- **Consumer**: `src/components/sections/PlanningSection.tsx` — Builds the current week (Monday–Sunday), sets `date_day_from` and `date_day_to` in the request, and refetches when the user changes the week.

---

## Summary for backend

1. **Accept** optional query params: `date_day_from`, `date_day_to` (strings, `YYYY-MM-DD`).
2. **When both are present**: filter `students-plannings` so that `date_day` is between `date_day_from` and `date_day_to` (inclusive).
3. **When one or both are missing**: do not apply a date filter (keep existing behavior).
4. **Response format**: unchanged; same pagination and list structure.

**Impact on other callers:** Only the global Academic Planning page (`PlanningSection`) sends `date_day_from` and `date_day_to`. All other schedule/planning callers (StudentPresenceSection, ClassCoursePlanningModal, TeacherDashboardPage, TeacherPlanningsPage, StudentSchedulePage, etc.) do **not** pass these params, so they are unaffected and keep getting the same data as before.

This gives the frontend a reliable way to request "only the plannings for this week (or month)" and avoids the empty-planning issue when data exists but was previously on another page.

---

## Backend implementation (NestJS)

**Status:** Implemented. The following matches the contract above.

### 1. Query DTO (`src/students-plannings/dto/students-planning-query.dto.ts`)

- `date_day_from` (optional): string, `YYYY-MM-DD`, validated with `@Matches(/^\d{4}-\d{2}-\d{2}$/)`.
- `date_day_to` (optional): string, `YYYY-MM-DD`, same validation.
- Both documented in Swagger.

### 2. Service (`src/students-plannings/students-plannings.service.ts`)

In `findAll`, only when **both** `date_day_from` and `date_day_to` are present:

- `plan.date_day >= :date_day_from`
- `plan.date_day <= :date_day_to`

If one or both are missing, no date filter is applied (existing behavior unchanged).

`date_day` is stored as `YYYY-MM-DD`, so string comparison in SQL gives correct inclusive range filtering.

### 3. Contract

- **Endpoint:** `GET /students-plannings` (unchanged).
- **Example:** `GET /students-plannings?page=1&limit=50&order=ASC&date_day_from=2026-01-26&date_day_to=2026-02-01`
- **Response:** Unchanged; same paginated list, filtered by date when both params are sent.
- **Other callers:** Unaffected; they do not send these params, so they get the same data as before.
