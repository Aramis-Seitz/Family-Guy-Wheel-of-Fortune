const THEME_STORAGE_KEY = "theme";
const THEME_BUTTON_ID = "theme-toggle-btn";

type Theme = "light" | "dark";

function getStoredTheme(): Theme | null {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : null;
}

function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function saveTheme(theme: Theme): void {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

function getThemeToggleButtons(): NodeListOf<HTMLButtonElement> {
  return document.querySelectorAll<HTMLButtonElement>(".theme-toggle-btn");
}

function ensureThemeToggleButton(): HTMLButtonElement | null {
  const existing = document.querySelector<HTMLButtonElement>(`#${THEME_BUTTON_ID}, .theme-toggle-btn`);
  if (existing) {
    existing.id = THEME_BUTTON_ID;
    return existing;
  }

  const header = document.querySelector<HTMLDivElement>(".app-header__language-switcher") || document.querySelector<HTMLDivElement>(".app-header");
  if (!header) return null;

  const button = document.createElement("button");
  button.id = THEME_BUTTON_ID;
  button.type = "button";
  button.className = "theme-toggle-btn";
  button.setAttribute("aria-label", "Toggle theme");
  header.appendChild(button);
  return button;
}

function updateThemeToggleButton(theme: Theme): void {
  getThemeToggleButtons().forEach((button) => {
    button.textContent = theme === "dark" ? "💥 Light" : "🌙 Dark";
    button.setAttribute("aria-pressed", String(theme === "dark"));
    button.setAttribute(
      "aria-label",
      theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
    );
  });
}

function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
  document.body.setAttribute("data-theme", theme);
  updateThemeToggleButton(theme);
}

function playLightModeSound(): void {
  const audio = new Audio("/resources/sounds/Flashbang - Sound effect (HD).mp3");
  void audio.play().catch(() => {
    // Ignore playback errors, e.g. if the browser blocks autoplay.
  });
}

function getPreferredTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme();
}

export function initTheme(): void {
  const theme = getPreferredTheme();
  ensureThemeToggleButton();
  applyTheme(theme);

  getThemeToggleButtons().forEach((button) => {
    button.addEventListener("click", () => {
      const nextTheme: Theme = document.body.dataset.theme === "dark" ? "light" : "dark";
      if (nextTheme === "light") {
        playLightModeSound();
      }
      applyTheme(nextTheme);
      saveTheme(nextTheme);
    });
  });

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", (event) => {
    if (getStoredTheme()) return;
    applyTheme(event.matches ? "dark" : "light");
  });
}
