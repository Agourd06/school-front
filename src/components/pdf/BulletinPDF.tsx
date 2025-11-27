import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

export interface BulletinSubjectRow {
  name: string;
  studentNote?: string | number | null;
  classNote?: string | number | null;
  appreciation?: string | null;
}

interface BulletinPDFProps {
  studentName: string;
  classLabel?: string | null;
  schoolYearLabel?: string | null;
  periodLabel?: string | null;
  birthDate?: string | null;
  studentId?: string | number | null;
  counselorNote?: string | null;
  principalNote?: string | null;
  overallAverage?: string | number | null;
  classAverage?: string | number | null;
  rank?: string | number | null;
  subjects: BulletinSubjectRow[];
  absences?: number;
  tardies?: number;
}

export const BulletinPDF = ({
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
}: BulletinPDFProps) => {
  const previewSubjects = subjects.length > 0 ? subjects : sampleSubjects;

  return (
  <Document>
    <Page size="A4" style={styles.page}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>EDUSOLE ACADEMY</Text>
          <Text style={styles.subBrand}>Excellence & Discipline</Text>
          <Text style={styles.contact}>admin@edusole.com • +212 600 000 000</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.schoolYear}>Year: {schoolYearLabel || "—"}</Text>
          <Text style={styles.term}>Term: {periodLabel || "—"}</Text>
          <Text style={styles.generated}>
            Generated: {new Date().toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* TITLE */}
      <Text style={styles.title}>Academic Performance Report</Text>

      {/* STUDENT INFO */}
      <View style={styles.infoContainer}>
        <InfoItem label="Student Name" value={studentName || "Johnathan Doe"} />
        <InfoItem label="Student ID" value={studentId || "ST-2025-001"} />
        <InfoItem label="Class" value={classLabel || "Grade 12 - Science"} />
        <InfoItem label="Birth Date" value={birthDate || "12/06/2008"} />
      </View>

      {/* SUMMARY */}
      <View style={styles.summaryRow}>
        <SummaryCard label="Overall Average" value={overallAverage ?? "16.4"} />
        <SummaryCard label="Class Average" value={classAverage ?? "14.8"} />
        <SummaryCard label="Rank" value={rank ?? "3 / 28"} />
      </View>

      {/* TABLE */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <TableCell text="Course" flex={2} bold />
          <TableCell text="Note" />
          <TableCell text="Coefficient" />
          <TableCell text="Remarks" flex={2} bold />
        </View>

        {previewSubjects.map((s, i) => (
          <View key={`${s.name}-${i}`} style={styles.tableRow}>
            <TableCell text={s.name} flex={2} />
            <TableCell text={s.studentNote ?? "—"} />
            <TableCell text={s.classNote ?? "—"} />
            <TableCell text={s.appreciation ?? "—"} flex={2} />
          </View>
        ))}
      </View>

      {/* ATTENDANCE */}
      <View style={styles.attendanceBox}>
        <Text style={styles.attendanceText}>Absences: {absences}</Text>
        <Text style={styles.attendanceText}>Tardies: {tardies}</Text>
      </View>

      {/* NOTES */}
      <View style={styles.notesGrid}>
        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Class Council Notes</Text>
          <Text style={styles.noteContent}>
            {counselorNote ||
              "Consistently engaged, demonstrates leadership in group projects and maintains a positive influence on classmates."}
          </Text>
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Principal Notes</Text>
          <Text style={styles.noteContent}>
            {principalNote ||
              "Excellent academic trajectory this term. Encourage continued involvement in STEM competitions next semester."}
          </Text>
        </View>
      </View>
    </Page>
  </Document>
  );
};

/**********************************************
 *  COMPONENTS (clean + modern)
 **********************************************/

interface InfoItemProps {
  label: string;
  value?: string | number | null;
}

const InfoItem = ({ label, value }: InfoItemProps) => (
  <View style={styles.infoItem}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

interface SummaryCardProps {
  label: string;
  value?: string | number | null;
}

const SummaryCard = ({ label, value }: SummaryCardProps) => (
  <View style={styles.summaryCard}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={styles.summaryValue}>{value ?? "—"}</Text>
  </View>
);

interface TableCellProps {
  text: string | number | null;
  flex?: number;
  bold?: boolean;
}

const TableCell = ({ text, flex = 1, bold = false }: TableCellProps) => (
  <View style={[styles.cell, { flex }]}>
    <Text style={{ fontWeight: bold ? 700 : 400 }}>{text}</Text>
  </View>
);

/**********************************************
 *  STYLES (professional & elegant)
 **********************************************/

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: "Helvetica",
  },

  /** HEADER **/
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  brand: {
    fontSize: 18,
    fontWeight: 700,
    color: "#1e293b",
    letterSpacing: 0.5,
  },
  subBrand: { fontSize: 10, color: "#475569", marginTop: 2 },
  contact: { fontSize: 9, color: "#64748b" },
  headerRight: { textAlign: "right" },
  schoolYear: { fontSize: 10, fontWeight: 600 },
  term: { fontSize: 10, marginTop: 2 },
  generated: { fontSize: 9, color: "#6b7280", marginTop: 4 },

  /** TITLE **/
  title: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 20,
    color: "#1e293b",
  },

  /** INFO GRID **/
  infoContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderRadius: 8,
    backgroundColor: "#f8fafc",
    padding: 12,
    marginBottom: 18,
  },
  infoItem: { width: "50%", marginBottom: 10 },
  infoLabel: { fontSize: 8, color: "#6b7280", textTransform: "uppercase" },
  infoValue: { fontSize: 11, fontWeight: 600, marginTop: 2 },

  /** SUMMARY CARDS **/
  summaryRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  summaryCard: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#eef2ff",
  },
  summaryLabel: {
    fontSize: 9,
    color: "#475569",
    letterSpacing: 0.5,
  },
  summaryValue: { fontSize: 16, fontWeight: 700, color: "#1e293b", marginTop: 5 },

  /** TABLE **/
  table: {
    borderWidth: 1,
    borderColor: "#94a3b8",
    borderRadius: 6,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#e0e7ff",
    paddingVertical: 6,
  },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#e2e8f0" },
  cell: { padding: 6, borderRightWidth: 1, borderColor: "#e2e8f0" },

  /** ATTENDANCE **/
  attendanceBox: {
    marginTop: 16,
    padding: 10,
    backgroundColor: "#f1f5f9",
    borderRadius: 6,
  },
  attendanceText: { fontSize: 10, color: "#475569" },

  /** NOTES **/
  notesGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 10,
  },
  noteCard: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  noteTitle: { fontSize: 11, fontWeight: 700, marginBottom: 5 },
  noteContent: { fontSize: 10, color: "#475569", lineHeight: 1.4 },
});

export default BulletinPDF;

const sampleSubjects: BulletinSubjectRow[] = [
  { name: "Mathematics", studentNote: "18.2", classNote: "14.0", appreciation: "Outstanding problem-solving" },
  { name: "Physics", studentNote: "17.4", classNote: "13.5", appreciation: "Great lab participation" },
  { name: "English Literature", studentNote: "16.8", classNote: "15.0", appreciation: "Articulate and creative writing" },
  { name: "History & Geography", studentNote: "14.5", classNote: "12.8", appreciation: "Insightful research work" },
];

