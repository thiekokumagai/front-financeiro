import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Trash2, MessageCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductSearch } from "@/components/orders/ProductSearch";
import { CustomerSearch } from "@/components/orders/CustomerSearch";
import { OrderSummary } from "@/components/orders/OrderSummary";
import type { ProductResponse } from "@/types/product";
import type { Customer } from "@/services/customers.service";
import type { Coupon } from "@/services/coupon.service";
import { createOrder } from "@/services/order.service";
import { useToast } from "@/components/ui/use-toast";
import { useSettings } from "@/hooks/useSettings";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { customersService } from "@/services/customers.service";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { formatCurrency, formatPhone } from "@/utils/formatters";

interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
}

export default function CreateOrderPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const location = useLocation();
  const duplicateData = location.state?.duplicateData;

  const [orderItems, setOrderItems] = useState<OrderItem[]>(duplicateData?.items || []);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(duplicateData?.customer || null);
  
  const [paymentMethod, setPaymentMethod] = useState(duplicateData?.paymentMethod || "");
  const [isPaid, setIsPaid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBudgetMode, setIsBudgetMode] = useState(false);
  const [customTotal, setCustomTotal] = useState("");
  const [needsChange, setNeedsChange] = useState(false);
  const [changeFor, setChangeFor] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [createdOrderModalData, setCreatedOrderModalData] = useState<any | null>(null);
  
  const { data: storeSettings } = useSettings();
  const [creditInstallments, setCreditInstallments] = useState(1);

  const handleResetForm = () => {
    setOrderItems([]);
    setSelectedCustomer(null);
    setPaymentMethod("");
    setIsPaid(false);
    setCustomTotal("");
    setNeedsChange(false);
    setChangeFor("");
    setOrderNote("");
    setCreatedOrderModalData(null);
  };

  const handleSendWhatsAppToCustomer = (order: any) => {
    const phone = order.customerPhone || "";
    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone) {
      toast({
        variant: "destructive",
        title: "Telefone não encontrado",
        description: "O cliente não possui um número de WhatsApp cadastrado.",
      });
      return;
    }

    const formattedPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
    const customerName = order.customerName || "Cliente";
    const orderNum = order.orderNumber ? `#${order.orderNumber}` : "";

    let itemsText = "";
    if (Array.isArray(order.items) && order.items.length > 0) {
      itemsText = order.items
        .map((i: any) => `• *${i.quantity || 1}x* ${i.productName || i.title || "Produto"} - ${formatCurrency((Number(i.price) || 0) * (Number(i.quantity) || 1))}`)
        .join("\n");
    }

    const paymentLabel = 
      order.paymentMethod === 'pix' || order.paymentMethod === 'PIX' ? 'PIX' :
      order.paymentMethod === 'credit' || order.paymentMethod === 'Cartão de Crédito' ? 'Cartão de Crédito' :
      order.paymentMethod === 'debit' || order.paymentMethod === 'Cartão de Débito' ? 'Cartão de Débito' :
      order.paymentMethod === 'cash' || order.paymentMethod === 'Dinheiro' ? 'Dinheiro' : order.paymentMethod || 'Outro';

    const totalStr = formatCurrency(Number(order.totalOrder || order.totalReceived || 0));

    const text = `Olá *${customerName}*! 🛒\n\nSegue o comprovante do seu pedido *${orderNum}*:\n\n📦 *ITENS DO PEDIDO:*\n${itemsText}\n\n💳 *Forma de Pagamento:* ${paymentLabel}\n💰 *Total Final:* ${totalStr}\n\nObrigado pela preferência!`;

    const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank");
  };

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

  const totalAfterCoupon = subtotal;
  const pixDiscountAmount = paymentMethod === "PIX" ? totalAfterCoupon * (pixDiscountPercent / 100) : 0;
  const discountedProductsTotal = totalAfterCoupon - pixDiscountAmount;

  const effectiveCreditInstallments = paymentMethod === "Cartão de Crédito" ? creditInstallments : 1;
  const selectedInstallment = installmentsOptions.find((opt) => opt.value === effectiveCreditInstallments) ?? installmentsOptions[0];
  const creditInterestAmount = paymentMethod === "Cartão de Crédito" ? totalAfterCoupon * (selectedInstallment.interest / 100) : 0;

  const total = discountedProductsTotal + creditInterestAmount;
  const parsedCustomTotal = parseFloat(customTotal.replace(/\./g, '').replace(',', '.'));
  const finalTotal = !isNaN(parsedCustomTotal) && customTotal.trim() !== "" ? parsedCustomTotal : total;

  const isValid = (isBudgetMode || !!selectedCustomer) && orderItems.length > 0 && paymentMethod !== "" && (paymentMethod !== "Dinheiro" || !needsChange || (changeFor.trim() !== "" && parseFloat(changeFor.replace(/\./g, '').replace(',', '.')) >= finalTotal));

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
          price: product.price || 0,
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
    if (!isValid || (!isBudgetMode && !selectedCustomer)) return;
    
    if (isBudgetMode) {
      toast({
        title: "Modo Orçamento",
        description: "Orçamentos servem apenas para calcular preços e não são salvos.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let finalCustomerId = selectedCustomer.id;
      let finalCustomerName = selectedCustomer.name;
      let finalCustomerPhone = selectedCustomer.phone;

      if (!selectedCustomer.id || selectedCustomer.id.startsWith("temp_")) {
        try {
          const createdCust = await customersService.createCustomer({
            name: selectedCustomer.name,
            phone: selectedCustomer.phone,
          });
          if (createdCust && createdCust.id) {
            finalCustomerId = createdCust.id;
          }
        } catch (err) {
          console.warn("Não foi possível cadastrar novo cliente:", err);
        }
      }

      const payload = {
        customerName: finalCustomerName,
        customerPhone: finalCustomerPhone,
        itemsTotal: subtotal,
        totalOrder: finalTotal,
        totalReceived: isPaid ? finalTotal : 0,
        paymentType: paymentMethod === 'PIX' ? 'online' : 'entrega',
        paymentMethod: paymentMethod === 'PIX' ? 'pix' : paymentMethod === 'Cartão de Crédito' ? 'credit' : paymentMethod === 'Cartão de Débito' ? 'debit' : paymentMethod === 'Dinheiro' ? 'cash' : paymentMethod,
        paymentStatus: isPaid ? "PAID" : "PENDING",
        installments: effectiveCreditInstallments,
        observation: orderNote || undefined,
        items: orderItems.map((item) => ({
          productId: item.productId,
          productName: item.title,
          price: item.price,
          quantity: item.quantity,
        })),
      };

      const newOrder = await createOrder(payload);
      toast({
        title: "Pedido criado com sucesso!",
        description: `Pedido #${newOrder.orderNumber} gerado.`,
      });
      setCreatedOrderModalData({
        ...newOrder,
        items: orderItems,
        customerName: finalCustomerName,
        customerPhone: finalCustomerPhone,
        paymentMethod,
        totalOrder: finalTotal,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao criar pedido",
        description: error.message || "Ocorreu um erro ao salvar o pedido.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-none pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate("/pedidos")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Novo Pedido</h1>
            <p className="text-sm text-muted-foreground">Preencha os dados da venda abaixo.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-muted/60 p-2 rounded-lg border">
          <Switch
            id="budget-mode"
            checked={isBudgetMode}
            onCheckedChange={setIsBudgetMode}
          />
          <Label htmlFor="budget-mode" className="text-sm font-medium cursor-pointer">
            Modo Orçamento
          </Label>
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
              total={finalTotal}
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
              isBudgetMode={isBudgetMode}
              customTotal={customTotal}
              onCustomTotalChange={setCustomTotal}
              needsChange={needsChange}
              onNeedsChangeChange={setNeedsChange}
              changeFor={changeFor}
              onChangeForChange={setChangeFor}
            />
          </div>
        </div>
      </div>

      {/* Modal de Sucesso e Envio do Pedido no WhatsApp do Cliente */}
      <Dialog
        open={!!createdOrderModalData}
        onOpenChange={(open) => {
          if (!open && createdOrderModalData) {
            const orderId = createdOrderModalData.id;
            setCreatedOrderModalData(null);
            navigate(`/pedidos/${orderId}`);
          }
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl p-6">
          <DialogHeader className="flex flex-col items-center text-center space-y-2">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-1">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <DialogTitle className="text-xl font-bold">
              Pedido #{createdOrderModalData?.orderNumber} Criado!
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              O pedido foi registrado no sistema. Clique abaixo para enviar o comprovante diretamente no WhatsApp do cliente.
            </DialogDescription>
          </DialogHeader>

          {createdOrderModalData && (
            <div className="space-y-4 pt-2">
              <div className="bg-slate-50 rounded-xl p-4 border space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Cliente:</span>
                  <span className="font-bold text-slate-800">{createdOrderModalData.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">WhatsApp do Cliente:</span>
                  <span className="font-mono font-bold text-slate-800">{formatPhone(createdOrderModalData.customerPhone || "")}</span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="text-slate-500 font-medium">Total do Pedido:</span>
                  <span className="font-black text-slate-900">{formatCurrency(createdOrderModalData.totalOrder || 0)}</span>
                </div>
              </div>

              {/* Botão verde em destaque que envia para o WhatsApp do cliente */}
              <Button
                onClick={() => handleSendWhatsAppToCustomer(createdOrderModalData)}
                className="w-full h-13 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl gap-2 shadow-lg shadow-emerald-600/25 text-base transition-all"
              >
                <MessageCircle className="h-5 w-5 fill-white" />
                <span>Enviar Comprovante no WhatsApp</span>
              </Button>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  className="rounded-xl font-semibold"
                  onClick={() => {
                    const orderId = createdOrderModalData.id;
                    setCreatedOrderModalData(null);
                    navigate(`/pedidos/${orderId}`);
                  }}
                >
                  Ver Pedido
                </Button>
                <Button
                  variant="secondary"
                  className="rounded-xl font-semibold"
                  onClick={handleResetForm}
                >
                  Novo Pedido
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
