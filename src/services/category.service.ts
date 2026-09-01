import { apiFetch } from "./api";
import type { CategoryList,CreateCategoryDTO, UpdateCategoryDTO } from "@/types/category";


export async function getCategories(): Promise<CategoryList[]> {
  const response = await apiFetch("/categories");
  return response.json();
}

export async function createCategory(
  form: CreateCategoryDTO
): Promise<void> {
  const payload = {
    title: form.title.trim(),
    isVisible: form.isVisible ?? true,
    excludeFromBestSeller: form.excludeFromBestSeller ?? false,
  };

  await apiFetch("/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateCategory(
  id: string,
  form: UpdateCategoryDTO
): Promise<void> {
  const payload = {
    ...(form.title ? { title: form.title.trim() } : {}),
    ...(form.isVisible !== undefined ? { isVisible: form.isVisible } : {}),
    ...(form.excludeFromBestSeller !== undefined ? { excludeFromBestSeller: form.excludeFromBestSeller } : {}),
  };

  await apiFetch(`/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
export async function deleteCategory(id: string): Promise<void> {
  await apiFetch(`/categories/${id}`, {
    method: "DELETE",
  });
}
export async function updateCategoryOrderBatch(
  items: { id: string; order: number }[]
) {
  const response = await apiFetch("/categories/batch/order", {
    method: "PATCH",
    body: JSON.stringify({ items }),
  });

  return response.json();
}