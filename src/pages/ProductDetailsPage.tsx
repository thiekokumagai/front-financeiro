import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, History, Clock } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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

  const { data: product, isLoading: loadingProduct } = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProductById(id!),
    enabled: !isNewProduct && !!id,
  });

  const categoryOptions = useMemo(() => {
    const list = [...categories];
    if (product?.category && !list.some((c) => c.id === product.category?.id)) {
      list.unshift(product.category);
    }
    return list;
  }, [categories, product]);

  const [isVisible, setIsVisible] = useState(true);
  const [stockAdjQuantity, setStockAdjQuantity] = useState("");
  const [stockAdjType, setStockAdjType] = useState<"ADD" | "SUBTRACT" | "SET">("ADD");
  const [stockAdjObs, setStockAdjObs] = useState("");
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

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

  const { data: stockHistory = [] } = useQuery<StockMovement[]>({
    queryKey: ["product-stock-history", id],
    queryFn: () => getProductStockHistory(id!),
    enabled: !isNewProduct && !!id,
  });

  useEffect(() => {
    if (product) {
      const catId = product.categoryId || product.category?.id || "";
      form.setValue("title", product.title);
      form.setValue("categoryId", catId);
      form.setValue("price", product.price);
      form.setValue("costPrice", product.costPrice);
      form.setValue("stock", product.stock);
      form.reset({
        title: product.title,
        categoryId: catId,
        price: product.price,
        costPrice: product.costPrice,
        stock: product.stock,
      });
      setIsVisible(product.isVisible ?? true);
    }
  }, [product, categoryOptions, form]);

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
      queryClient.invalidateQueries({ queryKey: ["products"] });
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

  const currentStock = product?.stock ?? form.watch("stock") ?? 0;

  const predictedStock = useMemo(() => {
    const qty = Number(stockAdjQuantity) || 0;
    if (stockAdjType === "ADD") return currentStock + qty;
    if (stockAdjType === "SUBTRACT") return Math.max(0, currentStock - qty);
    if (stockAdjType === "SET") return qty;
    return currentStock;
  }, [currentStock, stockAdjQuantity, stockAdjType]);

  const isSaving = saveMutation.isPending || stockMutation.isPending;

  if (!isNewProduct && loadingProduct) {
    return <PageLoader message="Carregando produto..." />;
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Top Header Card (Exatamente igual da Pod e Mais) */}
      <div className="flex flex-col gap-4 rounded-3xl border bg-card p-6 sm:flex-row sm:items-center sm:justify-between shadow-sm">
        <div className="space-y-1">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="-ml-3 w-fit hover:bg-transparent flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar para produtos</span>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            {isNewProduct ? "Novo produto" : product?.title ?? "Editar produto"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie dados básicos e estoque em um só lugar.
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center space-x-2">
            <Switch
              id="product-active"
              checked={isVisible}
              onCheckedChange={setIsVisible}
            />
            <Label htmlFor="product-active" className="cursor-pointer font-semibold">
              {isVisible ? "Ativo" : "Inativo"}
            </Label>
          </div>

          <Button
            type="button"
            className="h-12 rounded-2xl px-8 font-semibold shadow-lg transition-all hover:scale-[1.02]"
            disabled={isSaving}
            onClick={form.handleSubmit((v) => saveMutation.mutate(v))}
          >
            <Save className="mr-2 h-4 w-4" />
            {saveMutation.isPending ? "Salvando..." : "Salvar tudo"}
          </Button>
        </div>
      </div>

      {/* Tabs Navigation (Exatamente igual da Pod e Mais) */}
      <Tabs defaultValue="produto" className="w-full">
        <TabsList className="mb-8 border-b rounded-none w-full justify-start bg-transparent h-auto p-0 gap-6">
          <TabsTrigger
            value="produto"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none bg-transparent pb-3 pt-2 px-1 text-base font-semibold data-[state=active]:bg-transparent"
          >
            Produto
          </TabsTrigger>
          {!isNewProduct && (
            <TabsTrigger
              value="estoque"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none bg-transparent pb-3 pt-2 px-1 text-base font-semibold data-[state=active]:bg-transparent"
            >
              Estoque
            </TabsTrigger>
          )}
        </TabsList>

        {/* TAB 1: PRODUTO */}
        <TabsContent value="produto" className="space-y-8 outline-none">
          <Card className="rounded-3xl border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="title" className="text-sm font-medium">Nome do produto *</Label>
                  <Input inputMode="decimal"
                    id="title"
                    placeholder="Ex: Produto X"
                    className="h-10 rounded-xl"
                    {...form.register("title")}
                  />
                  {form.formState.errors.title && (
                    <p className="text-sm font-medium text-destructive">
                      {form.formState.errors.title.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="categoryId" className="text-sm font-medium">Categoria *</Label>
                  <Controller
                    name="categoryId"
                    control={form.control}
                    render={({ field }) => (
                      <Select
                        key={field.value ? `cat-${field.value}-${categoryOptions.length}` : 'no-cat'}
                        value={field.value || ""}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger id="categoryId" className="h-10 rounded-xl">
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryOptions.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {form.formState.errors.categoryId && (
                    <p className="text-sm font-medium text-destructive">
                      {form.formState.errors.categoryId.message}
                    </p>
                  )}
                </div>

                <Controller
                  name="price"
                  control={form.control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-sm font-medium">Preço de venda (R$)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">R$</span>
                        <Input inputMode="decimal"
                          id="price"
                          type="text"
                          placeholder="0,00"
                          value={
                            field.value !== undefined && field.value !== null && field.value !== "" && !isNaN(Number(field.value))
                              ? new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(field.value))
                              : ""
                          }
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "");
                            field.onChange(digits ? Number(digits) / 100 : undefined);
                          }}
                          className="pl-9 h-10 rounded-xl"
                        />
                      </div>
                    </div>
                  )}
                />

                <Controller
                  name="costPrice"
                  control={form.control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label htmlFor="costPrice" className="text-sm font-medium">Preço de custo (R$)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">R$</span>
                        <Input inputMode="decimal"
                          id="costPrice"
                          type="text"
                          placeholder="0,00"
                          value={
                            field.value !== undefined && field.value !== null && field.value !== "" && !isNaN(Number(field.value))
                              ? new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(field.value))
                              : ""
                          }
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "");
                            field.onChange(digits ? Number(digits) / 100 : undefined);
                          }}
                          className="pl-9 h-10 rounded-xl"
                        />
                      </div>
                    </div>
                  )}
                />
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button
                  type="button"
                  disabled={saveMutation.isPending}
                  onClick={form.handleSubmit((v) => saveMutation.mutate(v))}
                  className="h-11 rounded-xl px-6 font-semibold"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saveMutation.isPending ? "Salvando..." : "Salvar produto"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: ESTOQUE (Exatamente igual da Pod e Mais) */}
        {!isNewProduct && (
          <TabsContent value="estoque" className="space-y-8 outline-none">
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Gerenciar Estoque Direto</h3>

              <Card className="rounded-3xl border bg-card shadow-sm">
                <CardHeader className="space-y-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Estoque</CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsHistoryModalOpen(true)}
                      className="rounded-xl flex items-center gap-1.5"
                    >
                      <History className="h-4 w-4" />
                      Histórico
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={stockAdjType === "ADD" ? "default" : "outline"}
                      onClick={() => setStockAdjType("ADD")}
                      className="rounded-xl"
                    >
                      Somar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={stockAdjType === "SUBTRACT" ? "default" : "outline"}
                      onClick={() => setStockAdjType("SUBTRACT")}
                      className="rounded-xl"
                    >
                      Subtrair
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={stockAdjType === "SET" ? "default" : "outline"}
                      onClick={() => setStockAdjType("SET")}
                      className="rounded-xl"
                    >
                      Substituir
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="space-y-4 rounded-2xl bg-card p-4">
                    <div>
                      <p className="font-medium">Estoque do produto</p>
                      <p className="text-sm text-muted-foreground">
                        Como este produto não possui variações, o estoque será salvo diretamente no item padrão.
                      </p>
                    </div>

                    <div className="flex flex-col gap-4 md:flex-row md:items-end">
                      <div className="w-full md:w-40 space-y-2">
                        <p className="text-sm font-medium">Quantidade</p>
                        <div className="flex items-center gap-2 pb-2">
                          <span className="text-sm text-muted-foreground">Atual:</span>
                          <span className="inline-flex items-center justify-center min-w-8 rounded-md bg-blue-100 px-2.5 py-0.5 text-sm font-extrabold text-blue-700 ring-1 ring-inset ring-blue-700/10">
                            {currentStock}
                          </span>
                        </div>
                        <Input inputMode="numeric"
                          type="number"
                          min="0"
                          value={stockAdjQuantity}
                          onChange={(e) => setStockAdjQuantity(e.target.value)}
                          placeholder="0"
                          className="h-10 rounded-xl"
                        />
                      </div>

                      <div className="flex-1 rounded-xl bg-muted px-4 py-2.5 text-sm text-muted-foreground">
                        Resultado previsto:{" "}
                        <span className="font-bold text-foreground">
                          {predictedStock}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <p className="text-sm font-medium">Observações sobre o ajuste (opcional)</p>
                    <Input
                      value={stockAdjObs}
                      onChange={(e) => setStockAdjObs(e.target.value)}
                      placeholder="Ex: Contagem de estoque / Entrada de mercadoria"
                      className="h-10 rounded-xl"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Save Button (Igual da Pod e Mais) */}
            <div className="flex justify-end pt-4">
              <Button
                type="button"
                className="h-11 rounded-xl px-6 text-sm font-semibold shadow-md transition-all active:scale-95"
                disabled={stockMutation.isPending || !stockAdjQuantity}
                onClick={() => stockMutation.mutate()}
              >
                <Save className="mr-2 h-4 w-4" />
                {stockMutation.isPending ? "Processando..." : "Finalizar Cadastro"}
              </Button>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Histórico Modal */}
      <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
        <DialogContent className="max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Clock className="h-4 w-4 text-primary" />
              Histórico de Movimentações do Estoque
            </DialogTitle>
            <DialogDescription className="text-xs">
              Registro completo das alterações de estoque efetuadas neste produto.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-80 overflow-y-auto space-y-2 pr-1 pt-2">
            {stockHistory.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                Nenhuma movimentação registrada até o momento.
              </div>
            ) : (
              stockHistory.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 text-xs"
                >
                  <div>
                    <span className="font-bold block">
                      {h.type === "ADD" && `+${h.quantity} unidades (Adicionado)`}
                      {h.type === "SUBTRACT" && `-${h.quantity} unidades (Removido)`}
                      {h.type === "SET" && `Estoque definido para ${h.newStock}`}
                    </span>
                    {h.observation && (
                      <span className="text-muted-foreground text-[11px] block mt-0.5">
                        Obs: {h.observation}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-semibold text-muted-foreground text-right shrink-0">
                    {new Date(h.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
