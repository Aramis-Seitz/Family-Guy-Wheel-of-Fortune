import { t } from './i18n';

export function localizeHtmlElements(): void {
    document.documentElement.lang = t('html.languageCode');

    const dataHtmlElements = document.querySelectorAll<HTMLElement>('[data-i18n-html]');
    dataHtmlElements.forEach((element) => {
        const key = element.dataset.i18nHtml;
        if (key) {
            // Translation resources are maintained locally and may contain required legal-page markup.
            element.innerHTML = t(key);
        }
    });

    const dataTextElements = document.querySelectorAll<HTMLElement>('[data-i18n]');
    dataTextElements.forEach((element) => {
        const key = element.dataset.i18n;
        if (key) {
            element.textContent = t(key);
        }
    });

    const dataPlaceholderElements = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-i18n-placeholder]');
    dataPlaceholderElements.forEach((element) => {
        const key = element.dataset.i18nPlaceholder;
        if (key) {
            element.placeholder = t(key);
        }
    });

    const dataTitleElements = document.querySelectorAll<HTMLElement>('[data-i18n-title]');
    dataTitleElements.forEach((element) => {
        const key = element.dataset.i18nTitle;
        if (key) {
            element.setAttribute('title', t(key));
        }
    });

    document.querySelectorAll<HTMLVideoElement>('[data-i18n-video-fallback]').forEach((video) => {
        const key = video.dataset.i18nVideoFallback;
        if (!key) return;
        [...video.childNodes]
            .filter((node) => node.nodeType === Node.TEXT_NODE)
            .forEach((node) => node.remove());
        video.appendChild(document.createTextNode(`\n                ${t(key)}\n            `));
    });

    const elementMap: Record<string, string> = {
        'spin-left-btn': 'html.spinLeft',
        'spin-right-btn': 'html.spinRight',
        'reset-btn': 'html.reset',
        'share-names-in-wheel-list-btn': 'html.share',
        'inventory-btn': 'html.inventory',
        'shop-btn': 'html.shop',
        'room-create-btn': 'html.createRoom',
        'room-join-btn': 'html.join',
        'room-leave-btn': 'html.leave',
        'winner-modal-close-btn': 'html.ok',
        'winner-modal-remove-btn': 'html.remove',
        'add-item-modal-cancel-btn': 'html.cancel',
        'add-item-modal-confirm-btn': 'html.add',
        'confirm-delete-modal-cancel-btn': 'html.cancel',
        'confirm-delete-modal-confirm-btn': 'html.delete',
        'leave-room-confirm-cancel-btn': 'html.cancel',
        'leave-room-confirm-confirm-btn': 'html.confirm',
        'inventory-modal-close-btn': 'html.close',
        'shop-modal-close-btn': 'html.close',
        'chat-toggle-btn': 'html.chatToggle',
        'room-key-label': 'html.roomCodeLabel',
        'inventory-modal-title': 'html.inventory',
        'shop-modal-title': 'html.shop',
        'add-item-modal-title': 'html.addItem',
        'confirm-delete-modal-title': 'html.deleteItem',
        'leave-room-confirm-title': 'html.closeRoom',
        'room-panel-title': 'html.multiplayer',
        'chat-label': 'html.chat',
        'winner-modal-title': 'html.winner',
        'wheel-empty-hint': 'html.wheelEmpty',
        'volume-label': 'html.volume',
        'power-label': 'html.power',
        'back-to-app-link': 'html.backToApp',
    };

    Object.entries(elementMap).forEach(([elementId, translationKey]) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = t(translationKey);
        }
    });

    const placeholderMap: Record<string, string> = {
        'room-key-input': 'html.roomCode',
        'chat-input': 'html.enterMessage',
        'name-input': 'html.enterName',
        'name-input-centered': 'html.enterName',
        'add-item-input': 'html.addItemExample',
        'login-email': 'html.email',
        'login-password': 'html.password',
        'signup-user': 'html.username',
        'signup-email': 'html.email',
        'signup-date-of-birth': 'html.dob',
        'signup-password': 'html.password',
        'signup-confirm-password': 'html.confirmPassword',
    };

    Object.entries(placeholderMap).forEach(([elementId, translationKey]) => {
        const element = document.getElementById(elementId) as HTMLInputElement | HTMLTextAreaElement | null;
        if (element) {
            element.placeholder = t(translationKey);
        }
    });

    const titleMap: Record<string, string> = {
        'volume-icon': 'html.mute',
        'room-copy-key-btn': 'html.copyCode',
    };

    Object.entries(titleMap).forEach(([elementId, translationKey]) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.setAttribute('title', t(translationKey));
        }
    });

    const headingMap: Record<string, string> = {
        'name-error-hint': 'html.atLeast2',
        'name-empty-hint': 'html.noNames',
        'winner-modal-text': 'html.winnerPlaceholder',
    };

    Object.entries(headingMap).forEach(([elementId, translationKey]) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = t(translationKey);
        }
    });

    const impressumLinks = document.querySelectorAll('a[href="imprint.html"], a[href="/imprint.html"]');
    impressumLinks.forEach((link) => {
        link.textContent = t('html.imprint');
    });

    const privacyLinks = document.querySelectorAll('a[href="privacy.html"], a[href="/privacy.html"]');
    privacyLinks.forEach((link) => {
        link.textContent = t('html.privacy');
    });
}

