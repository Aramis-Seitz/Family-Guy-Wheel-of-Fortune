import type { AchievementWithProgress, UnlockedAchievement } from "shared";
import { fetchAchievements } from "./achievement-service";
import { startConfetti } from "../wheel/winner";
import { showToast } from "../shared/toast";
import { t } from "../app/i18n";

function achievementTitle(key: string): string {
    return t(`achievements.${key}.title`, { defaultValue: key });
}

function createAchievementIcon(achievement: AchievementWithProgress): HTMLElement {
    const iconWrapper = document.createElement("div");
    iconWrapper.className = "inventory-modal__achievement-icon";

    if (achievement.icon_url) {
        const img = document.createElement("img");
        img.src = achievement.icon_url;
        img.alt = achievementTitle(achievement.key);
        iconWrapper.appendChild(img);
    } else {
        iconWrapper.textContent = "🏆";
    }

    return iconWrapper;
}

function createAchievementProgressBar(achievement: AchievementWithProgress): HTMLElement {
    const track = document.createElement("div");
    track.className = "inventory-modal__achievement-progress-track";

    const fill = document.createElement("div");
    fill.className = "inventory-modal__achievement-progress-fill";
    const percent = Math.min(100, Math.round((achievement.progress / achievement.target) * 100));
    fill.style.width = `${percent}%`;
    track.appendChild(fill);

    return track;
}

function createAchievementCard(achievement: AchievementWithProgress): HTMLElement {
    const card = document.createElement("div");
    card.className = achievement.unlocked
        ? "inventory-modal__achievement-card inventory-modal__achievement-card--unlocked"
        : "inventory-modal__achievement-card inventory-modal__achievement-card--locked";

    card.appendChild(createAchievementIcon(achievement));

    const body = document.createElement("div");
    body.className = "inventory-modal__achievement-body";

    const title = document.createElement("p");
    title.className = "inventory-modal__achievement-title";
    title.textContent = achievementTitle(achievement.key);
    body.appendChild(title);

    body.appendChild(createAchievementProgressBar(achievement));

    const progressLabel = document.createElement("p");
    progressLabel.className = "inventory-modal__achievement-progress-label";
    progressLabel.textContent = `${Math.min(achievement.progress, achievement.target)}/${achievement.target}`;
    body.appendChild(progressLabel);

    card.appendChild(body);

    if (achievement.unlocked) {
        const badge = document.createElement("span");
        badge.className = "inventory-modal__achievement-badge";
        badge.textContent = "✓";
        card.appendChild(badge);
    }

    return card;
}

export function renderAchievementsTab(container: HTMLElement): void {
    container.innerHTML = "";
    void loadAndRenderAchievements(container);
}

async function loadAndRenderAchievements(container: HTMLElement): Promise<void> {
    try {
        const achievements = await fetchAchievements();
        achievements.forEach(achievement => container.appendChild(createAchievementCard(achievement)));
    } catch (error) {
        console.error("[ACHIEVEMENTS] Fehler beim Laden:", error);
    }
}

// Verhindert doppelte Konfetti für dasselbe Achievement, falls sowohl die
// direkte Spin-Antwort als auch die Realtime-Subscription (main.ts) für
// denselben Unlock feuern.
const celebratedAchievementIds = new Set<string>();

export function showAchievementUnlockConfetti(achievement: UnlockedAchievement): void {
    if (celebratedAchievementIds.has(achievement.id)) return;
    celebratedAchievementIds.add(achievement.id);

    startConfetti();
    showToast({
        message: t("achievements.unlocked", { name: achievementTitle(achievement.key) }),
        type: "success",
    });
}

export function showAchievementToast(achievement: AchievementWithProgress): void {
    showToast({
        message: t("achievements.progressToast", {
            name: achievementTitle(achievement.key),
            progress: achievement.progress,
            target: achievement.target,
        }),
        type: "info",
    });
}
