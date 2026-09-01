import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Copy, ExternalLink, Share2, Smartphone, Sparkles, Check, MessageCircle, Layers, Package } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { openWhatsApp } from "@/utils/whatsapp";

export default function DigitalCatalogAdminPage() {
  const { toast } = useToast();
  const { data: settings } = useSettings();
  const [copied, setCopied] = useState(false);

  const catalogUrl = useMemo(() => {
    const origin = window.location.origin;
    return `${origin}/catalogo`;
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(catalogUrl);
    setCopied(true);
    toast({
      title: "Link Copiado!",
      description: "O link público do catálogo foi copiado para a área de transferência.",
    });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    const message = `Olá! Confira nosso catálogo interativo de produtos:\n${catalogUrl}`;
    openWhatsApp({
      phone: settings?.phone,
      text: message,
    });
  };

  return (
    <div className="w-full max-w-none space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-slate-900 to-black text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-widest">
            <Sparkles className="h-4 w-4 text-amber-400" />
            Módulo de Divulgação & Vendas
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Catálogo Digital Interativo</h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Envie este link público para seus clientes. Todos os produtos e categorias cadastrados aparecem automaticamente em um visual luxo/escuro em formato de tabela interativa.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Button
            onClick={handleCopyLink}
            className="bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold gap-2 rounded-xl shadow-lg shadow-amber-400/20"
          >
            {copied ? <Check className="h-4 w-4 text-zinc-950" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? "Link Copiado!" : "Copiar Link Público"}</span>
          </Button>

          <Button
            variant="secondary"
            onClick={() => window.open(catalogUrl, "_blank")}
            className="bg-white text-zinc-950 hover:bg-slate-200 font-bold gap-2 rounded-xl border border-zinc-200 shadow-sm"
          >
            <ExternalLink className="h-4 w-4 text-zinc-950" />
            <span>Abrir Catálogo</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Link & Actions */}
        <div className="space-y-6 lg:col-span-1">
          {/* Public Link Card */}
          <Card className="rounded-2xl border-slate-200/80 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Share2 className="h-4 w-4 text-amber-500" />
                Link Público do Catálogo
              </CardTitle>
              <CardDescription className="text-xs">
                Este link pode ser enviado no WhatsApp, Instagram ou fixado na bio da sua loja.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={catalogUrl}
                  className="font-mono text-xs bg-slate-50 border-slate-200 h-10 select-all"
                />
                <Button size="icon" variant="secondary" onClick={handleCopyLink} title="Copiar">
                  {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Button
                  onClick={handleOpenWhatsApp}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold gap-2 text-white rounded-xl h-11 shadow-md shadow-emerald-600/20"
                >
                  <MessageCircle className="h-4 w-4 fill-white" />
                  <span>Compartilhar no WhatsApp</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* How it Works Card */}
          <Card className="rounded-2xl border-slate-200/80 shadow-sm bg-gradient-to-b from-white to-slate-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Recursos do Catálogo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white border border-slate-100 shadow-2xs">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0">
                  <Package className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-800 block">Sincronização Dinâmica</span>
                  <span>Produtos e preços são atualizados automaticamente quando você altera na plataforma.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white border border-slate-100 shadow-2xs">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-800 block">Pedido via WhatsApp</span>
                  <span>O cliente escolhe as quantidades e o botão inferior monta a mensagem do pedido pronta.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white border border-slate-100 shadow-2xs">
                <div className="p-2 rounded-lg bg-violet-100 text-violet-700 shrink-0">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-800 block">Filtro por Categoria</span>
                  <span>Visualização limpa em tabela tipo cápsula dividida por categorias.</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Mobile Preview Frame */}
        <div className="lg:col-span-2 flex flex-col items-center justify-center bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-widest">
            <Smartphone className="h-4 w-4 text-amber-400" />
            Visualização em Tempo Real (Celular)
          </div>

          {/* Phone Frame */}
          <div className="relative w-full max-w-[380px] h-[720px] bg-black rounded-[40px] p-3 border-4 border-slate-700 shadow-2xl shadow-black/80 overflow-hidden">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-5 w-36 bg-slate-900 rounded-b-xl z-30 flex items-center justify-center">
              <div className="w-10 h-1 bg-slate-700 rounded-full" />
            </div>

            {/* Live iframe */}
            <iframe
              src={catalogUrl}
              title="Pré-visualização do Catálogo Digital"
              className="w-full h-full rounded-[28px] bg-slate-950 border-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
