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

export async function getPublicStoreSettings(): Promise<PublicStoreSettings> {
  const response = await apiFetch("/store/settings");
  return response.json();
}

export async function getPublicStoreCategories(): Promise<Category[]> {
  const response = await apiFetch("/store/categories");
  return response.json();
}

export async function getPublicStoreProducts(): Promise<Product[]> {
  const response = await apiFetch("/store/products");
  const data = await response.json();
  return data.data || data;
}
