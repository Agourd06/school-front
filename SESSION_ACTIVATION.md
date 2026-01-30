# Session Activation – Teacher & Controller Validation

This document defines how a session becomes **fully activated**: presence (and notes when the session has notes) are validated by the teacher, then by the controller. No new backend endpoint is required if the backend already supports PATCH on the planning resource with the fields below.

---

## 1. Flow Summary

| Step | Who | Action | Backend (PATCH planning) |
|------|-----|--------|---------------------------|
| 1 | **Teacher** | Activate presence (one-time) | `presence_validation_status: 1`, `status: 1` (ACTIVATED) |
| 2 | **Controller** | Validate presence (final) | `presence_validation_status: 2` |
| 3a | **Teacher** | Validate notes *(only if session has notes)* | `notes_validation_status: 1` |
| 4a | **Controller** | Validate notes (final) *(only if session has notes)* | `notes_validation_status: 2` |

- **If `has_notes === false`:** Steps 3a and 4a are skipped. Session is fully activated when presence is LOCKED (step 2).
- **If `has_notes === true`:** Steps 3a and 4a are required for the session to be considered **fully activated**. Controller can perform step 2 and step 4a in any order; the session is fully activated only when both presence and notes are LOCKED.

---

## 2. “Session fully activated” definition

- **Presence** is locked when **both** `presence_validated_teacher` and `presence_validated_controleur` are `true`.
- **Notes:** If `has_notes === false`, no notes validation. If `has_notes === true`, notes are locked when **both** `notes_validated_teacher` and `notes_validated_controleur` are `true`.

So:

```ts
sessionFullyActivated =
  presence_validated_teacher && presence_validated_controleur
  && ( !has_notes || ( notes_validated_teacher && notes_validated_controleur ) );
```

---

## 3. Backend expectations (no new endpoint)

- **PATCH** the planning resource with the **four booleans** (see VALIDATION_BOOLEANS_BACKEND.md):
  - `presence_validated_teacher`, `presence_validated_controleur`
  - `notes_validated_teacher`, `notes_validated_controleur`
  - Optionally `status`: e.g. `1` (ACTIVATED) when teacher activates presence

- **Optional backend rules** (recommended for consistency):
  - When the teacher “activates” presence, backend may require at least one student marked present (frontend already enforces this).
  - When `has_notes === true`, backend may allow controller to set `presence_validation_status: 2` and `notes_validation_status: 2` in any order; no need to block one on the other.
  - Backend should not allow going back from LOCKED to TEACHER_VALIDATED or DRAFT (irreversible).

- **No new endpoint:** Use existing PATCH planning by id with the above fields.

---

## 4. Frontend behavior

- **Teacher**
  - Presence: one “Activate” action (DRAFT → TEACHER_VALIDATED + session ACTIVATED). Disabled if no student is present.
  - Notes (if `has_notes`): “Validate notes” (DRAFT → TEACHER_VALIDATED). Disabled if no present students.
- **Controller**
  - Presence: “Validate (Final)” when presence is TEACHER_VALIDATED (→ LOCKED).
  - Notes (if `has_notes`): “Validate notes (Final)” when notes are TEACHER_VALIDATED (→ LOCKED).
- **UI:** When `sessionFullyActivated` is true, show a clear “Session fully validated” state (e.g. badge in footer). When `has_notes === false`, notes validation buttons and Notes PDF are hidden.

---

## 5. Validation status constants (shared)

- `0` = DRAFT (editable)
- `1` = TEACHER_VALIDATED (read-only for teacher; controller can do final step)
- `2` = LOCKED (final; no further changes)

See `src/constants/validationStatus.ts` and `PRESENCE_NOTES_SPEC.md` for full spec.
