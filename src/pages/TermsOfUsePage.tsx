import React from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, CheckCircle, AlertTriangle, Shield, Ban, Scale, Clock, Globe } from 'lucide-react';

const TermsOfUsePage: React.FC = () => {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'fr' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="min-h-screen bg-surface py-8 px-4 relative">
      {/* Language Switcher Button - Top Right */}
      <button
        onClick={toggleLanguage}
        className="fixed top-14 right-4 sm:top-20 sm:right-6 z-50 flex items-center gap-2 px-3.5 py-2.5 bg-white/95 backdrop-blur-md border border-gray-200/60 rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 hover:bg-white hover:border-primary/30 group"
        aria-label={t('language.switchLanguage') || 'Switch Language'}
        title={t('language.switchLanguage') || 'Switch Language'}
      >
        <div className="relative">
          <Globe className="w-5 h-5 text-gray-600 group-hover:text-primary transition-all duration-300 group-hover:rotate-12" />
          <div className="absolute inset-0 rounded-full bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
        </div>
        <span className="text-sm font-bold text-gray-700 group-hover:text-primary transition-all duration-300 min-w-[2.5rem] text-center transform group-hover:scale-110">
          {i18n.language === 'en' ? 'FR' : 'EN'}
        </span>
      </button>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl border border-primary/20 shadow-md p-8 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-secondary/10 to-secondary/5 flex items-center justify-center text-secondary shadow-sm border border-secondary/10">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-heading mb-2">
                {t('terms.title')}
              </h1>
              <p className="text-muted text-sm">
                {t('terms.lastUpdated')} {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl border border-primary/20 shadow-md p-8 space-y-8">
          {/* Acceptance */}
          <section className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold text-heading mb-3">{t('terms.acceptance.title')}</h2>
                <p className="text-body leading-relaxed">
                  {t('terms.acceptance.paragraph1')}
                </p>
                <p className="text-body leading-relaxed mt-3">
                  {t('terms.acceptance.paragraph2')}
                </p>
              </div>
            </div>
          </section>

          {/* Use of the Platform */}
          <section className="space-y-4 border-t border-tertiary/20 pt-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold text-heading mb-3">{t('terms.useOfPlatform.title')}</h2>
                <p className="text-body leading-relaxed mb-3">
                  {t('terms.useOfPlatform.intro')}
                </p>
                <ul className="list-disc list-inside space-y-2 text-body ml-4">
                  <li>{t('terms.useOfPlatform.agreement1')}</li>
                  <li>{t('terms.useOfPlatform.agreement2')}</li>
                  <li>{t('terms.useOfPlatform.agreement3')}</li>
                  <li>{t('terms.useOfPlatform.agreement4')}</li>
                  <li>{t('terms.useOfPlatform.agreement5')}</li>
                  <li>{t('terms.useOfPlatform.agreement6')}</li>
                  <li>{t('terms.useOfPlatform.agreement7')}</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Account Responsibility */}
          <section className="space-y-4 border-t border-tertiary/20 pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold text-heading mb-3">{t('terms.accountResponsibility.title')}</h2>
                <p className="text-body leading-relaxed mb-3">
                  {t('terms.accountResponsibility.paragraph1')}
                </p>
                <ul className="list-disc list-inside space-y-2 text-body ml-4">
                  <li>{t('terms.accountResponsibility.responsibility1')}</li>
                  <li>{t('terms.accountResponsibility.responsibility2')}</li>
                  <li>{t('terms.accountResponsibility.responsibility3')}</li>
                  <li>{t('terms.accountResponsibility.responsibility4')}</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Intellectual Property */}
          <section className="space-y-4 border-t border-tertiary/20 pt-6">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold text-heading mb-3">{t('terms.intellectualProperty.title')}</h2>
                <p className="text-body leading-relaxed mb-3">
                  {t('terms.intellectualProperty.paragraph1')}
                </p>
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-4">
                  <p className="text-body leading-relaxed">
                    <strong className="text-heading">{t('terms.intellectualProperty.important')}</strong>{' '}
                    {t('terms.intellectualProperty.importantText')}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Service Availability */}
          <section className="space-y-4 border-t border-tertiary/20 pt-6">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold text-heading mb-3">{t('terms.serviceAvailability.title')}</h2>
                <p className="text-body leading-relaxed mb-3">
                  {t('terms.serviceAvailability.intro')}
                </p>
                <ul className="list-disc list-inside space-y-2 text-body ml-4">
                  <li>{t('terms.serviceAvailability.availability1')}</li>
                  <li>{t('terms.serviceAvailability.availability2')}</li>
                  <li>{t('terms.serviceAvailability.availability3')}</li>
                  <li>{t('terms.serviceAvailability.availability4')}</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Account Suspension */}
          <section className="space-y-4 border-t border-tertiary/20 pt-6">
            <div className="flex items-start gap-3">
              <Ban className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold text-heading mb-3">{t('terms.accountSuspension.title')}</h2>
                <p className="text-body leading-relaxed mb-3">
                  {t('terms.accountSuspension.paragraph1')}
                </p>
                <ul className="list-disc list-inside space-y-2 text-body ml-4">
                  <li>{t('terms.accountSuspension.reason1')}</li>
                  <li>{t('terms.accountSuspension.reason2')}</li>
                  <li>{t('terms.accountSuspension.reason3')}</li>
                  <li>{t('terms.accountSuspension.reason4')}</li>
                  <li>{t('terms.accountSuspension.reason5')}</li>
                </ul>
                <p className="text-body leading-relaxed mt-3">
                  {t('terms.accountSuspension.paragraph2')}
                </p>
              </div>
            </div>
          </section>

          {/* Applicable Law */}
          <section className="space-y-4 border-t border-tertiary/20 pt-6">
            <div className="flex items-start gap-3">
              <Scale className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold text-heading mb-3">{t('terms.applicableLaw.title')}</h2>
                <p className="text-body leading-relaxed mb-3">
                  {t('terms.applicableLaw.paragraph1')}
                </p>
                <p className="text-body leading-relaxed">
                  {t('terms.applicableLaw.paragraph2')}
                </p>
                <div className="bg-secondary/5 border border-secondary/20 rounded-lg p-4 mt-4">
                  <p className="text-body leading-relaxed">
                    <strong className="text-heading">{t('terms.applicableLaw.legalCompliance')}</strong>{' '}
                    {t('terms.applicableLaw.legalComplianceText')}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Footer Note */}
          <div className="border-t border-tertiary/20 pt-6 mt-8">
            <p className="text-sm text-muted text-center">
              {t('terms.footer')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUsePage;
