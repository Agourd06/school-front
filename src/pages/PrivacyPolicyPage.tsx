import React from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Lock, Eye, FileText, Mail, AlertCircle, Globe } from 'lucide-react';

const PrivacyPolicyPage: React.FC = () => {
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
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-heading mb-2">
                {t('privacy.title')}
              </h1>
              <p className="text-muted text-sm">
                {t('privacy.lastUpdated')} {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl border border-primary/20 shadow-md p-8 space-y-8">
          {/* Introduction */}
          <section className="space-y-4">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold text-heading mb-3">{t('privacy.introduction.title')}</h2>
                <p className="text-body leading-relaxed">
                  {t('privacy.introduction.paragraph1')}{' '}
                  <strong className="text-secondary">{t('privacy.introduction.law')}</strong>{' '}
                  {t('privacy.introduction.paragraph1Cont')}
                </p>
                <p className="text-body leading-relaxed mt-3">
                  {t('privacy.introduction.paragraph2')}
                </p>
              </div>
            </div>
          </section>

          {/* Data We Collect */}
          <section className="space-y-4 border-t border-tertiary/20 pt-6">
            <div className="flex items-start gap-3">
              <Eye className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold text-heading mb-3">{t('privacy.dataCollection.title')}</h2>
                <p className="text-body leading-relaxed mb-3">
                  {t('privacy.dataCollection.intro')}
                </p>
                <ul className="list-disc list-inside space-y-2 text-body ml-4">
                  <li>
                    <strong className="text-heading">{t('privacy.dataCollection.identityInfo')}</strong>{' '}
                    {t('privacy.dataCollection.identityInfoDesc')}
                  </li>
                  <li>
                    <strong className="text-heading">{t('privacy.dataCollection.contactInfo')}</strong>{' '}
                    {t('privacy.dataCollection.contactInfoDesc')}
                  </li>
                  <li>
                    <strong className="text-heading">{t('privacy.dataCollection.accountInfo')}</strong>{' '}
                    {t('privacy.dataCollection.accountInfoDesc')}
                  </li>
                  <li>
                    <strong className="text-heading">{t('privacy.dataCollection.technicalData')}</strong>{' '}
                    {t('privacy.dataCollection.technicalDataDesc')}
                  </li>
                  <li>
                    <strong className="text-heading">{t('privacy.dataCollection.usageData')}</strong>{' '}
                    {t('privacy.dataCollection.usageDataDesc')}
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Why We Use Your Data */}
          <section className="space-y-4 border-t border-tertiary/20 pt-6">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold text-heading mb-3">{t('privacy.dataUsage.title')}</h2>
                <p className="text-body leading-relaxed mb-3">
                  {t('privacy.dataUsage.intro')}
                </p>
                <ul className="list-disc list-inside space-y-2 text-body ml-4">
                  <li>{t('privacy.dataUsage.purpose1')}</li>
                  <li>{t('privacy.dataUsage.purpose2')}</li>
                  <li>{t('privacy.dataUsage.purpose3')}</li>
                  <li>{t('privacy.dataUsage.purpose4')}</li>
                  <li>{t('privacy.dataUsage.purpose5')}</li>
                  <li>{t('privacy.dataUsage.purpose6')}</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Data Protection */}
          <section className="space-y-4 border-t border-tertiary/20 pt-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold text-heading mb-3">{t('privacy.dataProtection.title')}</h2>
                <p className="text-body leading-relaxed mb-3">
                  {t('privacy.dataProtection.paragraph1')}
                </p>
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-4">
                  <p className="text-body leading-relaxed">
                    <strong className="text-heading">{t('privacy.dataProtection.important')}</strong>{' '}
                    {t('privacy.dataProtection.importantText')}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Data Sharing */}
          <section className="space-y-4 border-t border-tertiary/20 pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold text-heading mb-3">{t('privacy.dataSharing.title')}</h2>
                <p className="text-body leading-relaxed mb-3">
                  {t('privacy.dataSharing.intro')}
                </p>
                <ul className="list-disc list-inside space-y-2 text-body ml-4">
                  <li>{t('privacy.dataSharing.circumstance1')}</li>
                  <li>{t('privacy.dataSharing.circumstance2')}</li>
                  <li>{t('privacy.dataSharing.circumstance3')}</li>
                  <li>{t('privacy.dataSharing.circumstance4')}</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Your Rights */}
          <section className="space-y-4 border-t border-tertiary/20 pt-6">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold text-heading mb-3">{t('privacy.yourRights.title')}</h2>
                <p className="text-body leading-relaxed mb-3">
                  {t('privacy.yourRights.intro')}{' '}
                  <strong className="text-secondary">{t('privacy.yourRights.law')}</strong>{' '}
                  {t('privacy.yourRights.introCont')}
                </p>
                <ul className="list-disc list-inside space-y-2 text-body ml-4 mb-4">
                  <li>
                    <strong className="text-heading">{t('privacy.yourRights.rightAccess')}</strong>{' '}
                    {t('privacy.yourRights.rightAccessDesc')}
                  </li>
                  <li>
                    <strong className="text-heading">{t('privacy.yourRights.rightRectification')}</strong>{' '}
                    {t('privacy.yourRights.rightRectificationDesc')}
                  </li>
                  <li>
                    <strong className="text-heading">{t('privacy.yourRights.rightOpposition')}</strong>{' '}
                    {t('privacy.yourRights.rightOppositionDesc')}
                  </li>
                  <li>
                    <strong className="text-heading">{t('privacy.yourRights.rightDeletion')}</strong>{' '}
                    {t('privacy.yourRights.rightDeletionDesc')}
                  </li>
                </ul>
                <div className="bg-secondary/5 border border-secondary/20 rounded-lg p-4 mt-4">
                  <p className="text-body leading-relaxed mb-2">
                    <strong className="text-heading">{t('privacy.yourRights.contactTitle')}</strong>
                  </p>
                  <a 
                    href="mailto:edusol@edusol.com" 
                    className="text-primary hover:text-primary/80 font-semibold inline-flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    edusol@edusol.com
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Policy Changes */}
          <section className="space-y-4 border-t border-tertiary/20 pt-6">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold text-heading mb-3">{t('privacy.policyChanges.title')}</h2>
                <p className="text-body leading-relaxed">
                  {t('privacy.policyChanges.paragraph1')}
                </p>
                <p className="text-body leading-relaxed mt-3">
                  {t('privacy.policyChanges.paragraph2')}
                </p>
              </div>
            </div>
          </section>

          {/* Footer Note */}
          <div className="border-t border-tertiary/20 pt-6 mt-8">
            <p className="text-sm text-muted text-center">
              {t('privacy.footer')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
