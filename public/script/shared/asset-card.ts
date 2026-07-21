import type { Asset } from "shared";
import { resolveAssetImageSrc, createPreviewButton } from "./asset-preview";

export interface AssetCardOptions {
  cssPrefix: string;
  cardStateClasses?: string[];
  renderActionButton: () => HTMLElement;
}

export function createAssetCard(asset: Asset, options: AssetCardOptions): HTMLElement {
  const card = document.createElement("div");
  card.className = `${options.cssPrefix}__asset-card`;
  options.cardStateClasses?.forEach(cls => card.classList.add(cls));

  card.appendChild(createAssetHeader(asset, options.cssPrefix));
  card.appendChild(createAssetFooter(asset, options));

  return card;
}

function createAssetHeader(asset: Asset, cssPrefix: string): HTMLElement {
  const header = document.createElement("div");
  header.className = `${cssPrefix}__asset-header`;
  header.appendChild(createAssetIcon(asset, cssPrefix));
  return header;
}

function createAssetIcon(asset: Asset, cssPrefix: string): HTMLElement {
  const img = document.createElement("img");
  img.className = `${cssPrefix}__asset-icon`;
  img.src = resolveAssetImageSrc(asset);
  img.alt = asset.name;
  return img;
}

function createAssetFooter(asset: Asset, options: AssetCardOptions): HTMLElement {
  const footer = document.createElement("div");
  footer.className = `${options.cssPrefix}__asset-footer`;
  footer.appendChild(createAssetDetailsRow(asset, options.cssPrefix));
  footer.appendChild(options.renderActionButton());
  return footer;
}

function createAssetDetailsRow(asset: Asset, cssPrefix: string): HTMLElement {
  const row = document.createElement("div");
  row.className = `${cssPrefix}__asset-details-row`;
  row.appendChild(createAssetTitle(asset, cssPrefix));

  if (asset.category === "sound") {
    row.appendChild(createPreviewButton(asset, `${cssPrefix}__preview-btn`));
  }

  return row;
}

function createAssetTitle(asset: Asset, cssPrefix: string): HTMLElement {
  const title = document.createElement("p");
  title.className = `${cssPrefix}__asset-title`;
  title.textContent = asset.name;
  return title;
}
