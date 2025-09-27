import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * Example component showing how to use translations
 * This can be used as reference for other developers
 */
const TranslationExample = () => {
  const { t, formatDate, formatNumber, formatCurrency, currentLanguage } = useLanguage();

  const exampleDate = new Date();
  const exampleNumber = 1234567.89;
  const examplePrice = 99.99;

  return (
    <div style={{
      padding: '2rem',
      border: '1px solid var(--gray-300)',
      borderRadius: 'var(--radius-lg)',
      margin: '1rem',
      background: 'white'
    }}>
      <h2 style={{ color: 'var(--primary-teal)', marginBottom: '1rem' }}>
        {t('common.examples')} - Translation Examples
      </h2>
      
      <div style={{ display: 'grid', gap: '1rem' }}>
        {/* Navigation translations */}
        <div>
          <h3>Navigation:</h3>
          <ul>
            <li>{t('nav.home')}</li>
            <li>{t('nav.stories')}</li>
            <li>{t('nav.gallery')}</li>
            <li>{t('nav.tours')}</li>
          </ul>
        </div>

        {/* Auth translations */}
        <div>
          <h3>Authentication:</h3>
          <ul>
            <li>{t('auth.login')}</li>
            <li>{t('auth.signup')}</li>
            <li>{t('auth.logout')}</li>
            <li>{t('auth.forgotPassword')}</li>
          </ul>
        </div>

        {/* Common phrases */}
        <div>
          <h3>Common:</h3>
          <ul>
            <li>{t('common.loading')}</li>
            <li>{t('common.save')}</li>
            <li>{t('common.cancel')}</li>
            <li>{t('common.delete')}</li>
          </ul>
        </div>

        {/* Formatting examples */}
        <div>
          <h3>Localized Formatting:</h3>
          <ul>
            <li><strong>Date:</strong> {formatDate(exampleDate)}</li>
            <li><strong>Number:</strong> {formatNumber(exampleNumber)}</li>
            <li><strong>Currency:</strong> {formatCurrency(examplePrice)}</li>
            <li><strong>Current Language:</strong> {currentLanguage}</li>
          </ul>
        </div>

        {/* Interpolation example */}
        <div>
          <h3>Interpolation Example:</h3>
          <p>
            {t('auth.acceptTerms', {
              privacyPolicy: t('auth.privacyPolicy'),
              termsOfService: t('auth.termsOfService')
            })}
          </p>
        </div>
      </div>

      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        background: 'var(--gray-50)',
        borderRadius: 'var(--radius-md)',
        fontSize: '0.9rem',
        color: 'var(--gray-600)'
      }}>
        <strong>How to use translations in your components:</strong>
        <pre style={{ margin: '0.5rem 0', fontSize: '0.8rem' }}>
{`import { useLanguage } from '../contexts/LanguageContext';

const MyComponent = () => {
  const { t } = useLanguage();
  
  return (
    <div>
      <h1>{t('nav.home')}</h1>
      <p>{t('common.loading')}</p>
    </div>
  );
};`}
        </pre>
      </div>
    </div>
  );
};

export default TranslationExample;