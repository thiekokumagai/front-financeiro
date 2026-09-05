const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf8');
  for (const [search, replace] of replacements) {
    if (typeof search === 'string') {
      content = content.replace(search, replace);
    } else {
      content = content.replace(search, replace);
    }
  }
  fs.writeFileSync(filePath, content, 'utf8');
}

// 1. dashboard.service.ts
replaceInFile('src/services/dashboard.service.ts', [
  [
    `  produtosInativos: number;
  valorCustoProdutos: number;
  valorCustoProdutosInativos: number;
  valorVendaTotalProdutos: number;`,
    `  produtosInativos: number;
  quantidadeTotalEstoque: number;
  valorCustoProdutos: number;
  valorCustoProdutosInativos: number;
  valorVendaTotalProdutos: number;`
  ]
]);

// 2. DashboardPage.tsx
replaceInFile('src/pages/DashboardPage.tsx', [
  [
    `    {
      label: "Produtos Ativos",
      value: stats ? stats.produtosAtivos : 0,
      icon: CheckCircle,
      color: "text-emerald-600 bg-emerald-100",
    },
    {
      label: "Produtos Inativos",
      value: stats ? stats.produtosInativos : 0,
      icon: XCircle,
      color: "text-slate-600 bg-slate-200",
    },`,
    `    {
      label: "Produtos Ativos",
      value: stats ? stats.produtosAtivos : 0,
      icon: CheckCircle,
      color: "text-emerald-600 bg-emerald-100",
    },
    {
      label: "Qtd. Total Estoque",
      value: stats?.quantidadeTotalEstoque || 0,
      icon: Package,
      color: "text-indigo-600 bg-indigo-100",
    },
    {
      label: "Custo Prod. Ativos",
      value: \`R$ \${(stats?.valorCustoProdutos || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\`,
      icon: DollarSign,
      color: "text-emerald-600 bg-emerald-100",
    },
    {
      label: "Produtos Inativos",
      value: stats?.produtosInativos || 0,
      icon: XCircle,
      color: "text-slate-600 bg-slate-200",
    },
    {
      label: "Venda Total Estoque",
      value: \`R$ \${(stats?.valorVendaTotalProdutos || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\`,
      icon: DollarSign,
      color: "text-primary bg-primary/10",
    },`
  ],
  [
    `<div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4">`,
    `<div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">`
  ]
]);

// 3. cash-register.service.ts
replaceInFile('src/services/cash-register.service.ts', [
  [
    `    motoboyOutflows: number;
    totalNet: number;
    totalsByMethod: Record<string, number>;
    orderCount: number;`,
    `    motoboyOutflows: number;
    partnersOutflows?: number;
    marketingOutflows?: number;
    totalInvestment?: number;
    totalProductCost?: number;
    totalNet: number;
    totalsByMethod: Record<string, number>;
    orderCount: number;`
  ]
]);

// 4. cash-register-pdf.ts
replaceInFile('src/utils/cash-register-pdf.ts', [
  [`{ content: "Gasto Motoboy:", styles: { fontStyle: "bold" } },`, `{ content: "Frete:", styles: { fontStyle: "bold" } },`]
]);

// 5. CashRegisterDetailsPage.tsx
replaceInFile('src/pages/CashRegisterDetailsPage.tsx', [
  [`cat === "MOTOBOY"`, `cat === "MOTOBOY"`], // sanity check
  [
    `return <span className={\`inline-flex items-center rounded-md bg-orange-50 px-1.5 py-0.5 text-[10px] font-bold text-orange-700 ring-1 ring-inset ring-orange-600/20 \${className}\`}>Motoboy</span>;`,
    `return <span className={\`inline-flex items-center rounded-md bg-orange-50 px-1.5 py-0.5 text-[10px] font-bold text-orange-700 ring-1 ring-inset ring-orange-600/20 \${className}\`}>Frete</span>;`
  ],
  [
    `<CardTitle className="text-xs uppercase tracking-wider text-orange-800 font-bold">Gasto Motoboy</CardTitle>`,
    `<CardTitle className="text-xs uppercase tracking-wider text-orange-800 font-bold">Frete</CardTitle>`
  ],
  [
    `<SelectItem value="MOTOBOY">Motoboy / Frete</SelectItem>`,
    `<SelectItem value="MOTOBOY">Frete</SelectItem>`
  ],
  [
    `<SelectItem value="INVESTMENT">Transferência p/ Investimento</SelectItem>`,
    `<SelectItem value="INVESTMENT">Investimento</SelectItem>`
  ],
  [
    `const ticketMedioHoje = ordersToday.length > 0 ? (totalVendasDia / ordersToday.length) : 0;`,
    `const ticketMedioHoje = ordersToday.length > 0 ? (totalVendasDia / ordersToday.length) : 0;
  
  const totalVendasCaixa = orders.reduce((acc: number, order: any) => acc + (order.totalReceived || 0), 0);
  const produtosVendidosCaixa = orders.reduce((acc: number, order: any) => {
    const itemsQty = order.items?.reduce((itemAcc: number, item: any) => itemAcc + (item.quantity || 0), 0) || 0;
    return acc + itemsQty;
  }, 0);
  const ticketMedioCaixa = orders.length > 0 ? (totalVendasCaixa / orders.length) : 0;`
  ],
  [
    `          <Card className="border-orange-100 bg-orange-50/10 rounded-2xl shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-orange-800 font-bold">Frete</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-black text-orange-600">
                {currencyFormatter.format(summary.motoboyOutflows || 0)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-100 bg-slate-50/30 rounded-2xl shadow-sm">`,
    `          <Card className="border-orange-100 bg-orange-50/10 rounded-2xl shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-orange-800 font-bold">Frete</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-black text-orange-600">
                {currencyFormatter.format(summary.motoboyOutflows || 0)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-sky-100 bg-sky-50/30 rounded-2xl shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-sky-700 font-bold">Investimentos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-sky-800">
                {currencyFormatter.format(summary.totalInvestment || 0)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-100 bg-slate-50/30 rounded-2xl shadow-sm">`
  ],
  [
    `          <Card className="border-slate-200 bg-slate-50/20 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl text-amber-600 bg-amber-50">
                <Package className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Itens Vendidos Hoje</p>
                <p className="text-2xl font-black text-slate-800">{produtosVendidosDia}</p>
              </div>
            </CardContent>
          </Card>
        </div>`,
    `          <Card className="border-slate-200 bg-slate-50/20 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl text-amber-600 bg-amber-50">
                <Package className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Itens Vendidos Hoje</p>
                <p className="text-2xl font-black text-slate-800">{produtosVendidosDia}</p>
              </div>
            </CardContent>
          </Card>
          
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
          </Card>
        </div>`
  ]
]);

// 6. Now do a clean Regex replace for inputMode="numeric" on ALL src files!
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.jsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // For phone inputs (mostly id="phone" or name="phone" or onChange={setPhone})
  content = content.replace(/(<Input[^>]*?id="phone"[^>]*?)(>|\/>)/g, '$1 inputMode="numeric" $2');
  content = content.replace(/(<Input[^>]*?id="telefone"[^>]*?)(>|\/>)/g, '$1 inputMode="numeric" $2');
  content = content.replace(/(<Input[^>]*?name="phone"[^>]*?)(>|\/>)/g, '$1 inputMode="numeric" $2');
  content = content.replace(/(<Input[^>]*?name="telefone"[^>]*?)(>|\/>)/g, '$1 inputMode="numeric" $2');
  
  // For value inputs (costPrice, price, amount, valor, etc)
  content = content.replace(/(<Input[^>]*?id="valor"[^>]*?)(>|\/>)/g, '$1 inputMode="decimal" $2');
  content = content.replace(/(<Input[^>]*?name="valor"[^>]*?)(>|\/>)/g, '$1 inputMode="decimal" $2');
  content = content.replace(/(<Input[^>]*?id="tx-amount"[^>]*?)(>|\/>)/g, '$1 inputMode="decimal" $2');
  content = content.replace(/(<Input[^>]*?id="amount"[^>]*?)(>|\/>)/g, '$1 inputMode="decimal" $2');
  content = content.replace(/(<Input[^>]*?name="amount"[^>]*?)(>|\/>)/g, '$1 inputMode="decimal" $2');
  content = content.replace(/(<Input[^>]*?name="price"[^>]*?)(>|\/>)/g, '$1 inputMode="decimal" $2');
  content = content.replace(/(<Input[^>]*?id="price"[^>]*?)(>|\/>)/g, '$1 inputMode="decimal" $2');
  content = content.replace(/(<Input[^>]*?name="costPrice"[^>]*?)(>|\/>)/g, '$1 inputMode="decimal" $2');
  content = content.replace(/(<Input[^>]*?id="costPrice"[^>]*?)(>|\/>)/g, '$1 inputMode="decimal" $2');
  
  // For type="number"
  content = content.replace(/(<(?:Input|input)[^>]*?type="number"[^>]*?)(>|\/>)/gi, '$1 inputMode="numeric" $2');
  content = content.replace(/(<(?:Input|input)[^>]*?type="tel"[^>]*?)(>|\/>)/gi, '$1 inputMode="numeric" $2');

  if (content !== originalContent) {
    // clean up duplicate inputMode just in case
    content = content.replace(/inputMode="[^"]+"\s+inputMode="[^"]+"/g, 'inputMode="numeric"');
    fs.writeFileSync(file, content, 'utf8');
  }
});

console.log('Recovery and inputMode task complete.');
