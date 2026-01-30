import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import SessionPdfLayout, { type SessionPdfHeader } from './SessionPdfLayout';
import { sessionPdfStyles as styles } from './sessionPdfStyles';

export type PresencePdfHeader = SessionPdfHeader;

export interface PresencePdfLabels {
  absent: string;
  present: string;
  teacherSignature: string;
  controllerSignature: string;
}

export interface PresencePDFProps {
  header: PresencePdfHeader;
  absentNames: string[];
  presentNames: string[];
  /** "Teacher Validated" (intermediate) or "Final / Controller Validated" (final). Null when draft. */
  validatedLabel: string | null;
  labels: PresencePdfLabels;
}

const PresencePDF: React.FC<PresencePDFProps> = ({
  header,
  absentNames,
  presentNames,
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
        <Text style={styles.sectionTitle}>Presence</Text>
        <View style={styles.twoColumns}>
          <View style={styles.column}>
            <Text style={styles.columnTitle}>{labels.absent}</Text>
            {absentNames.length === 0 ? (
              <Text style={styles.studentRow}>—</Text>
            ) : (
              absentNames.map((name, i) => (
                <Text key={`absent-${i}`} style={styles.studentRow}>{name}</Text>
              ))
            )}
          </View>
          <View style={styles.column}>
            <Text style={styles.columnTitle}>{labels.present}</Text>
            {presentNames.length === 0 ? (
              <Text style={styles.studentRow}>—</Text>
            ) : (
              presentNames.map((name, i) => (
                <Text key={`present-${i}`} style={styles.studentRow}>{name}</Text>
              ))
            )}
          </View>
        </View>
      </View>
    </SessionPdfLayout>
  );
};

export default PresencePDF;
