export interface CategoryTabsOptions<T extends string> {
  cssPrefix: string;
  onSelect: () => void;
  labelFor?: (category: T) => string;
  activeCategory?: T;
}

export function renderCategoryTabs<T extends string>(
  container: HTMLElement,
  categories: T[],
  options: CategoryTabsOptions<T>
): void {
  container.innerHTML = "";
  const activeCategory = options.activeCategory && categories.includes(options.activeCategory)
    ? options.activeCategory
    : categories[0];
  categories.forEach(category => {
    container.appendChild(createCategoryTabButton(container, category, activeCategory, options));
  });
}

function createCategoryTabButton<T extends string>(
  container: HTMLElement,
  category: T,
  activeCategory: T,
  options: CategoryTabsOptions<T>
): HTMLButtonElement {
  const { cssPrefix, onSelect, labelFor } = options;

  const button = document.createElement("button");
  button.className = `${cssPrefix}__tab`;
  button.dataset.category = category;
  button.textContent = labelFor ? labelFor(category) : `${category}s`.toUpperCase();

  if (category === activeCategory) button.classList.add(`${cssPrefix}__tab--active`);

  button.onclick = () => {
    container.querySelectorAll(`.${cssPrefix}__tab`).forEach(btn => btn.classList.remove(`${cssPrefix}__tab--active`));
    button.classList.add(`${cssPrefix}__tab--active`);
    onSelect();
  };
  return button;
}

export function getClickedCategory<T extends string>(target: HTMLElement | null): T | null {
  if (target?.tagName === "BUTTON" && target.dataset.category) {
    return target.dataset.category as T;
  }
  return null;
}

export function getActiveCategory<T extends string>(container: HTMLElement, cssPrefix: string): T | null {
  const activeTab = container.querySelector(`.${cssPrefix}__tab--active`) as HTMLElement | null;
  return getClickedCategory<T>(activeTab);
}
