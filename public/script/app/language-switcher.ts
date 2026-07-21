import i18next from 'i18next';
import { localizeHtmlElements } from './html-localization';

export function initLanguageSwitcher(): void {
    const deBtnElement = document.getElementById('lang-de-btn');
    const enBtnElement = document.getElementById('lang-en-btn');

    if (!deBtnElement || !enBtnElement) return;

    // Set initial active state based on current language
    updateActiveButton(i18next.language || 'en');

    deBtnElement.addEventListener('click', () => {
        changeLanguage('de');
    });

    enBtnElement.addEventListener('click', () => {
        changeLanguage('en');
    });
}

function changeLanguage(lang: string): void {
    i18next.changeLanguage(lang, () => {
        updateActiveButton(lang);
        localizeHtmlElements();
        window.dispatchEvent(new CustomEvent('app:language-changed', { detail: { language: lang } }));
    });
}

function updateActiveButton(lang: string): void {
    const deBtnElement = document.getElementById('lang-de-btn');
    const enBtnElement = document.getElementById('lang-en-btn');

    if (!deBtnElement || !enBtnElement) return;

    if (lang === 'de') {
        deBtnElement.classList.add('lang-btn--active');
        enBtnElement.classList.remove('lang-btn--active');
    } else {
        enBtnElement.classList.add('lang-btn--active');
        deBtnElement.classList.remove('lang-btn--active');
    }
}
