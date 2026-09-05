const fs = require('fs');

let content = fs.readFileSync('src/pages/CashRegisterDetailsPage.tsx', 'utf8');

// 1. Motoboy to Frete
content = content.replace(/>Motoboy<\/span>/g, '>Frete</span>');
content = content.replace(/>Gasto Motoboy<\/CardTitle>/g, '>Frete</CardTitle>');
content = content.replace(/<SelectItem value="MOTOBOY">Motoboy \/ Frete<\/SelectItem>/g, '<SelectItem value="MOTOBOY">Frete</SelectItem>');
content = content.replace(/<SelectItem value="INVESTMENT">Transferência p\/ Investimento<\/SelectItem>/g, '<SelectItem value="INVESTMENT">Investimento</SelectItem>');

// 2. Add indicators math
const mathSearch = 'const ticketMedioHoje = ordersToday.length > 0 ? (totalVendasDia / ordersToday.length) : 0;';
const mathReplace = `const ticketMedioHoje = ordersToday.length > 0 ? (totalVendasDia / ordersToday.length) : 0;
  
  const totalVendasCaixa = orders.reduce((acc: number, order: any) => acc + (order.totalReceived || 0), 0);
  const produtosVendidosCaixa = orders.reduce((acc: number, order: any) => {
    const itemsQty = order.items?.reduce((itemAcc: number, item: any) => itemAcc + (item.quantity || 0), 0) || 0;
    return acc + itemsQty;
  }, 0);
  const ticketMedioCaixa = orders.length > 0 ? (totalVendasCaixa / orders.length) : 0;`;
content = content.replace(mathSearch, mathReplace);

// 3. Add Investimentos card
const freteCard = `          <Card className="border-orange-100 bg-orange-50/10 rounded-2xl shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-orange-800 font-bold">Frete</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-black text-orange-600">
                {currencyFormatter.format(summary.motoboyOutflows || 0)}
              </p>
            </CardContent>
          </Card>`;
const invCard = `
          <Card className="border-sky-100 bg-sky-50/30 rounded-2xl shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-sky-700 font-bold">Investimentos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-sky-800">
                {currencyFormatter.format(summary.totalInvestment || 0)}
              </p>
            </CardContent>
          </Card>`;
content = content.replace(freteCard, freteCard + invCard);

// 4. Add Caixa Overall KPIs
const itemHojeCard = `          <Card className="border-slate-200 bg-slate-50/20 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl text-amber-600 bg-amber-50">
                <Package className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Itens Vendidos Hoje</p>
                <p className="text-2xl font-black text-slate-800">{produtosVendidosDia}</p>
              </div>
            </CardContent>
          </Card>`;
          
const overallKpis = `
          <Card className="border-slate-200 bg-sky-50/30 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl text-sky-700 bg-sky-100">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Pedidos Totais (Caixa)</p>
                <p className="text-2xl font-black text-slate-800">{orders.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-teal-50/30 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl text-teal-700 bg-teal-100">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Ticket Médio (Caixa)</p>
                <p className="text-2xl font-black text-slate-800">
                  {currencyFormatter.format(ticketMedioCaixa)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-amber-50/30 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl text-amber-700 bg-amber-100">
                <Package className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Itens Vendidos (Caixa)</p>
                <p className="text-2xl font-black text-slate-800">{produtosVendidosCaixa}</p>
              </div>
            </CardContent>
          </Card>`;

content = content.replace(itemHojeCard, itemHojeCard + overallKpis);

// 5. Add inputMode="decimal" to the new manual transaction amount input
content = content.replace(/(<Input[^>]*?id="tx-amount"[^>]*?)(>|\/>)/g, '$1 inputMode="decimal" $2');

fs.writeFileSync('src/pages/CashRegisterDetailsPage.tsx', content, 'utf8');
console.log('Restored CashRegisterDetailsPage');
