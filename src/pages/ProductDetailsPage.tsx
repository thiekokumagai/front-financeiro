import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import {
  createProduct,
  getProductById,
  updateProduct,
  updateProductStock,
  getProductStockHistory,
} from "@/services/product.service";
import { PageLoader } from "@/components/common/PageLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import type { StockMovement } from "@/types/product";

const productSchema = z.object({
  title: z.string().min(1, "Informe o nome do produto."),
  categoryId: z.string().min(1, "Selecione uma categoria."),
  price: z.preprocess((val) => (val === "" || val === undefined ? undefined : Number(val)), z.number().min(0, "O preço deve ser maior ou igual a zero.").optional()),
  costPrice: z.preprocess((val) => (val === "" || val === undefined ? undefined : Number(val)), z.number().min(0, "O preço de custo deve ser maior ou igual a zero.").optional()),
  stock: z.preprocess((val) => (val === "" || val === undefined ? 0 : Number(val)), z.number().min(0, "O estoque deve ser maior ou igual a zero.")),
});

type FormValues = z.infer<typeof productSchema>;

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNewProduct = id === "novo";

  const categoriesQuery = useCategories();
  const categories = categoriesQuery.data ?? [];

  const [isVisible, setIsVisible] = useState(true);
  const [stockAdjQuantity, setStockAdjQuantity] = useState("");
  const [stockAdjType, setStockAdjType] = useState<"ADD" | "SUBTRACT" | "SET">("ADD");
  const [stockAdjObs, setStockAdjObs] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: "",
      categoryId: "",
      price: undefined,
      costPrice: undefined,
      stock: 0,
    },
  });

  const { data: product, isLoading: loadingProduct } = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProductById(id!),
    enabled: !isNewProduct && !!id,
  });

  const { data: stockHistory = [] } = useQuery<StockMovement[]>({
    queryKey: ["product-stock-history", id],
    queryFn: () => getProductStockHistory(id!),
    enabled: !isNewProduct && !!id,
  });

  useEffect(() => {
    if (product) {
      form.reset({
        title: product.title,
        categoryId: product.categoryId,
        price: product.price,
        costPrice: product.costPrice,
        stock: product.stock,
      });
      setIsVisible(product.isVisible ?? true);
    }
  }, [product, form]);

  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        title: values.title,
        categoryId: values.categoryId,
        price: values.price,
        costPrice: values.costPrice,
        stock: values.stock,
        isVisible,
      };

      if (isNewProduct) {
        return await createProduct(payload);
      } else {
        return await updateProduct(id!, payload);
      }
    },
    onSuccess: (savedProduct) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", savedProduct.id] });
      toast({ title: isNewProduct ? "Produto criado com sucesso!" : "Produto atualizado com sucesso!" });
      if (isNewProduct) {
        navigate(`/produtos/${savedProduct.id}`, { replace: true });
      }
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: error.message || "Erro ao salvar produto",
      });
    },
  });

  const stockMutation = useMutation({
    mutationFn: async () => {
      const qty = Number(stockAdjQuantity);
      if (isNaN(qty) || qty < 0) {
        throw new Error("Informe uma quantidade válida.");
      }
      return await updateProductStock(id!, {
        type: stockAdjType,
        quantity: qty,
        observation: stockAdjObs || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", id] });
      queryClient.invalidateQueries({ queryKey: ["product-stock-history", id] });
      setStockAdjQuantity("");
      setStockAdjObs("");
      toast({ title: "Estoque ajustado com sucesso!" });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: error.message || "Erro ao ajustar estoque",
      });
    },
  });

  if (!isNewProduct && loadingProduct) {
    return <PageLoader message="Carregando produto..." />;
  }

  return (
    <div className="space-y-6 w-full max-w-none pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild>
            <Link to="/produtos">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isNewProduct ? "Novo Produto" : product?.title || "Editar Produto"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isNewProduct
                ? "Cadastre as informações básicas do produto."
                : "Atualize os dados e o estoque do produto."}
            </p>
          </div>
        </div>

        
      </div>

      <form onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Produto</CardTitle>
            <CardDescription>Preencha os campos abaixo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="title">Nome do Produto *</Label>
                <Input id="title" placeholder="Ex: Produto X" {...form.register("title")} />
                {form.formState.errors.title && (
                  <p className="text-sm font-medium text-destructive">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="categoryId">Categoria *</Label>
                <Select
                  value={form.watch("categoryId")}
                  onValueChange={(val) => form.setValue("categoryId", val)}
                >
                  <SelectTrigger id="categoryId">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.categoryId && (
                  <p className="text-sm font-medium text-destructive">
                    {form.formState.errors.categoryId.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Preço de Venda (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  {...form.register("price")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="costPrice">Preço de Custo (R$)</Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  {...form.register("costPrice")}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t">
              <div className="flex items-center space-x-2">
                <Switch id="isVisible" checked={isVisible} onCheckedChange={setIsVisible} />
                <Label htmlFor="isVisible">Visível no catálogo</Label>
              </div>
            </div>
            <div className="flex justify-end pt-2">
            <Button
              onClick={form.handleSubmit((v) => saveMutation.mutate(v))}
              disabled={saveMutation.isPending}
              className="gap-2"
            >
                
              <Save className="h-4 w-4" />
              {saveMutation.isPending ? "Salvando..." : "Salvar Produto"}
            </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {!isNewProduct && (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Ajuste Rápido de Estoque</CardTitle>
              <CardDescription>
                Estoque Atual: <span className="font-bold text-foreground">{product?.stock ?? 0}</span>
              </CardDescription>
            </div>

            
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="w-full sm:w-40 space-y-2">
                <Label>Ação</Label>
                <Select
                  value={stockAdjType}
                  onValueChange={(v: "ADD" | "SUBTRACT" | "SET") => setStockAdjType(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADD">Adicionar (+)</SelectItem>
                    <SelectItem value="SUBTRACT">Remover (-)</SelectItem>
                    <SelectItem value="SET">Definir (=)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full sm:w-40 space-y-2">
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={stockAdjQuantity}
                  onChange={(e) => setStockAdjQuantity(e.target.value)}
                />
              </div>

              <div className="flex-1 space-y-2">
                <Label>Observação (Opcional)</Label>
                <Input
                  placeholder="Ex: Contagem física"
                  value={stockAdjObs}
                  onChange={(e) => setStockAdjObs(e.target.value)}
                />
              </div>

              <Button
                onClick={() => stockMutation.mutate()}
                disabled={stockMutation.isPending || !stockAdjQuantity}
              >
                {stockMutation.isPending ? "Ajustando..." : "Aplicar Ajuste"}
              </Button>
            </div>

            {stockHistory.length > 0 && (
              <div className="pt-4 border-t space-y-3">
                <h4 className="font-semibold text-sm">Histórico de Movimentações</h4>
                <div className="max-h-48 overflow-y-auto space-y-2 text-sm">
                  {stockHistory.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-xs sm:text-sm"
                    >
                      <div>
                        <span className="font-medium">
                          {h.type === "ADD" && `+${h.quantity} unidades`}
                          {h.type === "SUBTRACT" && `-${h.quantity} unidades`}
                          {h.type === "SET" && `Estoque alterado para ${h.newStock}`}
                        </span>
                        {h.observation && (
                          <span className="text-muted-foreground ml-2">
                            ({h.observation})
                          </span>
                        )}
                      </div>
                      <div className="text-muted-foreground">
                        {new Date(h.createdAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
