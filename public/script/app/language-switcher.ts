import i18next, { getLanguage } from "./i18n";
import { localizeHtmlElements } from "./html-localization";

let initialized = false;

function updateActiveButton(): void {
    const language = getLanguage();
    document.querySelectorAll<HTMLButtonElement>("[data-language]").forEach((button) => {
        const active = button.dataset.language === language;
        button.classList.toggle("lang-btn--active", active);
        button.setAttribute("aria-pressed", String(active));
    });
}

export function initLanguageSwitcher(): void {
    if (initialized) return;
    initialized = true;

    document.querySelectorAll<HTMLButtonElement>("[data-language]").forEach((button) => {
        button.addEventListener("click", () => {
            const language = button.dataset.language;
            if (language !== "de" && language !== "en") return;
            void i18next.changeLanguage(language);
        });
    });

    i18next.on("languageChanged", () => {
        localizeHtmlElements();
        updateActiveButton();
        window.dispatchEvent(new CustomEvent("app:language-changed", {
            detail: { language: getLanguage() },
        }));
    });

    updateActiveButton();
}