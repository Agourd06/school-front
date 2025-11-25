import { pdf } from '@react-pdf/renderer';
import BulletinPDF, { type BulletinSubjectRow } from '../components/pdf/BulletinPDF';

export interface ExportStudentReportPdfParams {
  studentName: string;
  studentId?: string | null;
  classLabel?: string | null;
  schoolYearLabel?: string | null;
  periodLabel?: string | null;
  birthDate?: string | null;
  counselorNote?: string | null;
  principalNote?: string | null;
  overallAverage?: string | number | null;
  classAverage?: string | number | null;
  rank?: string | number | null;
  subjects: BulletinSubjectRow[];
  absences?: number;
  tardies?: number;
}

export const exportStudentReportPdf = async ({
  studentName,
  studentId,
  classLabel,
  schoolYearLabel,
  periodLabel,
  birthDate,
  counselorNote,
  principalNote,
  overallAverage,
  classAverage,
  rank,
  subjects,
  absences,
  tardies,
}: ExportStudentReportPdfParams) => {
  const instance = pdf();
  instance.updateContainer(
    <BulletinPDF
      studentName={studentName}
      studentId={studentId}
      classLabel={classLabel}
      schoolYearLabel={schoolYearLabel}
      periodLabel={periodLabel}
      birthDate={birthDate}
      counselorNote={counselorNote}
      principalNote={principalNote}
      overallAverage={overallAverage}
      classAverage={classAverage}
      rank={rank}
      subjects={subjects}
      absences={absences}
      tardies={tardies}
    />
  );

  const blob = await instance.toBlob();
  const safeFileName = `Report-${studentName.replace(/\s+/g, '_')}.pdf`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = safeFileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

