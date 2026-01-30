import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import SessionPdfLayout, { type SessionPdfHeader } from './SessionPdfLayout';
import { sessionPdfStyles as styles } from './sessionPdfStyles';

export interface NotesPdfLabels {
  absent: string;
  presentGraded: string;
  noteLabel: string;
  teacherSignature: string;
  controllerSignature: string;
}

export interface NotesPDFProps {
  header: SessionPdfHeader;
  /** Absent students: name only; note is always 0 (computed in PDF). */
  absentNames: string[];
  /** Present students with note > -1 only (name + note). */
  presentGraded: Array<{ name: string; note: number }>;
  /** "Teacher Validated" (intermediate) or "Final / Controller Validated" (final). Null when draft. */
  validatedLabel: string | null;
  labels: NotesPdfLabels;
}

const NOTES_ABSENT_COMPUTED = 0;

const NotesPDF: React.FC<NotesPDFProps> = ({
  header,
  absentNames,
  presentGraded,
  validatedLabel,
  labels,
}) => {
  return (
    <SessionPdfLayout
      header={header}
      validatedLabel={validatedLabel}
      signatureLabels={{
        teacherSignature: labels.teacherSignature,
        controllerSignature: labels.controllerSignature,
      }}
    >
      <View>
        <Text style={styles.sectionTitle}>{labels.noteLabel}</Text>
        <View style={styles.twoColumns}>
          <View style={styles.column}>
            <Text style={styles.columnTitle}>{labels.absent}</Text>
            {absentNames.length === 0 ? (
              <Text style={styles.studentRow}>—</Text>
            ) : (
              absentNames.map((name, i) => (
                <View key={`absent-${i}`} style={styles.studentRowWithNote}>
                  <Text>{name}</Text>
                  <Text>{`Note: ${NOTES_ABSENT_COMPUTED}`}</Text>
                </View>
              ))
            )}
          </View>
          <View style={styles.column}>
            <Text style={styles.columnTitle}>{labels.presentGraded}</Text>
            {presentGraded.length === 0 ? (
              <Text style={styles.studentRow}>—</Text>
            ) : (
              presentGraded.map(({ name, note }, i) => (
                <View key={`graded-${i}`} style={styles.studentRowWithNote}>
                  <Text>{name}</Text>
                  <Text>{String(note)}</Text>
                </View>
              ))
            )}
          </View>
        </View>
      </View>
    </SessionPdfLayout>
  );
};

export default NotesPDF;
