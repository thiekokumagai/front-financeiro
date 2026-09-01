export type ProductListParams = {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
};

export type ProductListMeta = {
  page: number;
  limit: number;
  hasNextPage: boolean;
  totalPages?: number;
};

export type Category = {
  id: string;
  title: string;
};

export type ProductResponse = {
  id: string;
  title: string;
  categoryId: string;
  category?: Category;
  price?: number;
  costPrice?: number;
  stock: number;
  isVisible?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateProductPayload = {
  title: string;
  categoryId: string;
  price?: number;
  costPrice?: number;
  stock?: number;
  isVisible?: boolean;
};

export type UpdateProductStockPayload = {
  type: 'ADD' | 'SUBTRACT' | 'SET';
  quantity: number;
  observation?: string;
};

export type StockMovement = {
  id: string;
  type: 'ADD' | 'SUBTRACT' | 'SET';
  quantity: number;
  previousStock: number;
  newStock: number;
  observation?: string | null;
  createdAt: string;
};