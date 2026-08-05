const MIN_VISIBLE_MS = 3000;
const HIDDEN_CLASS = "loading-screen--hidden";

export function showLoadingScreenFor<T>(task: Promise<T>): Promise<T> {
  const el = document.getElementById("loading-screen");
  const start = performance.now();

  return task.finally(() => {
    if (!el) return;
    const remaining = Math.max(0, MIN_VISIBLE_MS - (performance.now() - start));
    window.setTimeout(() => {
      el.classList.add(HIDDEN_CLASS);
      el.addEventListener("transitionend", () => el.remove(), { once: true });
    }, remaining);
  });
}
