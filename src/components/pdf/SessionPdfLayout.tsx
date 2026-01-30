import React, { type ReactNode } from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { sessionPdfStyles as styles } from './sessionPdfStyles';

export interface SessionPdfHeader {
  date: string;
  classGroup: string;
  teacher: string;
  subject: string;
  time: string;
  sessionCode?: string;
  room?: string;
}

export interface SessionPdfSignatureLabels {
  teacherSignature: string;
  controllerSignature: string;
}

interface SessionPdfLayoutProps {
  header: SessionPdfHeader;
  /** Optional badge text (e.g. "Final / Validated") when session is activated */
  validatedLabel?: string | null;
  signatureLabels: SessionPdfSignatureLabels;
  /** Middle content (e.g. two-column presence or notes) */
  children: ReactNode;
}

const SessionPdfLayout: React.FC<SessionPdfLayoutProps> = ({
  header,
  validatedLabel,
  signatureLabels,
  children,
}) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.headerLabel}>Date</Text>
            <Text style={styles.headerValue}>{header.date}</Text>
          </View>
          <View style={styles.headerRow}>
            <Text style={styles.headerLabel}>Class / Group</Text>
            <Text style={styles.headerValue}>{header.classGroup}</Text>
          </View>
          <View style={styles.headerRow}>
            <Text style={styles.headerLabel}>Teacher</Text>
            <Text style={styles.headerValue}>{header.teacher}</Text>
          </View>
          <View style={styles.headerRow}>
            <Text style={styles.headerLabel}>Subject</Text>
            <Text style={styles.headerValue}>{header.subject}</Text>
          </View>
          <View style={styles.headerRow}>
            <Text style={styles.headerLabel}>Time</Text>
            <Text style={styles.headerValue}>{header.time}</Text>
          </View>
          {(header.sessionCode != null && header.sessionCode !== '') && (
            <View style={styles.headerRow}>
              <Text style={styles.headerLabel}>Session</Text>
              <Text style={styles.headerValue}>{header.sessionCode}</Text>
            </View>
          )}
          {(header.room != null && header.room !== '') && (
            <View style={styles.headerRow}>
              <Text style={styles.headerLabel}>Room</Text>
              <Text style={styles.headerValue}>{header.room}</Text>
            </View>
          )}
          {validatedLabel && (
            <View style={styles.validatedBadge}>
              <Text style={styles.validatedText}>{validatedLabel}</Text>
            </View>
          )}
        </View>

        {children}

        <View style={styles.signatures}>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLabel}>{signatureLabels.teacherSignature}</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureDate}>Date</Text>
          </View>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLabel}>{signatureLabels.controllerSignature}</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureDate}>Date</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default SessionPdfLayout;
