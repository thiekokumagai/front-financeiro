import { useEffect, useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import {
  getPublicStoreSettings,
  getPublicStoreCategories,
  getPublicStoreProducts,
  PublicStoreSettings,
} from "@/services/store-catalog.service";
import { Product } from "@/types/product";
import { Category } from "@/types/category";
import { buildImageUrl } from "@/utils/image-url";
import { openWhatsApp } from "@/utils/whatsapp";
import {
  MessageCircle,
  Search,
  Check,
  Copy,
  ArrowUp,
  ShieldCheck,
  Zap,
  ChevronRight,
  Clock,
  HeartPulse,
  Sparkles,
  Plus,
  Minus,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { matchesProductSearch } from "@/utils/search";

export default function PublicCatalogPage() {
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ["public-settings"],
    queryFn: getPublicStoreSettings,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const { data: rawCategories } = useQuery({
    queryKey: ["public-categories"],
    queryFn: getPublicStoreCategories,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const categories: Category[] = useMemo(() => {
    if (!rawCategories) return [];
    if (Array.isArray(rawCategories)) return rawCategories;
    return (rawCategories as any).data || [];
  }, [rawCategories]);

  const { data: rawProducts, isLoading: loadingProducts } = useQuery({
    queryKey: ["public-products"],
    queryFn: getPublicStoreProducts,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const products: any[] = useMemo(() => {
    if (!rawProducts) return [];
    const list = Array.isArray(rawProducts) ? rawProducts : (rawProducts as any).data || [];
    return list.map((p: any) => ({
      ...p,
      title: p.title || p.name || "",
    }));
  }, [rawProducts]);

  const loading = loadingProducts && !products.length && !categories.length;

  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Mini carrinho de orçamento na memória (sem salvar no banco)
  const [cart, setCart] = useState<Record<string, { product: any; quantity: number }>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);

  const cartList = useMemo(() => {
    return Object.values(cart).filter((item) => item.quantity > 0);
  }, [cart]);

  const totalCartItems = useMemo(() => {
    return cartList.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartList]);

  const handleAddToCart = (product: any) => {
    setCart((prev) => {
      const current = prev[product.id]?.quantity || 0;
      return {
        ...prev,
        [product.id]: {
          product,
          quantity: current + 1,
        },
      };
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      const current = prev[productId];
      if (!current) return prev;
      const newQty = current.quantity + delta;
      if (newQty <= 0) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return {
        ...prev,
        [productId]: {
          ...current,
          quantity: newQty,
        },
      };
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const handleClearCart = () => {
    setCart({});
  };

  const handleSendCartWhatsApp = () => {
    if (cartList.length === 0) return;

    // Enviar apenas a listagem dos itens exatamente como solicitado:
    // - 2x Enantato
    // - 1x Deca
    const lines = cartList.map(
      (item) => `- ${item.quantity}x ${item.product.title || item.product.name}`
    );
    const message = lines.join("\n");

    openWhatsApp({
      phone: settings?.phone,
      text: message,
    });
  };

  // Monitorar se a rolagem passou do cabeçalho para fixar a barra
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      if (scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }

      // Ativar modo fixo quando passar do banner/cabeçalho (~220px)
      if (scrollY > 220) {
        setIsHeaderScrolled(true);
      } else {
        setIsHeaderScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const socketUrl =
      import.meta.env.VITE_ADMIN_API?.replace(/\/api$/, "") || window.location.origin;
    const socket = io(socketUrl, { transports: ["websocket", "polling"] });

    socket.on("products.refresh", () => {
      queryClient.invalidateQueries({ queryKey: ["public-products"] });
      queryClient.invalidateQueries({ queryKey: ["public-categories"] });
    });

    socket.on("order.new", () => {
      queryClient.invalidateQueries({ queryKey: ["public-products"] });
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  useEffect(() => {
    if (settings?.storeName) {
      const storeName = settings.storeName;
      const titleText = `${storeName} | Catálogo de Medicamentos & Produtos`;
      const descText =
        settings.topHeaderText ||
        `Confira o catálogo de medicamentos de ${storeName}. Solicite pelo WhatsApp!`;

      // Banner de previsualizacao para compartilhamento no WhatsApp / OpenGraph
      const fullBannerUrl = `${window.location.origin}/banner-gym.png`;

      document.title = titleText;

      const updateMetaTag = (
        selector: string,
        attrName: string,
        attrVal: string,
        contentVal: string
      ) => {
        let el = document.querySelector(selector);
        if (!el) {
          el = document.createElement("meta");
          el.setAttribute(attrName, attrVal);
          document.head.appendChild(el);
        }
        el.setAttribute("content", contentVal);
      };

      updateMetaTag('meta[name="description"]', "name", "description", descText);
      updateMetaTag('meta[property="og:title"]', "property", "og:title", storeName);
      updateMetaTag('meta[name="twitter:title"]', "name", "twitter:title", storeName);
      updateMetaTag('meta[property="og:description"]', "property", "og:description", descText);
      updateMetaTag('meta[name="twitter:description"]', "name", "twitter:description", descText);
      updateMetaTag('meta[property="og:image"]', "property", "og:image", fullBannerUrl);
      updateMetaTag('meta[name="twitter:image"]', "name", "twitter:image", fullBannerUrl);
    }
  }, [settings]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "ALL" || product.categoryId === selectedCategory;
      const matchesSearch = matchesProductSearch(searchQuery, product);
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const groupedProducts = useMemo(() => {
    const map = new Map<string, { category: Category | null; items: Product[] }>();

    categories.forEach((cat) => {
      map.set(cat.id, { category: cat, items: [] });
    });
    map.set("uncategorized", { category: null, items: [] });

    filteredProducts.forEach((prod) => {
      const catId =
        prod.categoryId && map.has(prod.categoryId) ? prod.categoryId : "uncategorized";
      map.get(catId)?.items.push(prod);
    });

    // Ordenar produtos dentro de cada grupo em ordem alfabética (A-Z)
    map.forEach((group) => {
      group.items.sort((a, b) => (a.title || "").localeCompare(b.title || "", "pt-BR", { sensitivity: "base" }));
    });

    return Array.from(map.values()).filter((group) => group.items.length > 0);
  }, [filteredProducts, categories]);

  const handleShareWhatsApp = () => {
    const storeTitle = settings?.storeName || "FARMÁCIA";
    const message = `Olá *${storeTitle}*! Gostaria de fazer pedido.`;

    openWhatsApp({
      phone: settings?.phone,
      text: message,
    });
  };

  const handleShareCatalogWhatsApp = () => {
    const storeTitle = settings?.storeName || "nosso catálogo";
    const currentUrl = window.location.href;
    const message = `Olá! Confira o catálogo completo de *${storeTitle}*:\n\n${currentUrl}`;

    openWhatsApp({
      phone: null,
      text: message,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-emerald-400 gap-4 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500/30 border-t-emerald-400" />
          <span className="text-sm font-black tracking-widest uppercase text-emerald-400 animate-pulse">
            Carregando catálogo...
          </span>
        </div>
      </div>
    );
  }

  const storeLogo = settings?.whiteLogoUrl || settings?.logoUrl
    ? buildImageUrl(settings.whiteLogoUrl || settings.logoUrl!)
    : null;

  return (
    <div className="min-h-screen bg-[#06090e] text-slate-100 font-sans pb-36 relative selection:bg-emerald-500 selection:text-slate-950">
      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-4 space-y-6">
        {/* Header Branding Card com Banner Hero */}
        <header className="relative overflow-hidden rounded-3xl bg-slate-950 border border-slate-800/90 text-center shadow-2xl space-y-4 group">
          {/* Hero Banner Image */}
          <div className="relative h-48 sm:h-56 w-full overflow-hidden">
            <img
              src="/banner-gym.png"
              alt="Fitness Hero Banner"
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover object-top scale-105 group-hover:scale-110 transition-transform duration-1000 ease-out"
            />
            {/* Overlay Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/40 via-transparent to-slate-950/70" />

            <div className="absolute top-3 right-3 z-10">
              <button
                onClick={handleShareCatalogWhatsApp}
                title="Compartilhar no WhatsApp"
                className="inline-flex items-center gap-1.5 text-xs text-slate-100 hover:text-white bg-emerald-600/90 hover:bg-emerald-500 border border-emerald-400/50 px-3.5 py-1.5 rounded-full transition-all duration-200 active:scale-95 shadow-lg backdrop-blur-sm"
              >
                <MessageCircle className="h-3.5 w-3.5 fill-current text-white" />
                <span className="font-bold text-[11px] tracking-wide">
                  Compartilhar
                </span>
              </button>
            </div>
          </div>

          <div className="relative z-10 px-6 pb-6 pt-0 space-y-4 -mt-10">
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-80" />

            {storeLogo && (
              <div className="flex justify-center pt-2">
                <div className="relative p-2 bg-slate-950/90 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
                  <img
                    src={storeLogo}
                    alt={settings?.storeName || "Logo"}
                    loading="lazy"
                    decoding="async"
                    className="h-16 w-auto object-contain max-w-[200px]"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                {settings?.storeName || "FARMÁCIA NUTRACÊUTICA"}
              </h1>
              {settings?.topHeaderText && (
                <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-md mx-auto leading-relaxed">
                  {settings.topHeaderText}
                </p>
              )}
            </div>

            <div className="pt-3 flex items-center justify-center gap-4 text-[11px] text-slate-300 font-bold border-t border-slate-800/80">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <Zap className="h-3.5 w-3.5" />
                <span>Alta Qualidade</span>
              </div>
              <span className="text-slate-700">•</span>
              <div className="flex items-center gap-1.5 text-amber-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Pronta Entrega</span>
              </div>
              <span className="text-slate-700">•</span>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <Clock className="h-3.5 w-3.5" />
                <span>Envio Rápido</span>
              </div>
            </div>
          </div>
        </header>

        {/* Search & Category Filter Section - Fixo na Rolagem */}
        <div className="sticky top-0 z-40 bg-[#06090e] border-b border-slate-800/80 shadow-xl pb-2 pt-2 -mx-4 px-4 space-y-2.5">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por produto, princípio ativo ou dosagem..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 px-2 py-0.5 rounded"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 hide-scrollbar">
            <button
              onClick={() => setSelectedCategory("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase whitespace-nowrap transition-colors border ${
                selectedCategory === "ALL"
                  ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800"
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase whitespace-nowrap transition-colors border ${
                    selectedCategory === cat.id
                      ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm"
                      : "bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800"
                  }`}
                >
                  {cat.title.toUpperCase()} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Products List Grouped */}
        {loadingProducts && products.length === 0 ? (
          <div className="py-16 text-center text-emerald-400 space-y-3 bg-slate-900/40 border border-slate-800/60 rounded-3xl backdrop-blur-md">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500/30 border-t-emerald-400 mx-auto" />
            <p className="text-sm font-black tracking-wider uppercase text-emerald-400 animate-pulse">
              Carregando produtos...
            </p>
          </div>
        ) : groupedProducts.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-3 bg-slate-900/40 border border-slate-800/60 rounded-3xl backdrop-blur-md">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-400">
              <Search className="h-6 w-6" />
            </div>
            <p className="text-base font-bold text-slate-300">Nenhum produto encontrado</p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Verifique a ortografia ou tente pesquisar por outro nome ou termo.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedProducts.map((group, idx) => (
              <section key={group.category?.id || idx} className="space-y-2.5">
                {/* Category Header Limpo */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="h-2 w-2 rounded-full bg-emerald-400" />
                  <h2 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                    {group.category?.title || "Outros Produtos"}
                  </h2>
                </div>

                {/* Product Cards Container */}
                <div className="space-y-2">
                  {group.items.map((product) => {
                    const isOutOfStock =
                      product.stock !== undefined &&
                      product.stock !== null &&
                      product.stock <= 0;

                    return (
                      <div
                        key={product.id}
                        className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
                      >
                        {/* Product Details */}
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-bold text-white uppercase block">
                            {product.title}
                          </span>

                          {product.description && (
                            <p className="text-xs text-slate-400 font-normal mt-0.5 line-clamp-1">
                              {product.description}
                            </p>
                          )}
                        </div>

                        {/* Price & Cart Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {isOutOfStock ? (
                            <span className="text-xs font-bold text-rose-400 bg-rose-950/60 border border-rose-800/60 px-2.5 py-1 rounded-lg inline-block">
                              Esgotado
                            </span>
                          ) : (
                            <>
                              <span className="text-xs sm:text-sm font-bold text-emerald-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 inline-block">
                                {formatCurrency(Number(product.price) || 0)}
                              </span>

                              {cart[product.id] && cart[product.id].quantity > 0 ? (
                                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                                  <button
                                    onClick={() => handleUpdateQuantity(product.id, -1)}
                                    className="w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                                    title="Diminuir"
                                    aria-label="Diminuir"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                  <span className="w-5 text-center text-xs font-bold text-emerald-400">
                                    {cart[product.id].quantity}
                                  </span>
                                  <button
                                    onClick={() => handleUpdateQuantity(product.id, 1)}
                                    className="w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                                    title="Aumentar"
                                    aria-label="Aumentar"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleAddToCart(product)}
                                  className="h-7 px-2.5 rounded-lg bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 border border-slate-700 transition-colors flex items-center gap-1 text-xs font-bold"
                                  title="Adicionar ao orçamento"
                                  aria-label="Adicionar ao orçamento"
                                >
                                  <Plus className="h-3 w-3" />
                                  <span>Adicionar</span>
                                </button>
                              )}
                            </>
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

      {/* Floating Back to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          aria-label="Voltar ao topo"
          className="fixed bottom-28 right-4 z-40 p-3.5 rounded-full bg-slate-900/90 hover:bg-emerald-400 text-emerald-400 hover:text-slate-950 border border-emerald-500/40 shadow-2xl backdrop-blur-md transition-all duration-300 active:scale-90 group flex items-center justify-center"
        >
          <ArrowUp className="h-5 w-5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      )}

      {/* Floating Bottom Action Bar for WhatsApp / Mini-Cart */}
      {settings?.phone && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pb-6 bg-gradient-to-t from-[#06090e] via-[#06090e]/95 to-transparent backdrop-blur-md">
          <div className="max-w-md mx-auto space-y-2">
            {totalCartItems > 0 ? (
              <button
                onClick={() => setIsCartOpen(true)}
                className="w-full h-14 bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-2xl shadow-emerald-500/25 border border-emerald-300/40 flex items-center justify-between px-5 transition-all duration-200 active:scale-[0.98] group"
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-xl bg-slate-950/20 flex items-center justify-center backdrop-blur-sm">
                    <ShoppingCart className="h-5 w-5 text-slate-950" />
                    <span className="absolute -top-1.5 -right-1.5 bg-slate-950 text-emerald-400 text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center border border-emerald-400/60 shadow">
                      {totalCartItems}
                    </span>
                  </div>
                  <div className="text-left">
                    <span className="block font-black text-xs leading-none">
                      ORÇAMENTO ({totalCartItems} {totalCartItems === 1 ? 'ITEM' : 'ITENS'})
                    </span>
                    <span className="text-[10px] text-slate-900/80 font-bold block mt-0.5">
                      Toque para revisar ou enviar
                    </span>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-xl bg-slate-950/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                  <ChevronRight className="h-4 w-4 stroke-[3]" />
                </div>
              </button>
            ) : (
              <button
                onClick={handleShareWhatsApp}
                className="w-full h-14 bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-2xl shadow-emerald-500/25 border border-emerald-300/40 flex items-center justify-between px-5 transition-all duration-200 active:scale-[0.98] group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-950/20 flex items-center justify-center backdrop-blur-sm">
                    <MessageCircle className="h-5 w-5 fill-slate-950 text-emerald-400" />
                  </div>
                  <div className="text-left">
                    <span className="block font-black text-xs leading-none">
                      FALAR NO WHATSAPP
                    </span>
                    <span className="text-[10px] text-slate-900/80 font-bold block mt-0.5">
                      Toque aqui para fazer o seu pedido!
                    </span>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-xl bg-slate-950/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                  <ChevronRight className="h-4 w-4 stroke-[3]" />
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mini-Carrinho / Drawer Modal de Orçamento */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-6 duration-200"
          >
            {/* Header Modal */}
            <div className="p-4 px-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <ShoppingCart className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-white tracking-wider">
                    Orçamento ({totalCartItems})
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Itens selecionados para enviar no WhatsApp
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {cartList.length > 0 && (
                  <button
                    onClick={handleClearCart}
                    className="p-2 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Limpar carrinho"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 text-slate-400 hover:text-white transition-colors"
                  title="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Itens List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-800/60">
              {cartList.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <ShoppingCart className="h-8 w-8 mx-auto text-slate-600" />
                  <p className="text-sm font-bold">Nenhum item no orçamento</p>
                  <p className="text-xs text-slate-500">Adicione produtos do catálogo acima</p>
                </div>
              ) : (
                cartList.map((item) => (
                  <div key={item.product.id} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-slate-100 uppercase truncate">
                        {item.product.title || item.product.name}
                      </h4>
                      <p className="text-xs font-semibold text-emerald-400 mt-0.5">
                        {formatCurrency(Number(item.product.price) || 0)} cada
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl p-0.5">
                        <button
                          onClick={() => handleUpdateQuantity(item.product.id, -1)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-black text-emerald-400">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(item.product.id, 1)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleRemoveFromCart(item.product.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Remover"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Ação de Enviar Orçamento */}
            {cartList.length > 0 && (
              <div className="p-4 bg-slate-950/80 border-t border-slate-800">
                <button
                  onClick={() => {
                    handleSendCartWhatsApp();
                    setIsCartOpen(false);
                  }}
                  className="w-full h-12 bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <MessageCircle className="h-5 w-5 fill-slate-950 text-emerald-400" />
                  <span>Mandar Orçamento no WhatsApp</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
