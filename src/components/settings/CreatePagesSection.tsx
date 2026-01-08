import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { pagesApi } from '../../api/pages';
import { getAvailableRoutes } from '../../utils/availableRoutes';
import Button from '../ui/Button';

interface CreatePagesSectionProps {
  onPagesCreated: () => void;
}

const CreatePagesSection: React.FC<CreatePagesSectionProps> = ({ onPagesCreated }) => {
  const { t } = useTranslation();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number; errors: string[] } | null>(null);

  const availableRoutes = getAvailableRoutes();

  const handleCreateAllPages = async () => {
    try {
      setCreating(true);
      setError(null);
      setSuccess(false);
      setResult(null);

      // Prepare routes for bulk creation
      const routes = availableRoutes.map((route) => ({
        route: route.route,
        title: route.title,
      }));

      // Use bulk creation endpoint
      const response = await pagesApi.createFromRoutes({
        routes,
        skipExisting: true,
      });

      setResult({
        created: response.created,
        skipped: response.skipped,
        errors: response.errors,
      });
      setSuccess(true);
      onPagesCreated();
      
      // Reset success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || t('settings.failedToCreatePages');
      setError(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-1">{t('settings.createPagesFromRoutes')}</h4>
          <p className="text-sm text-gray-600">
            {t('settings.createPagesDescription', { count: availableRoutes.length })}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && result && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm">
          <div className="font-semibold mb-2">{t('settings.pagesCreatedSuccessfully')}</div>
          <div className="space-y-1">
            <div>✅ {t('settings.created')}: {result.created} {t('settings.pages')}</div>
            {result.skipped > 0 && <div>⏭️ {t('settings.skipped')}: {result.skipped} {t('settings.pagesAlreadyExist')}</div>}
            {result.errors.length > 0 && (
              <div className="mt-2">
                <div className="font-semibold">{t('settings.errors')}</div>
                <ul className="list-disc list-inside mt-1">
                  {result.errors.map((error, index) => (
                    <li key={index} className="text-red-700">{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <Button
          onClick={handleCreateAllPages}
          disabled={creating}
          variant="primary"
          className="px-6"
        >
          {creating ? t('settings.creatingPages') : t('settings.createAllPages', { count: availableRoutes.length })}
        </Button>
        {creating && (
          <div className="text-sm text-gray-600">
            {t('settings.creatingPagesPleaseWait')}
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p>{t('settings.thisWillCreatePagesForRoutes')}</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          {availableRoutes.slice(0, 5).map((route) => (
            <li key={route.route}>
              <span className="font-mono">{route.route}</span> - {route.title}
            </li>
          ))}
          {availableRoutes.length > 5 && (
            <li className="text-gray-400">{t('settings.andMore', { count: availableRoutes.length - 5 })}</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default CreatePagesSection;

