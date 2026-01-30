import type { PlanningStudentEntry } from '../api/planningStudent';

const notSpecified = (t: (key: string) => string) => t('forms.notSpecified');

export interface PlanningDetailFormatted {
  date: string;
  time: string;
  teacher: string;
  classroom: string;
  classTitle: string;
  period: string;
  sessionType: string;
}

/**
 * Format a planning entry for display (date, time, teacher, classroom, class, period, session type).
 * Missing info is shown as "Not specified" (or translated equivalent).
 */
export function formatPlanningDetail(
  planning: PlanningStudentEntry | undefined,
  t: (key: string) => string
): PlanningDetailFormatted | null {
  if (!planning) return null;
  const ns = notSpecified(t);
  const date =
    planning.date_day && !Number.isNaN(new Date(planning.date_day).getTime())
      ? new Date(planning.date_day).toLocaleDateString()
      : ns;
  const time =
    planning.hour_start && planning.hour_end ? `${planning.hour_start} – ${planning.hour_end}` : ns;
  const teacher = planning.teacher
    ? `${planning.teacher.first_name ?? ''} ${planning.teacher.last_name ?? ''}`.trim() ||
      planning.teacher.email ||
      `${t('planning.teacherNumber')}${planning.teacher.id}`
    : ns;
  const classroom = planning.classRoom?.title
    ? planning.classRoom.title
    : (planning.class_room_id != null ? `${t('planning.roomNumber')}${planning.class_room_id}` : null) || ns;
  const classTitle = planning.class?.title
    ? planning.class.title
    : (planning.class_id != null ? `${t('planning.classNumber')}${planning.class_id}` : null) || ns;
  const sessionType = planning.planningSessionType?.title ?? ns;
  const period = planning.period ?? ns;
  return {
    date,
    time,
    teacher,
    classroom,
    classTitle,
    period,
    sessionType,
  };
}
