# Frontend: Planning visibility (why one teacher sees fewer sessions)

Checklist from backend and how the frontend implements it.

---

## 1. Filters sent to the API

**Backend:** GET /students-plannings applies all query params with AND. Sending `class_id` or `class_course_id` restricts results; missing sessions may be in another class/course.

**Frontend:**

- **Class course planning modal:** We send **only** `teacher_id` + `date_day_from` + `date_day_to` (no `class_id`, no `class_course_id`). So the modal shows **all sessions for the selected teacher in the displayed week**. Class is only used when creating new sessions.
- **Global planning (PlanningSection):** Uses filters from the UI (class, teacher, etc.) and `date_day_from` / `date_day_to` for the displayed week. To see “all my planning” for a teacher, avoid sending class_id in that view if the product goal is “all sessions for this teacher”.

**Check:** When comparing two teachers, the same params (e.g. `teacher_id` + date range only) are sent for both; no extra filter differs by teacher.

---

## 2. Date normalization (`date_day`)

**Backend:** If the API returns `date_day` as ISO (e.g. `2026-01-26T00:00:00.000Z`), the frontend must normalize to `YYYY-MM-DD` before comparing or putting in sets.

**Frontend:**

- **Class course planning modal:** We use `normalizeDateDay(entry.date_day)`:
  - When building `weekSchedules` (filter by week).
  - When building `days` in grouped schedules.
  - When matching “this schedule has an entry for this date” in the day column.
- Helper: `normalizeDateDay(s)` returns the first 10 characters when format is `YYYY-MM-DD...`, otherwise the string as-is.

---

## 3. Week range (`date_day_from` / `date_day_to`)

**Backend:** The request must use the same range as the displayed week so sessions at the start/end of the week are not missing.

**Frontend:**

- **Class course planning modal:** `weekRangeForApi` is derived from `currentWeekStart` and `showWeekend` (Mon–Fri or Mon–Sun). We send `date_day_from` and `date_day_to` from that range.
- **PlanningSection:** Sends `date_day_from` / `date_day_to` for the displayed week.

---

## 4. No extra client-side filter by teacher

**Backend:** After the response, the frontend must not filter again by teacher (or by class) so that rows are not dropped on the client.

**Frontend:**

- We use the API `data` list as-is: `allSchedules = [...createdSchedules, ...(existingSchedulesResp?.data || [])]`. We only filter by **date** (normalized) to keep sessions in the displayed week. We do **not** filter by teacher or class on the client.

---

## 5. Quick verification

1. **Network:** For “Oualid dest” (and for “Oualid Agourd”), check the request:  
   `GET /students-plannings?teacher_id=…&date_day_from=…&date_day_to=…`  
   and confirm `class_id` / `class_course_id` are **not** sent for the class course modal schedule fetch.
2. **Response:** Check `data` length. If the API returns only 1 session, the issue is filters (1) or date range (3). If the API returns more but the UI shows fewer, the issue is date normalization (2) or client-side filtering (4).

---

## Summary

- **Modal:** Fetch with **teacher_id + date range only** so both teachers see all their sessions in the week.
- **Dates:** Use **normalizeDateDay** everywhere we filter or group by date.
- **Week:** Align **date_day_from** / **date_day_to** with the displayed week.
- **Client:** Do **not** filter the API result by teacher (or class); only filter by normalized date for the displayed week.
