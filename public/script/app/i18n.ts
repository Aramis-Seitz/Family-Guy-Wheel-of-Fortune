import i18next from 'i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

export const t = (key: string, opts?: any) => i18next.t(key, opts) as string;

export async function initI18n(): Promise<void> {
    if (typeof window === 'undefined') return;

    await i18next
        .use(HttpBackend)
        .use(LanguageDetector)
        .init({
            fallbackLng: 'en',
            supportedLngs: ['en', 'de'],
            ns: ['common'],
            defaultNS: 'common',
            backend: {
                loadPath: '/locales/{{lng}}/{{ns}}.json'
            },
            detection: {
                order: ['localStorage', 'querystring', 'navigator', 'cookie'],
                caches: ['localStorage']
            },
            interpolation: { escapeValue: false }
        });

    // Export i18next to window for global access
    (window as any).i18next = i18next;
    (window as any).t = t;
}
