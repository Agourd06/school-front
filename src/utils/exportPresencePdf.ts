import React from 'react';
import { pdf } from '@react-pdf/renderer';
import PresencePDF, {
  type PresencePdfHeader,
  type PresencePdfLabels,
  type PresencePDFProps,
} from '../components/pdf/PresencePDF';

export interface ExportPresencePdfParams {
  header: PresencePdfHeader;
  absentNames: string[];
  presentNames: string[];
  /** "Teacher Validated" or "Final / Controller Validated". Null when draft. */
  validatedLabel: string | null;
  labels: PresencePdfLabels;
  fileName?: string;
}

export async function exportPresencePdf({
  header,
  absentNames,
  presentNames,
  validatedLabel,
  labels,
  fileName,
}: ExportPresencePdfParams): Promise<void> {
  const props: PresencePDFProps = {
    header,
    absentNames,
    presentNames,
    validatedLabel: validatedLabel ?? null,
    labels,
  };

  const instance = pdf();
  instance.updateContainer(React.createElement(PresencePDF, props));
  const blob = await instance.toBlob();
  const safeName =
    fileName ||
    `Presence-${header.date.replace(/\//g, '-')}-${header.classGroup.replace(/\s+/g, '_')}.pdf`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = safeName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
