import { useEffect, useState, useMemo } from "react";
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
} from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { matchesProductSearch } from "@/utils/search";

export default function PublicCatalogPage() {
  const [settings, setSettings] = useState<PublicStoreSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
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
    <div className="min-h-screen bg-[#06090e] text-slate-100 font-sans pb-36 relative overflow-x-hidden selection:bg-emerald-500 selection:text-slate-950">
      {/* Optimized Lightweight Background Layer for Mobile Performance */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#06090e]">
        {/* Static Soft Ambient Glows (No heavy animated blurs) */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-32 w-64 h-64 bg-cyan-500/5 rounded-full blur-2xl" />

        {/* Lightweight Static Mesh Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b98108_1px,transparent_1px),linear-gradient(to_bottom,#10b98108_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-4 space-y-6">
        {/* Header Branding Card with Muscular Fitness Hero Banner & Video Motion Effect */}
        <header className="relative overflow-hidden rounded-3xl bg-slate-950 border border-slate-800/90 text-center backdrop-blur-xl shadow-2xl space-y-4 group">
          {/* Hero Banner Image */}
          <div className="relative h-48 sm:h-56 w-full overflow-hidden">
            <img
              src="/banner-gym.png"
              alt="Fitness Hero Banner"
              className="w-full h-full object-cover object-top scale-105 group-hover:scale-110 transition-transform duration-1000 ease-out"
            />
            {/* Cinematic Video Overlay Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/40 via-transparent to-slate-950/70" />

            <div className="absolute top-3 right-3 z-10">
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 text-xs text-slate-200 hover:text-emerald-300 bg-slate-950/90 hover:bg-slate-900 border border-slate-700/80 px-3 py-1.5 rounded-full transition-all duration-200 active:scale-95 shadow-lg"
              >
                {copiedLink ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400 animate-in zoom-in" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-emerald-400" />
                )}
                <span className="font-semibold text-[11px]">
                  {copiedLink ? "Link Copiado!" : "Compartilhar"}
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

        {/* Search & Category Filter Section */}
        <div className="space-y-3.5 sticky top-3 z-30 pt-1">
          {/* Glass Search Input */}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400/70 group-focus-within:text-emerald-400 transition-colors" />
            <input
              type="text"
              placeholder="Buscar por medicamento, princípio ativo ou dosagem..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-11 pr-4 bg-slate-900 border border-slate-800 focus:border-emerald-500/70 rounded-2xl text-[15px] text-slate-100 placeholder:text-slate-500 focus:outline-none transition-all shadow-xl focus:ring-2 focus:ring-emerald-500/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-white bg-slate-800/80 px-2 py-1 rounded-md"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Glass Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
            <button
              onClick={() => setSelectedCategory("ALL")}
              className={`px-4 py-2 rounded-xl text-xs font-black tracking-wider uppercase whitespace-nowrap transition-all duration-200 border ${
                selectedCategory === "ALL"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/25 scale-[1.02]"
                  : "bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border-slate-800/80 backdrop-blur-md"
              }`}
            >
              TODOS OS ITENS ({products.length})
            </button>

            {categories.map((cat) => {
              const count = products.filter((p) => p.categoryId === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-black tracking-wider uppercase whitespace-nowrap transition-all duration-200 border ${
                    selectedCategory === cat.id
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/25 scale-[1.02]"
                      : "bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border-slate-800/80 backdrop-blur-md"
                  }`}
                >
                  {cat.title.toUpperCase()} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Products List Grouped */}
        {groupedProducts.length === 0 ? (
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
          <div className="space-y-8">
            {groupedProducts.map((group, idx) => (
              <section key={group.category?.id || idx} className="space-y-3.5">
                {/* Category Header with Lighter Highlighted Background */}
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-900/90 border border-emerald-500/30 shadow-md backdrop-blur-md">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/80 animate-pulse" />
                  <h2 className="text-xs font-black uppercase tracking-widest text-emerald-300 whitespace-nowrap">
                    {group.category?.title || "Outros Medicamentos & Suplementos"}
                  </h2>
                  <div className="h-px w-full bg-gradient-to-r from-emerald-400/50 via-emerald-500/20 to-transparent" />
                </div>

                {/* Product Cards Container */}
                <div className="space-y-2.5">
                  {group.items.map((product) => {
                    const isOutOfStock =
                      product.stock !== undefined &&
                      product.stock !== null &&
                      product.stock <= 0;

                    return (
                      <div
                        key={product.id}
                        className="group relative flex items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 hover:border-emerald-500/40 shadow-md"
                      >
                        {/* Product Details */}
                        <div className="min-w-0 flex-1 pl-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm sm:text-base font-black tracking-tight text-white uppercase group-hover:text-emerald-300 transition-colors">
                              {product.title}
                            </span>
                          </div>

                          {product.description && (
                            <p className="text-xs text-slate-400 font-medium leading-relaxed mt-1 line-clamp-2">
                              {product.description}
                            </p>
                          )}
                        </div>

                        {/* Price Badge Only */}
                        <div className="flex items-center shrink-0">
                          {isOutOfStock ? (
                            <span className="text-xs font-bold text-rose-400 bg-rose-950/60 border border-rose-800/60 px-3 py-1.5 rounded-xl inline-block">
                              Indisponível
                            </span>
                          ) : (
                            <span className="text-sm font-black text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 px-4 py-1.5 rounded-xl tracking-tight inline-block shadow-md shadow-emerald-500/20">
                              {formatCurrency(Number(product.price) || 0)}
                            </span>
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

      {/* Floating Bottom Action Bar for WhatsApp */}
      {settings?.phone && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pb-6 bg-gradient-to-t from-[#06090e] via-[#06090e]/95 to-transparent backdrop-blur-md">
          <div className="max-w-md mx-auto">
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
          </div>
        </div>
      )}
    </div>
  );
}
