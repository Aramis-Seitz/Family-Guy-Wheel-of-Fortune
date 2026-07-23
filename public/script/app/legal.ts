import { localizeHtmlElements } from "./html-localization";
import { initI18n } from "./i18n";
import { initLanguageSwitcher } from "./language-switcher";

async function initLegalPage(): Promise<void> {
    await initI18n();
    localizeHtmlElements();
    initLanguageSwitcher();
}

void initLegalPage();