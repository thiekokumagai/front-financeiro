import { useEffect, useState, useMemo } from "react";
import { getPublicStoreSettings, getPublicStoreCategories, getPublicStoreProducts, PublicStoreSettings } from "@/services/store-catalog.service";
import { Product } from "@/types/product";
import { Category } from "@/types/category";
import { buildImageUrl } from "@/utils/image-url";
import { ShoppingCart, MessageCircle, Plus, Minus, Search, Sparkles, Check, Share2, Copy } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";

export default function PublicCatalogPage() {
  const [settings, setSettings] = useState<PublicStoreSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<{ [productId: string]: number }>({});
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [settingsData, categoriesData, productsData] = await Promise.all([
          getPublicStoreSettings().catch(() => null),
          getPublicStoreCategories().catch(() => []),
          getPublicStoreProducts().catch(() => []),
        ]);
        setSettings(settingsData);
        setCategories(categoriesData);
        setProducts(productsData);
      } catch (err) {
        console.error("Erro ao carregar catálogo público:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleQuantityChange = (productId: string, delta: number) => {
    setCart((prev) => {
      const current = prev[productId] || 0;
      const updated = Math.max(0, current + delta);
      if (updated === 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return { ...prev, [productId]: updated };
    });
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "ALL" ||
        product.categoryId === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const groupedProducts = useMemo(() => {
    const map = new Map<string, { category: Category | null; items: Product[] }>();

    // Agrupar por categorias
    categories.forEach((cat) => {
      map.set(cat.id, { category: cat, items: [] });
    });
    map.set("uncategorized", { category: null, items: [] });

    filteredProducts.forEach((prod) => {
      const catId = prod.categoryId && map.has(prod.categoryId) ? prod.categoryId : "uncategorized";
      map.get(catId)?.items.push(prod);
    });

    return Array.from(map.values()).filter((group) => group.items.length > 0);
  }, [filteredProducts, categories]);

  const totalItemsInCart = useMemo(() => {
    return Object.values(cart).reduce((acc, qty) => acc + qty, 0);
  }, [cart]);

  const cartTotalValue = useMemo(() => {
    return Object.entries(cart).reduce((acc, [prodId, qty]) => {
      const item = products.find((p) => p.id === prodId);
      if (!item) return acc;
      return acc + (Number(item.price) || 0) * qty;
    }, 0);
  }, [cart, products]);

  const handleShareWhatsApp = () => {
    const rawPhone = settings?.phone?.replace(/\D/g, "") || "";
    const targetPhone = rawPhone.startsWith("55") ? rawPhone : `55${rawPhone}`;

    let message = `Olá! Gostaria de fazer o pedido dos seguintes produtos:\n\n`;

    if (totalItemsInCart > 0) {
      Object.entries(cart).forEach(([prodId, qty]) => {
        const item = products.find((p) => p.id === prodId);
        if (item) {
          const itemTotal = (Number(item.price) || 0) * qty;
          message += `• *${qty}x* ${item.title} - ${formatCurrency(itemTotal)}\n`;
        }
      });
      message += `\n*TOTAL: ${formatCurrency(cartTotalValue)}*`;
    } else {
      message = `Olá! Gostaria de consultar o catálogo de produtos e fazer um pedido.`;
    }

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = targetPhone && targetPhone.length >= 10
      ? `https://wa.me/${targetPhone}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`;

    window.open(whatsappUrl, "_blank");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-amber-400 gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
        <span className="text-sm font-semibold tracking-wider animate-pulse">Carregando catálogo...</span>
      </div>
    );
  }

  const logoSrc = settings?.whiteLogoUrl || settings?.logoUrl 
    ? buildImageUrl(settings.whiteLogoUrl || settings.logoUrl!)
    : "/logo-white.png";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-zinc-950 to-black text-slate-100 font-sans pb-32">
      {/* Background Decorator */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none z-0" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* Top Header / Branding */}
        <header className="flex flex-col items-center text-center space-y-3 pt-4 border-b border-zinc-800/80 pb-6">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-yellow-300 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500" />
            <img
              src={logoSrc}
              alt={settings?.storeName || "Logo"}
              className="relative h-20 w-auto object-contain p-2 bg-black/40 rounded-xl border border-zinc-800"
            />
          </div>

          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.25em] text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
              <Sparkles className="h-3 w-3 text-amber-400" />
              Catálogo Oficial 2026
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
              {settings?.storeName || "Tabela de Produtos"}
            </h1>
            {settings?.topHeaderText && (
              <p className="text-xs text-zinc-400 font-medium max-w-md">
                {settings.topHeaderText}
              </p>
            )}
          </div>

          {/* Quick Share Link */}
          <div className="pt-1 flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-amber-400 bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full transition-colors"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedLink ? "Link Copiado!" : "Copiar Link do Catálogo"}</span>
            </button>
          </div>
        </header>

        {/* Search & Category Filter */}
        <div className="space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar produto ou dosagem..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-zinc-900/90 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-400/60 transition"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar">
            <button
              onClick={() => setSelectedCategory("ALL")}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === "ALL"
                  ? "bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/20 scale-105"
                  : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800"
              }`}
            >
              TODOS ({products.length})
            </button>
            {categories.map((cat) => {
              const count = products.filter((p) => p.categoryId === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? "bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/20 scale-105"
                      : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800"
                  }`}
                >
                  {cat.title.toUpperCase()} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Groups */}
        {groupedProducts.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 space-y-2">
            <p className="text-base font-semibold">Nenhum produto encontrado</p>
            <p className="text-xs">Tente buscar por outro nome de produto ou dosagem.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedProducts.map((group, idx) => (
              <section key={group.category?.id || idx} className="space-y-3">
                {/* Category Header Banner */}
                <div className="flex items-center gap-3">
                  <h2 className="text-xs font-extrabold uppercase tracking-widest text-amber-400 whitespace-nowrap">
                    {group.category?.title || "Outros Produtos"}
                  </h2>
                  <div className="h-px w-full bg-gradient-to-r from-amber-400/30 to-transparent" />
                </div>

                {/* Capsule List */}
                <div className="space-y-2.5">
                  {group.items.map((product) => {
                    const quantityInCart = cart[product.id] || 0;
                    const isOutOfStock = (product.stock !== undefined && product.stock !== null && product.stock <= 0);

                    return (
                      <div
                        key={product.id}
                        className={`group relative flex items-center justify-between gap-3 bg-gradient-to-r from-zinc-900 via-zinc-900/95 to-zinc-950 border border-zinc-800/90 hover:border-amber-400/50 rounded-2xl p-3.5 sm:px-5 transition-all shadow-md ${
                          quantityInCart > 0 ? "border-amber-400 ring-1 ring-amber-400/30 bg-zinc-900" : ""
                        }`}
                      >
                        {/* Product Title & Subtitle */}
                        <div className="min-w-0 flex-1 pr-2">
                          <span className="text-sm sm:text-base font-black tracking-tight text-white block uppercase group-hover:text-amber-300 transition-colors">
                            {product.title}
                          </span>
                          {product.description && (
                            <span className="text-xs text-zinc-400 font-medium block truncate mt-0.5">
                              {product.description}
                            </span>
                          )}
                        </div>

                        {/* Price Badge and Quantity Counter */}
                        <div className="flex items-center gap-3 shrink-0">
                          {isOutOfStock ? (
                            <span className="text-xs font-bold text-rose-400 bg-rose-950/60 border border-rose-800/60 px-3 py-1.5 rounded-full">
                              Esgotado
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              {/* Price Badge */}
                              <span className="bg-amber-400 text-zinc-950 font-black text-xs sm:text-sm px-3.5 py-1.5 rounded-full tracking-tight shadow-md">
                                {formatCurrency(Number(product.price) || 0)}
                              </span>

                              {/* Quantity Selector Controls */}
                              <div className="flex items-center gap-1 bg-black/60 border border-zinc-800 rounded-full p-1">
                                {quantityInCart > 0 ? (
                                  <>
                                    <button
                                      onClick={() => handleQuantityChange(product.id, -1)}
                                      className="w-6 h-6 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition"
                                      title="Diminuir"
                                    >
                                      <Minus className="h-3 w-3" />
                                    </button>
                                    <span className="w-5 text-center text-xs font-bold text-amber-300">
                                      {quantityInCart}
                                    </span>
                                  </>
                                ) : null}
                                <button
                                  onClick={() => handleQuantityChange(product.id, 1)}
                                  className="w-6 h-6 rounded-full bg-amber-400 hover:bg-amber-300 text-zinc-950 flex items-center justify-center font-bold transition shadow-sm"
                                  title="Adicionar"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* Floating Bottom CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black via-slate-950/95 to-transparent backdrop-blur-md">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleShareWhatsApp}
            className="w-full h-14 bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-extrabold text-base sm:text-lg rounded-2xl shadow-xl shadow-emerald-950/50 border border-emerald-400/40 flex items-center justify-center gap-3 transition-all active:scale-98"
          >
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <MessageCircle className="h-5 w-5 fill-white text-emerald-600" />
            </div>
            <span>
              {totalItemsInCart > 0
                ? `Fazer Pedido (${totalItemsInCart} itens) • ${formatCurrency(cartTotalValue)}`
                : "Toque aqui e faça o seu pedido!"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
