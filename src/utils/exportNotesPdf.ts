import React from 'react';
import { pdf } from '@react-pdf/renderer';
import NotesPDF, {
  type NotesPDFProps,
  type NotesPdfLabels,
} from '../components/pdf/NotesPDF';
import type { SessionPdfHeader } from '../components/pdf/SessionPdfLayout';

export interface ExportNotesPdfParams {
  header: SessionPdfHeader;
  absentNames: string[];
  /** Present students with note > -1 only (included in PDF). */
  presentGraded: Array<{ name: string; note: number }>;
  /** "Teacher Validated" or "Final / Controller Validated". Null when draft. */
  validatedLabel: string | null;
  labels: NotesPdfLabels;
  fileName?: string;
}

export async function exportNotesPdf({
  header,
  absentNames,
  presentGraded,
  validatedLabel,
  labels,
  fileName,
}: ExportNotesPdfParams): Promise<void> {
  const props: NotesPDFProps = {
    header,
    absentNames,
    presentGraded,
    validatedLabel: validatedLabel ?? null,
    labels,
  };

  const instance = pdf();
  instance.updateContainer(React.createElement(NotesPDF, props));
  const blob = await instance.toBlob();
  const safeName =
    fileName ||
    `Notes-${header.date.replace(/\//g, '-')}-${header.classGroup.replace(/\s+/g, '_')}.pdf`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = safeName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
