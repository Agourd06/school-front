# Presence & Notes – Activation, Locking, PDFs (Complete Spec)

Frontend implementation aligned with: separate modules, single session activation, conditional notes, strict locking, independent PDFs.

---

## 1. Core Concepts

- **Presence** and **Notes** are **separate routes**, **separate UIs**, **separate PDFs**.
- Presence is **always required**.
- Notes are **optional per session**: each session defines `has_notes: boolean`.
- **Presence** = single source of truth for who is present/absent.

---

## 2. Session Activation (One-Time)

- A session can be **activated only once**.
- **Activation is done by the teacher** (controller cannot activate).
- On activation:
  - Presence becomes **read-only** (effectively locked for editing).
  - Session `status` becomes **ACTIVATED** (e.g. `status = 1`).
  - Frontend sends: `presence_validation_status: 1` (TEACHER_VALIDATED) and `status: 1` (ACTIVATED).
- Activation **does not depend on Notes**.

---

## 3. Presence Module

- **Rules:** Editable before activation; fully read-only after activation (and after controller final validation).
- **Presence PDF:**
  - Generated from Presence module only.
  - Contains: session metadata, absent students (left), present students (right), teacher & controller signatures, marked as Validated (intermediate or final per status).

---

## 4. Notes Module (Conditional)

- **If `has_notes === false`:**
  - Notes module is hidden or disabled for that session.
  - No notes validation, no Notes PDF.
- **If `has_notes === true`:**
  - Notes module is available.
  - Notes depend on Presence (only present students can receive manual notes).
  - **Rules:** Numeric notes; `-1` = no note. Absent students cannot be edited; they receive note = 0 in Notes PDF.
  - **Validation:** Teacher validates notes → notes become read-only; controller can perform final validation → LOCKED.
- **Notes PDF:** Present students with `note = -1` must **not** appear. Absent students appear with note = 0. Layout aligned with Presence PDF.

---

## 5. Controller Validation (Final Authority)

- Controller has a **read-only** interface.
- Controller **cannot activate** (no first-step “Activate” / “Validate Presence” when DRAFT).
- Controller can:
  - **Validate Presence (Final)** when presence is already teacher-validated (activated).
  - **Validate Notes (Final)** when notes are teacher-validated (if session has notes).
- Controller validation is **final** and does not allow edits.

---

## 6. API Contract (Planning Resource)

- `presence_validation_status`: `0` = DRAFT, `1` = TEACHER_VALIDATED (activated), `2` = LOCKED.
- `notes_validation_status`: `0` = DRAFT, `1` = TEACHER_VALIDATED, `2` = LOCKED.
- `has_notes`: `boolean` (optional; default `true` for backward compatibility).
- `status`: planning lifecycle (e.g. `1` = ACTIVATED when teacher activates session).

---

## 7. UI/UX

- Locked states clearly visible; disabled inputs obvious.
- Activation and validation actions confirmed via modal; irreversible.
- **Session fully activated:** when presence is LOCKED and (if `has_notes`) notes are LOCKED. See **SESSION_ACTIVATION.md** for the full teacher to controller flow and backend expectations.
- Notes route/section shows “Notes not available for this session” when selected session has `has_notes === false`.
