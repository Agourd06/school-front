import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

export type BulletinSubjectRow = {
  name: string;
  studentNote: string;
  classNote: string;
  appreciation: string;
};

export interface BulletinPDFProps {
  studentName: string;
  classLabel?: string | null;
  schoolYearLabel?: string | null;
  periodLabel?: string | null;
  birthDate?: string | null;
  studentId?: string | null;
  counselorNote?: string | null;
  principalNote?: string | null;
  overallAverage?: string | number | null;
  classAverage?: string | number | null;
  rank?: string | number | null;
  subjects: BulletinSubjectRow[];
  absences?: number;
  tardies?: number;
}

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#111',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  brand: {
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: 1.5,
  },
  contact: {
    fontSize: 9,
    color: '#555',
  },
  title: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 18,
    fontWeight: 600,
    letterSpacing: 1,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    marginBottom: 18,
  },
  metaItem: {
    width: '50%',
    padding: 8,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  metaLabel: {
    fontSize: 8,
    textTransform: 'uppercase',
    color: '#6b7280',
  },
  metaValue: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: 600,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 18,
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 10,
    backgroundColor: '#f8fafc',
  },
  summaryLabel: {
    fontSize: 9,
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 700,
    marginTop: 4,
  },
  table: {
    width: '100%',
    borderWidth: 1.2,
    borderColor: '#111',
    borderBottomWidth: 0,
    borderRadius: 4,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#111',
  },
  headerCell: {
    fontWeight: 600,
    backgroundColor: '#eef2ff',
  },
  cell: {
    borderRightWidth: 1,
    borderColor: '#111',
    padding: 6,
    flexGrow: 1,
  },
  cellLast: {
    borderRightWidth: 0,
  },
  footer: {
    marginTop: 18,
    lineHeight: 1.5,
  },
  footerGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  footerBlock: {
    width: '48%',
    borderTopWidth: 1,
    borderColor: '#9ca3af',
    paddingTop: 6,
    fontSize: 10,
  },
});

export const BulletinPDF: React.FC<BulletinPDFProps> = ({
  studentName,
  classLabel,
  schoolYearLabel,
  periodLabel,
  birthDate,
  studentId,
  counselorNote,
  principalNote,
  overallAverage,
  classAverage,
  rank,
  subjects,
  absences = 0,
  tardies = 0,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>Edusole</Text>
          <Text style={styles.contact}>International School</Text>
          <Text style={styles.contact}>Tel: 00-00-00-00-00 • admin@edusole.com</Text>
        </View>
        <View style={{ textAlign: 'right' }}>
          <Text style={styles.contact}>School Year {schoolYearLabel ?? '—'}</Text>
          {periodLabel ? <Text style={styles.contact}>Term: {periodLabel}</Text> : null}
          <Text style={styles.contact}>Generated on: {new Date().toLocaleDateString()}</Text>
        </View>
      </View>

      <Text style={styles.title}>Academic Report — Term 1</Text>

      <View style={styles.metaGrid}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Student Name</Text>
          <Text style={styles.metaValue}>{studentName}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Student ID</Text>
          <Text style={styles.metaValue}>{studentId ?? '—'}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Class</Text>
          <Text style={styles.metaValue}>{classLabel ?? '—'}</Text>
        </View>
        <View style={[styles.metaItem, { borderRightWidth: 0 }]}>
          <Text style={styles.metaLabel}>Date of Birth</Text>
          <Text style={styles.metaValue}>{birthDate ?? '—'}</Text>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Overall Avg.</Text>
          <Text style={styles.summaryValue}>{overallAverage ?? '—'}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Class Avg.</Text>
          <Text style={styles.summaryValue}>{classAverage ?? '—'}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Class Rank</Text>
          <Text style={styles.summaryValue}>{rank ?? '—'}</Text>
        </View>
      </View>

      <View style={styles.table}>
        <View style={[styles.row, styles.headerCell]}>
          <View style={[styles.cell, { flex: 2 }]}>
            <Text>Course</Text>
          </View>
          <View style={styles.cell}>
            <Text>Note</Text>
          </View>
          <View style={styles.cell}>
            <Text>Coefficient</Text>
          </View>
          <View style={[styles.cell, styles.cellLast, { flex: 3 }]}>
            <Text>Remarks</Text>
          </View>
        </View>

        {subjects.length === 0 ? (
          <View style={styles.row}>
            <View style={[styles.cell, { flex: 2 }]}>
              <Text>—</Text>
            </View>
            <View style={styles.cell}>
              <Text>—</Text>
            </View>
            <View style={styles.cell}>
              <Text>—</Text>
            </View>
            <View style={[styles.cell, styles.cellLast, { flex: 3 }]}>
              <Text>No courses yet.</Text>
            </View>
          </View>
        ) : (
          subjects.map((subject, index) => (
            <View style={styles.row} key={`${subject.name}-${index}`}>
              <View style={[styles.cell, { flex: 2 }]}>
                <Text>{subject.name}</Text>
              </View>
              <View style={styles.cell}>
                <Text>{subject.studentNote}</Text>
              </View>
              <View style={styles.cell}>
                <Text>{subject.classNote}</Text>
              </View>
              <View style={[styles.cell, styles.cellLast, { flex: 3 }]}>
                <Text>{subject.appreciation}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.footer}>
        <Text>Absences: {absences ?? 0}</Text>
        <Text>Late arrivals: {tardies ?? 0}</Text>
      </View>

      <View style={styles.footerGrid}>
        <View style={styles.footerBlock}>
          <Text style={{ fontWeight: 600, marginBottom: 4 }}>Class Council Notes</Text>
          <Text>{counselorNote ?? 'Pending input.'}</Text>
        </View>
        <View style={styles.footerBlock}>
          <Text style={{ fontWeight: 600, marginBottom: 4 }}>Principal Notes</Text>
          <Text>{principalNote ?? 'Pending input.'}</Text>
        </View>
      </View>
    </Page>
  </Document>
);

export default BulletinPDF;

