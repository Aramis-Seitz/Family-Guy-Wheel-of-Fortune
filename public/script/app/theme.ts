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

function createThemeToggleButton(): HTMLButtonElement | null {
  const existing = document.getElementById(THEME_BUTTON_ID) as HTMLButtonElement | null;
  if (existing) return existing;

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
  const button = document.getElementById(THEME_BUTTON_ID) as HTMLButtonElement | null;
  if (!button) return;
  button.textContent = theme === "dark" ? "☀️ Light" : "🌙 Dark";
  button.setAttribute("aria-pressed", String(theme === "dark"));
  button.setAttribute(
    "aria-label",
    theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
  );
}

function applyTheme(theme: Theme): void {
  document.body.setAttribute("data-theme", theme);
  updateThemeToggleButton(theme);
}

function getPreferredTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme();
}

export function initTheme(): void {
  const theme = getPreferredTheme();
  createThemeToggleButton();
  applyTheme(theme);

  const button = document.getElementById(THEME_BUTTON_ID) as HTMLButtonElement | null;
  if (button) {
    button.addEventListener("click", () => {
      const nextTheme: Theme = document.body.dataset.theme === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
      saveTheme(nextTheme);
    });
  }

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", (event) => {
    if (getStoredTheme()) return;
    applyTheme(event.matches ? "dark" : "light");
  });
}
