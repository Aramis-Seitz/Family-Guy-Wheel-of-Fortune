import i18next, { type TOptions } from "i18next";
import HttpBackend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

const SUPPORTED_LANGUAGES = ["de", "en"] as const;

let initialization: Promise<void> | null = null;

export function t(key: string, options?: TOptions): string {
    return i18next.t(key, options) as string;
}

export function getLanguage(): "de" | "en" {
    return i18next.resolvedLanguage === "de" ? "de" : "en";
}

export function initI18n(): Promise<void> {
    if (initialization) return initialization;

    if (i18next.isInitialized) {
        initialization = Promise.resolve();
        return initialization;
    }

    initialization = i18next
        .use(HttpBackend)
        .use(LanguageDetector)
        .init({
            fallbackLng: "en",
            supportedLngs: SUPPORTED_LANGUAGES,
            load: "languageOnly",
            ns: ["common"],
            defaultNS: "common",
            backend: {
                loadPath: "/locales/{{lng}}/{{ns}}.json",
            },
            detection: {
                order: ["localStorage", "navigator"],
                caches: ["localStorage"],
            },
            interpolation: {
                escapeValue: false,
            },
        })
        .then(() => undefined);

    return initialization;
}

export default i18next;