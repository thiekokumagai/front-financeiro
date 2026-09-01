import { apiFetch } from "@/services/api";
import type {
  CreateProductPayload,
  ProductListMeta,
  ProductListParams,
  ProductResponse,
  StockMovement,
  UpdateProductStockPayload,
} from "@/types/product";

type ProductApiResponse = {
  id: string;
  title: string;
  categoryId: string;
  category?: {
    id: string;
    title: string;
  };
  price?: string | number | null;
  promotionalPrice?: string | number | null;
  costPrice?: string | number | null;
  stock?: number;
  isVisible?: boolean;
  isBestSeller?: boolean;
  createdAt: string;
  updatedAt: string;
};

function normalizeProduct(item: ProductApiResponse): ProductResponse {
  return {
    id: item.id,
    title: item.title,
    categoryId: item.categoryId,
    category: item.category,
    price: item.price ? Number(item.price) : undefined,
    promotionalPrice: item.promotionalPrice ? Number(item.promotionalPrice) : undefined,
    costPrice: item.costPrice ? Number(item.costPrice) : undefined,
    stock: item.stock ?? 0,
    isVisible: item.isVisible ?? true,
    isBestSeller: item.isBestSeller ?? false,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export async function getProducts(
  params?: ProductListParams,
): Promise<{ products: ProductResponse[]; meta: ProductListMeta }> {
  const limit = params?.limit ?? 30;
  const page = params?.page ?? 1;
  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  if (params?.search) qs.set("search", params.search);
  if (params?.categoryId) qs.set("categoryId", params.categoryId);

  const response = await apiFetch(`/products?${qs.toString()}`);
  
  const totalCountHeader = response.headers.get('x-total-count');
  const totalCount = totalCountHeader ? parseInt(totalCountHeader, 10) : 0;
  const totalPages = totalCount > 0 ? Math.ceil(totalCount / limit) : undefined;
  
  const data = (await response.json()) as ProductApiResponse[];
  const products = data.map(normalizeProduct);
  
  return {
    products,
    meta: { 
      page, 
      limit, 
      hasNextPage: totalPages !== undefined ? page < totalPages : products.length === limit,
      totalPages 
    },
  };
}

export async function createProduct(payload: CreateProductPayload): Promise<ProductResponse> {
  const response = await apiFetch("/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as ProductApiResponse;
  return normalizeProduct(data);
}

export async function getProductById(id: string): Promise<ProductResponse> {
  const response = await apiFetch(`/products/${id}`);
  const data = (await response.json()) as ProductApiResponse;
  return normalizeProduct(data);
}

export async function updateProduct(
  id: string,
  payload: Partial<CreateProductPayload>
): Promise<ProductResponse> {
  const response = await apiFetch(`/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as ProductApiResponse;
  return normalizeProduct(data);
}

export async function deleteProduct(id: string): Promise<void> {
  await apiFetch(`/products/${id}`, {
    method: "DELETE",
  });
}

export async function updateProductStock(
  productId: string,
  payload: UpdateProductStockPayload
): Promise<ProductResponse> {
  const response = await apiFetch(`/products/${productId}/stock`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as ProductApiResponse;
  return normalizeProduct(data);
}

export async function getProductStockHistory(productId: string): Promise<StockMovement[]> {
  const response = await apiFetch(`/products/${productId}/stock-history`);
  return await response.json();
}

export async function duplicateProduct(id: string): Promise<ProductResponse> {
  const response = await apiFetch(`/products/${id}/duplicate`, {
    method: "POST",
  });

  const data = (await response.json()) as ProductApiResponse;
  return normalizeProduct(data);
}