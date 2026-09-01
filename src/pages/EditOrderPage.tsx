import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductSearch } from "@/components/orders/ProductSearch";
import { CustomerSearch } from "@/components/orders/CustomerSearch";
import { OrderSummary } from "@/components/orders/OrderSummary";
import type { ProductResponse } from "@/types/product";
import { customersService, type Customer } from "@/services/customers.service";
import { getProductById } from "@/services/product.service";
import type { Coupon } from "@/services/coupon.service";
import { useOrderDetails, useUpdateOrderFull } from "@/hooks/useOrders";
import { useToast } from "@/components/ui/use-toast";
import { useSettings } from "@/hooks/useSettings";

interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
}

export default function EditOrderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: order, isLoading } = useOrderDetails(id ?? "");
  const updateMutation = useUpdateOrderFull();

  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customTotal, setCustomTotal] = useState("");
  const [showProductPrices, setShowProductPrices] = useState(true);
  const [needsChange, setNeedsChange] = useState(false);
  const [changeFor, setChangeFor] = useState("");
  const [orderNote, setOrderNote] = useState("");
  
  const { data: storeSettings } = useSettings();
  const [creditInstallments, setCreditInstallments] = useState(1);

  useEffect(() => {
    if (order) {
      const initialItems = order.items.map(item => ({
        productId: item.productId,
        title: item.productName,
        price: item.price,
        quantity: item.quantity,
      }));
      setOrderItems(initialItems);

      setSelectedCustomer({
        id: "cust-order",
        name: order.customerName,
        phone: order.customerPhone,
      });

      setPaymentMethod(order.paymentMethod || "");
      setIsPaid(order.paymentType === "PAGO");
      setOrderNote(order.observation || "");
      setCustomTotal(order.totalOrder ? order.totalOrder.toFixed(2).replace('.', ',') : "");
      setCreditInstallments(order.installments || 1);
    }
  }, [order]);

  const pixDiscountPercent = useMemo(() => {
    const rule = storeSettings?.paymentRules?.find((r: any) => r.paymentMethod === 'pix' && r.type === 'discount');
    return rule ? rule.value : 0;
  }, [storeSettings]);

  const installmentsOptions = useMemo(() => {
    const rules = storeSettings?.paymentRules?.filter((r: any) => r.paymentMethod === 'credit' && r.type === 'charge') || [];
    const options = [{ value: 1, interest: 0 }];
    if (rules.length === 0) return options;
    rules.sort((a: any, b: any) => (a.parcelaMin || 0) - (b.parcelaMin || 0));
    rules.forEach((rule: any) => {
       const min = rule.parcelaMin || 2;
       const max = rule.parcelaMax || min;
       const interest = rule.passedToCustomer !== false ? rule.value : 0; 
       for (let i = min; i <= max; i++) {
           if (!options.find(o => o.value === i)) {
               options.push({ value: i, interest: interest });
           }
       }
    });
    return options.sort((a, b) => a.value - b.value);
  }, [storeSettings]);

  const subtotal = orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const discount = coupon ? (
    coupon.type === "VALUE"
      ? Math.min(coupon.value || 0, subtotal)
      : coupon.type === "PERCENTAGE"
        ? subtotal * ((coupon.value || 0) / 100)
        : 0
  ) : 0;
  
  const totalAfterCoupon = Math.max(0, subtotal - discount);
  const pixDiscountAmount = paymentMethod === "PIX" ? totalAfterCoupon * (pixDiscountPercent / 100) : 0;
  const discountedProductsTotal = totalAfterCoupon - pixDiscountAmount;

  const effectiveCreditInstallments = paymentMethod === "Cartão de Crédito" ? creditInstallments : 1;
  const selectedInstallment = installmentsOptions.find((opt) => opt.value === effectiveCreditInstallments) ?? installmentsOptions[0];
  const creditInterestAmount = paymentMethod === "Cartão de Crédito" ? totalAfterCoupon * (selectedInstallment.interest / 100) : 0;

  const total = discountedProductsTotal + creditInterestAmount;
  const parsedCustomTotal = parseFloat(customTotal.replace(/\./g, '').replace(',', '.'));
  const finalTotal = !isNaN(parsedCustomTotal) && customTotal.trim() !== "" ? parsedCustomTotal : total;

  const isValid = !!selectedCustomer && orderItems.length > 0 && paymentMethod !== "" && (paymentMethod !== "Dinheiro" || !needsChange || (changeFor.trim() !== "" && parseFloat(changeFor.replace(/\./g, '').replace(',', '.')) >= finalTotal));

  const handleSelectProduct = (product: ProductResponse) => {
    setOrderItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          title: product.title,
          price: product.promotionalPrice || product.price || 0,
          quantity: 1,
        },
      ];
    });
  };

  const handleUpdateQuantity = (index: number, delta: number) => {
    setOrderItems((prev) => {
      const item = prev[index];
      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        return prev.filter((_, i) => i !== index);
      }
      return prev.map((it, i) => (i === index ? { ...it, quantity: newQty } : it));
    });
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!isValid || !selectedCustomer || !id) return;

    setIsSubmitting(true);
    try {
      const payload = {
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone,
        itemsTotal: subtotal,
        totalOrder: finalTotal,
        totalReceived: isPaid ? finalTotal : 0,
        paymentType: isPaid ? "PAGO" : "PENDENTE",
        paymentMethod,
        installments: effectiveCreditInstallments,
        couponId: coupon?.id,
        observation: orderNote || undefined,
        items: orderItems.map((item) => ({
          productId: item.productId,
          productName: item.title,
          price: item.price,
          quantity: item.quantity,
        })),
      };

      await updateMutation.mutateAsync({ id, payload });
      toast({
        title: "Pedido atualizado com sucesso!",
      });
      navigate(`/pedidos/${id}`);
    } catch (error: any) {
      toast({
        title: "Erro ao editar pedido",
        description: error.message || "Ocorreu um erro ao atualizar o pedido.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate(`/pedidos/${id}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Editar Pedido #{order?.orderNumber}</h1>
            <p className="text-sm text-muted-foreground">Atualize as informações da venda.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Selection */}
          <div className="bg-card rounded-xl border p-5 space-y-4 shadow-sm">
            <h2 className="font-semibold text-base">1. Cliente</h2>
            <CustomerSearch
              selectedCustomer={selectedCustomer}
              onSelectCustomer={setSelectedCustomer}
            />
          </div>

          {/* Product Selection */}
          <div className="bg-card rounded-xl border p-5 space-y-4 shadow-sm">
            <h2 className="font-semibold text-base">2. Produtos</h2>
            <ProductSearch onSelectProduct={handleSelectProduct} />

            {/* Selected Items List */}
            {orderItems.length > 0 && (
              <div className="space-y-3 pt-3 border-t">
                {orderItems.map((item, index) => (
                  <div
                    key={`${item.productId}-${index}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border text-sm"
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="font-medium truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(item.price)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleUpdateQuantity(index, -1)}
                        >
                          -
                        </Button>
                        <span className="w-8 text-center font-semibold">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleUpdateQuantity(index, 1)}
                        >
                          +
                        </Button>
                      </div>

                      <span className="font-bold w-20 text-right">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(item.price * item.quantity)}
                      </span>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Note */}
          <div className="bg-card rounded-xl border p-5 space-y-3 shadow-sm">
            <h2 className="font-semibold text-base">Observações do Pedido</h2>
            <textarea
              className="w-full min-h-[80px] p-3 rounded-md border text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Digite alguma observação sobre o pedido..."
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
            />
          </div>
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-xl border p-5 shadow-sm sticky top-6">
            <OrderSummary
              subtotal={subtotal}
              discount={discount}
              total={finalTotal}
              coupon={coupon}
              onApplyCoupon={setCoupon}
              paymentMethod={paymentMethod}
              onPaymentMethodChange={setPaymentMethod}
              creditInstallments={creditInstallments}
              onCreditInstallmentsChange={setCreditInstallments}
              installmentsOptions={installmentsOptions}
              isPaid={isPaid}
              onIsPaidChange={setIsPaid}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              isValid={isValid}
              pixDiscountAmount={pixDiscountAmount}
              creditInterestAmount={creditInterestAmount}
              customTotal={customTotal}
              onCustomTotalChange={setCustomTotal}
              showProductPrices={showProductPrices}
              onShowProductPricesChange={setShowProductPrices}
              needsChange={needsChange}
              onNeedsChangeChange={setNeedsChange}
              changeFor={changeFor}
              onChangeForChange={setChangeFor}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
