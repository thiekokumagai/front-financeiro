import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useInfiniteProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { ProductListTable, ProductListTableFilters } from "@/components/products/ProductListTable";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { PageLoader } from "@/components/common/PageLoader";
import {
  deleteProduct,
  updateProductStock,
  updateProduct,
  duplicateProduct,
} from "@/services/product.service";

const PAGE_SIZE = 100;

export default function ProductsPage() {
  const queryClient = useQueryClient();

  const [searchParams, setSearchParams] = useSearchParams();

  const filters: ProductListTableFilters = {
    search: searchParams.get("search") || "",
    status: (searchParams.get("status") as any) || "active",
    categoryId: searchParams.get("categoryId") || "",
  };

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleFiltersChange = (next: ProductListTableFilters) => {
    const newParams = new URLSearchParams(searchParams);
    
    if (next.search) newParams.set("search", next.search);
    else newParams.delete("search");

    if (next.status && next.status !== "active") newParams.set("status", next.status);
    else newParams.delete("status");

    if (next.categoryId) newParams.set("categoryId", next.categoryId);
    else newParams.delete("categoryId");

    setSearchParams(newParams, { replace: true });
    setSelectedIds([]);
  };

  const productsQuery = useInfiniteProducts({
    limit: PAGE_SIZE,
    search: filters.search || undefined,
    categoryId: filters.categoryId || undefined,
  });
  const categoriesQuery = useCategories();

  const rawProducts = productsQuery.data?.pages.flatMap((p) => p.products || []) ?? [];

  const products =
    filters.status === "all"
      ? rawProducts
      : rawProducts.filter((p) => (p.isVisible ? "active" : "inactive") === filters.status);

  const categories = categoriesQuery.data ?? [];
  const isPageLoading = categoriesQuery.loading;

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, price, promotionalPrice, costPrice }: { id: string; price?: number; promotionalPrice?: number; costPrice?: number }) => {
      await updateProduct(id, { price, promotionalPrice, costPrice });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Preço atualizado com sucesso" });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: error.message || "Erro ao atualizar preço",
      });
    },
  });

  const updateStockMutation = useMutation({
    mutationFn: async ({ productId, type, quantity }: { productId: string; type: 'ADD' | 'SUBTRACT'; quantity: number }) => {
      await updateProductStock(productId, { type, quantity, observation: 'Ajuste rápido' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Estoque atualizado com sucesso" });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: error.message || "Erro ao atualizar estoque",
      });
    },
  });

  const duplicateProductMutation = useMutation({
    mutationFn: async (id: string) => {
      await duplicateProduct(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Produto duplicado com sucesso" });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: error.message || "Erro ao duplicar produto",
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        await deleteProduct(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setSelectedIds([]);
      toast({ title: "Produtos excluídos com sucesso" });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: error.message || "Erro ao excluir produtos",
      });
    },
  });

  const bulkDisableMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const productId of ids) {
        await updateProduct(productId, { isVisible: false });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setSelectedIds([]);
      toast({ title: "Produtos desativados" });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: error.message || "Erro ao desativar produtos",
      });
    },
  });

  const bulkEnableMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const productId of ids) {
        await updateProduct(productId, { isVisible: true });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setSelectedIds([]);
      toast({ title: "Produtos ativados" });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: error.message || "Erro ao ativar produtos",
      });
    },
  });

  const isBulkPending =
    bulkDeleteMutation.isPending ||
    bulkDisableMutation.isPending ||
    bulkEnableMutation.isPending;

  if (isPageLoading && !productsQuery.data) {
    return <PageLoader message="Carregando produtos..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Produtos</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os produtos cadastrados, filtre e aplique ações em massa.
          </p>
        </div>

        <Button asChild className="gap-2">
          <Link to="/produtos/novo">
            <Plus className="h-4 w-4" />
            Novo Produto
          </Link>
        </Button>
      </div>

      <ProductListTable
        products={products}
        categories={categories}
        isLoading={productsQuery.isLoading}
        hasNextPage={productsQuery.hasNextPage ?? false}
        isFetchingNextPage={productsQuery.isFetchingNextPage}
        onLoadMore={() => productsQuery.fetchNextPage()}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onBulkDisable={(ids) => bulkDisableMutation.mutate(ids)}
        onBulkEnable={(ids) => bulkEnableMutation.mutate(ids)}
        onBulkDelete={(ids) => bulkDeleteMutation.mutate(ids)}
        isBulkPending={isBulkPending}
        onUpdateProduct={(id, values) => updateProductMutation.mutateAsync({ id, ...values })}
        onUpdateStock={(productId, type, quantity) => updateStockMutation.mutateAsync({ productId, type, quantity })}
        onDuplicateProduct={(id) => duplicateProductMutation.mutateAsync(id)}
      />
    </div>
  );
}