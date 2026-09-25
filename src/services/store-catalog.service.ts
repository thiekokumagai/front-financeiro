import { apiFetch } from "./api";
import { Product } from "@/types/product";
import { Category } from "@/types/category";

export interface PublicStoreSettings {
  storeName: string;
  phone?: string;
  logoUrl?: string;
  whiteLogoUrl?: string;
  topHeaderText?: string;
  instagram?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

const SETTINGS_CACHE_KEY = "catalog_cache_settings";
const CATEGORIES_CACHE_KEY = "catalog_cache_categories";
const PRODUCTS_CACHE_KEY = "catalog_cache_products";

export function getCachedStoreCatalog() {
  try {
    const settingsStr = localStorage.getItem(SETTINGS_CACHE_KEY);
    const categoriesStr = localStorage.getItem(CATEGORIES_CACHE_KEY);
    const productsStr = localStorage.getItem(PRODUCTS_CACHE_KEY);

    return {
      settings: settingsStr ? (JSON.parse(settingsStr) as PublicStoreSettings) : null,
      categories: categoriesStr ? (JSON.parse(categoriesStr) as Category[]) : [],
      products: productsStr ? (JSON.parse(productsStr) as Product[]) : [],
    };
  } catch {
    return { settings: null, categories: [], products: [] };
  }
}

export async function getPublicStoreSettings(forceFresh = false): Promise<PublicStoreSettings> {
  const url = forceFresh ? `/store/settings?_t=${Date.now()}` : "/store/settings";
  const response = await apiFetch(url);
  const data = await response.json();
  try {
    localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(data));
  } catch {}
  return data;
}

export async function getPublicStoreCategories(forceFresh = false): Promise<Category[]> {
  const url = forceFresh ? `/store/categories?_t=${Date.now()}` : "/store/categories";
  const response = await apiFetch(url);
  const data = await response.json();
  try {
    localStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify(data));
  } catch {}
  return data;
}

export async function getPublicStoreProducts(forceFresh = false): Promise<Product[]> {
  const url = forceFresh
    ? `/store/products?limit=1000&_t=${Date.now()}`
    : "/store/products?limit=1000";
  const response = await apiFetch(url);
  const raw = await response.json();
  const data = raw.data || raw;
  try {
    localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(data));
  } catch {}
  return data;
}
