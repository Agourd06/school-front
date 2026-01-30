# Session Validation – New Boolean Fields (Backend Contract)

The planning/session resource uses **four boolean fields** for presence and notes validation. When **both** teacher and controller have validated (both booleans true), that module is considered **locked**. The **session can be activated** when presence is fully validated and, if the session has notes, notes are also fully validated.

---

## 1. New fields on Planning (students-plannings)

Add these fields to the **planning** (session) entity and to **GET/PATCH** responses and payloads:

| Field | Type | Description |
|-------|------|-------------|
| `presence_validated_teacher` | boolean | `true` when the teacher has validated presence (activated). Default `false`. |
| `presence_validated_controleur` | boolean | `true` when the controller has validated presence (final). Default `false`. |
| `notes_validated_teacher` | boolean | `true` when the teacher has validated notes. Default `false`. Only relevant when `has_notes === true`. |
| `notes_validated_controleur` | boolean | `true` when the controller has validated notes (final). Default `false`. Only relevant when `has_notes === true`. |

**Naming:** Use exactly these names (snake_case). Frontend sends them on PATCH.

---

## 2. Activation logic

- **Presence module is “locked”** when:
  - `presence_validated_teacher === true` **and** `presence_validated_controleur === true`
- **Notes module is “locked”** when:
  - `notes_validated_teacher === true` **and** `notes_validated_controleur === true`
- **Session is fully activated** when:
  - Presence is locked **and**
  - If `has_notes === false`: nothing else required.
  - If `has_notes === true`: notes must also be locked (`notes_validated_teacher` and `notes_validated_controleur` both `true`).

So:

```
session_fully_activated =
  presence_validated_teacher && presence_validated_controleur
  && ( !has_notes || ( notes_validated_teacher && notes_validated_controleur ) )
```

---

## 3. Who sets which field

| Action | Actor | PATCH body |
|--------|--------|------------|
| Teacher activates presence | Teacher | `presence_validated_teacher: true`, optionally `status: 1` (ACTIVATED) |
| Controller validates presence (final) | Controller | `presence_validated_controleur: true` |
| Teacher validates notes | Teacher | `notes_validated_teacher: true` |
| Controller validates notes (final) | Controller | `notes_validated_controleur: true` |

- **Actor (teacher vs controller):** Determined by **interface**, not by JWT role.
  - **Teacher** = user is on the **teacher interface** (e.g. `/teacher/attendance`, `/teacher/grades`). Only they see “Activate” and “Validate notes”; frontend sends only teacher booleans from there.
  - **Controller** = user validates **outside** the teacher interface (e.g. dashboard presence/notes page). Anyone there is treated as controller; frontend sends only controleur booleans.
- Backend may enforce that only the appropriate boolean is set per request (e.g. reject `presence_validated_controleur: true` if the request is from a “teacher” context), or accept any PATCH and rely on order/irreversibility. Current backend does not enforce actor from JWT.
- Once set to `true`, these booleans should **not** be set back to `false` (irreversible).

---

## 4. Order and guards (recommended)

- **Presence:** Controller can set `presence_validated_controleur: true` only when `presence_validated_teacher === true`.
- **Notes:** Teacher can set `notes_validated_teacher: true` only when presence is at least teacher-validated (e.g. `presence_validated_teacher === true`). Controller can set `notes_validated_controleur: true` only when `notes_validated_teacher === true`.
- **Session status:** You can set planning `status` to ACTIVATED (e.g. `1`) when the teacher sets `presence_validated_teacher: true` (optional; frontend may send `status: 1` on activate).

---

## 5. API summary

- **GET** planning (single or list): include `presence_validated_teacher`, `presence_validated_controleur`, `notes_validated_teacher`, `notes_validated_controleur`, `has_notes`.
- **PATCH** planning: accept the four booleans (and optionally `status`). Enforce the order rules above. Actor (teacher vs controller) is determined by the frontend via which interface is used; backend may optionally validate role from JWT.

---

## 6. Migration from old status fields

If you currently have `presence_validation_status` and `notes_validation_status` (0/1/2):

- **Option A:** Keep both. Backend computes the four booleans from the old status when returning GET, and accepts either the old status or the new booleans on PATCH (and syncs the other representation).
- **Option B:** Switch fully to the four booleans. Migrate existing data: e.g. `presence_validation_status === 2` → `presence_validated_teacher = true`, `presence_validated_controleur = true`; `=== 1` → only teacher true; `=== 0` → both false. Same for notes. Then deprecate the old status fields.

Frontend is updated to **send and read the new booleans**; it can still derive a “status” (0/1/2) from them for display if needed.
