import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useCompany } from '../../hooks/useCompanies';
import { getFileUrl } from '../../utils/apiConfig';
import { FileText, AlertCircle } from 'lucide-react';

const PdfLayoutSettings: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const companyId = user?.company_id;

  const { data: company, isLoading } = useCompany(companyId || 0);

  const getLogoUrl = (logo?: string | null) => {
    if (!logo) return null;
    const url = getFileUrl(logo);
    return url?.trim() || null;
  };

  const isEmptyHtml = (html: string | null | undefined): boolean => {
    if (!html) return true;
    const textContent = html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim();
    return textContent.length === 0;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted">{t('common.loading')}</div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-12">
        <p className="text-muted">{t('common.error')}</p>
      </div>
    );
  }

  const logoUrl = getLogoUrl(company.logo);
  const entete1 = company.entete_1 || '';
  const entete2 = company.entete_2 || '';
  const entete3 = company.entete_3 || '';
  const pied1 = company.pied_1 || '';
  const pied2 = company.pied_2 || '';
  const pied3 = company.pied_3 || '';

  // PDF Layout settings
  const logoLeft = company.logo_left ?? false;
  const logoRight = company.logo_right ?? false;
  const papierEntete = company.papier_entete ?? false;

  // Check if there's any header/footer content
  const hasHeaderContent = !isEmptyHtml(entete1) || !isEmptyHtml(entete2) || !isEmptyHtml(entete3);
  const hasFooterContent = !isEmptyHtml(pied1) || !isEmptyHtml(pied2) || !isEmptyHtml(pied3);

  // Logo component
  const LogoElement = ({ placeholder = false }: { placeholder?: boolean }) => (
    logoUrl ? (
      <img
        src={logoUrl}
        alt="Company Logo"
        className="h-16 w-auto object-contain"
        style={{ maxWidth: '80px' }}
      />
    ) : placeholder ? (
      <div className="w-16 h-16 bg-gray-100 border border-dashed border-gray-300 rounded flex items-center justify-center">
        <span className="text-xs text-gray-400">Logo</span>
      </div>
    ) : null
  );

  return (
    <div className="space-y-6">
      {/* PDF Preview Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-tertiary/20">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-heading">
            {t('settings.pdfPreview') || 'PDF Preview'}
          </h3>
        </div>

        {/* A4-like Preview Container */}
        <div
          className="bg-white border border-gray-300 shadow-lg mx-auto overflow-hidden"
          style={{
            width: '100%',
            maxWidth: '600px',
            aspectRatio: '210 / 297',
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header Area */}
          <div className="mb-8 pb-4 border-b border-gray-200">
            <div className="flex items-start justify-between gap-4">
              {/* Left Logo */}
              <div className="flex-shrink-0" style={{ minWidth: '80px' }}>
                {logoLeft ? (
                  <LogoElement placeholder />
                ) : (
                  <div className="w-16 h-16" /> 
                )}
              </div>

              {/* Header Content - Centered (only if papierEntete is enabled) */}
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                {papierEntete ? (
                  hasHeaderContent ? (
                    <div className="space-y-1 pdf-html-content">
                      {!isEmptyHtml(entete3) && (
                        <div
                          className="pdf-rich-text"
                          dangerouslySetInnerHTML={{ __html: entete3 }}
                        />
                      )}
                      {!isEmptyHtml(entete2) && (
                        <div
                          className="pdf-rich-text"
                          dangerouslySetInnerHTML={{ __html: entete2 }}
                        />
                      )}
                      {!isEmptyHtml(entete1) && (
                        <div
                          className="pdf-rich-text"
                          dangerouslySetInnerHTML={{ __html: entete1 }}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm italic">
                      {t('settings.noHeaderContent') || 'No header content'}
                    </div>
                  )
                ) : (
                  <div className="text-gray-300 text-xs italic">
                    {t('settings.letterheadDisabled') || 'Letterhead disabled'}
                  </div>
                )}
              </div>

              {/* Right Logo */}
              <div className="flex-shrink-0" style={{ minWidth: '80px' }}>
                {logoRight ? (
                  <LogoElement placeholder />
                ) : (
                  <div className="w-16 h-16" />
                )}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <FileText className="w-16 h-16 mx-auto mb-3 opacity-30" />
              <p className="text-base">{t('settings.pdfContentArea') || 'Document Content Area'}</p>
            </div>
          </div>

          {/* Footer Area (only if papierEntete is enabled) */}
          <div className="pt-4 mt-8 border-t border-gray-200">
            <div className="text-right">
              {papierEntete ? (
                hasFooterContent ? (
                  <div className="space-y-1 pdf-html-content">
                    {!isEmptyHtml(pied3) && (
                      <div
                        className="pdf-rich-text"
                        dangerouslySetInnerHTML={{ __html: pied3 }}
                      />
                    )}
                    {!isEmptyHtml(pied2) && (
                      <div
                        className="pdf-rich-text"
                        dangerouslySetInnerHTML={{ __html: pied2 }}
                      />
                    )}
                    {!isEmptyHtml(pied1) && (
                      <div
                        className="pdf-rich-text"
                        dangerouslySetInnerHTML={{ __html: pied1 }}
                      />
                    )}
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm italic">
                    {t('settings.noFooterContent') || 'No footer content'}
                  </div>
                )
              ) : (
                <div className="text-gray-300 text-xs italic text-center">
                  {t('settings.letterheadDisabled') || 'Letterhead disabled'}
                </div>
              )}
            </div>
          </div>
        </div>

        <p className="text-xs text-center text-muted">
          {t('settings.previewNote') || 'This is a preview. Actual PDF appearance may vary slightly.'}
        </p>
      </div>

      {/* Warning if no logo but logo settings enabled */}
      {!logoUrl && (logoLeft || logoRight) && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            {t('settings.noLogoWarning') || 'Logo display is enabled but no logo has been uploaded. Please upload a company logo in Company Settings.'}
          </p>
        </div>
      )}

      {/* CSS for proper HTML rendering */}
      <style>{`
        .pdf-html-content {
          font-family: inherit;
          line-height: 1.5;
        }
        
        .pdf-rich-text {
          font-size: 0.875rem;
        }
        
        .pdf-rich-text p {
          margin: 0;
          padding: 0;
        }
        
        .pdf-rich-text h1 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0 0 0.25rem 0;
        }
        
        .pdf-rich-text h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0 0 0.25rem 0;
        }
        
        .pdf-rich-text h3 {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0 0 0.25rem 0;
        }
        
        .pdf-rich-text strong,
        .pdf-rich-text b {
          font-weight: 700;
        }
        
        .pdf-rich-text em,
        .pdf-rich-text i {
          font-style: italic;
        }
        
        .pdf-rich-text u {
          text-decoration: underline;
        }
        
        .pdf-rich-text s,
        .pdf-rich-text strike {
          text-decoration: line-through;
        }
        
        .pdf-rich-text ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin: 0.25rem 0;
        }
        
        .pdf-rich-text ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin: 0.25rem 0;
        }
        
        .pdf-rich-text li {
          margin: 0.125rem 0;
        }
        
        .pdf-rich-text a {
          color: #2563eb;
          text-decoration: underline;
        }
        
        .pdf-rich-text blockquote {
          border-left: 3px solid #d1d5db;
          padding-left: 0.75rem;
          margin: 0.25rem 0;
          font-style: italic;
          color: #6b7280;
        }
        
        .pdf-rich-text pre,
        .pdf-rich-text code {
          font-family: monospace;
          background-color: #f3f4f6;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-size: 0.8rem;
        }
        
        .pdf-rich-text table {
          border-collapse: collapse;
          width: 100%;
          margin: 0.25rem 0;
        }
        
        .pdf-rich-text th,
        .pdf-rich-text td {
          border: 1px solid #d1d5db;
          padding: 0.25rem 0.5rem;
          text-align: left;
        }
        
        .pdf-rich-text th {
          background-color: #f3f4f6;
          font-weight: 600;
        }
        
        .pdf-rich-text img {
          max-width: 100%;
          height: auto;
        }
        
        .pdf-rich-text hr {
          border: none;
          border-top: 1px solid #d1d5db;
          margin: 0.5rem 0;
        }
        
        .pdf-rich-text [style*="text-align: center"],
        .pdf-rich-text .text-center {
          text-align: center;
        }
        
        .pdf-rich-text [style*="text-align: right"],
        .pdf-rich-text .text-right {
          text-align: right;
        }
        
        .pdf-rich-text [style*="text-align: left"],
        .pdf-rich-text .text-left {
          text-align: left;
        }
        
        .pdf-rich-text [style*="text-align: justify"],
        .pdf-rich-text .text-justify {
          text-align: justify;
        }
      `}</style>
    </div>
  );
};

export default PdfLayoutSettings;
