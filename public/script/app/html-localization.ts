import { getLanguage, t } from "./i18n";

function translateAttribute(selector: string, dataKey: string, attribute: string): void {
    document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
        const key = element.dataset[dataKey];
        if (key) element.setAttribute(attribute, t(key));
    });
}

export function localizeHtmlElements(): void {
    document.documentElement.lang = getLanguage();

    document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((element) => {
        const key = element.dataset.i18n;
        if (key) element.textContent = t(key);
    });

    document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("[data-i18n-placeholder]").forEach((element) => {
        const key = element.dataset.i18nPlaceholder;
        if (key) element.placeholder = t(key);
    });

    translateAttribute("[data-i18n-title]", "i18nTitle", "title");
    translateAttribute("[data-i18n-aria-label]", "i18nAriaLabel", "aria-label");
    translateAttribute("[data-i18n-alt]", "i18nAlt", "alt");

    document.querySelectorAll<HTMLVideoElement>("[data-i18n-video-fallback]").forEach((video) => {
        const key = video.dataset.i18nVideoFallback;
        if (!key) return;
        [...video.childNodes]
            .filter((node) => node.nodeType === Node.TEXT_NODE)
            .forEach((node) => node.remove());
        video.appendChild(document.createTextNode(t(key)));
    });
}