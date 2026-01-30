import { StyleSheet } from '@react-pdf/renderer';

/** Shared A4 session PDF layout (Presence + Notes). */
export const sessionPdfStyles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  headerLabel: {
    width: 100,
    color: '#6b7280',
    textTransform: 'uppercase',
    fontSize: 8,
  },
  headerValue: {
    flex: 1,
    fontWeight: 600,
    color: '#111827',
  },
  validatedBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#d1fae5',
    borderRadius: 4,
  },
  validatedText: {
    fontSize: 9,
    fontWeight: 700,
    color: '#065f46',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 8,
    color: '#374151',
  },
  twoColumns: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 24,
  },
  column: {
    flex: 1,
  },
  columnTitle: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#9ca3af',
    color: '#374151',
  },
  studentRow: {
    paddingVertical: 3,
    paddingLeft: 0,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    fontSize: 10,
    color: '#1f2937',
  },
  studentRowWithNote: {
    paddingVertical: 3,
    paddingLeft: 0,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    fontSize: 10,
    color: '#1f2937',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  signatures: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 32,
  },
  signatureBlock: {
    flex: 1,
  },
  signatureLabel: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 4,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    height: 24,
    marginBottom: 2,
  },
  signatureDate: {
    fontSize: 8,
    color: '#9ca3af',
  },
});
