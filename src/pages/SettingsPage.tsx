import { PaymentSettingsForm } from "@/components/settings/PaymentSettingsForm";
import { GeneralSettingsForm } from "@/components/settings/GeneralSettingsForm";
import { PaymentRulesSettingsForm } from "@/components/settings/PaymentRulesSettingsForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Store, QrCode, Percent } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações da Loja</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie a identidade da loja, formas de pagamento e regras de taxa/desconto.
        </p>
      </div>

      <Tabs defaultValue="geral" className="space-y-6">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 gap-2 h-auto p-1.5 bg-muted/60">
          <TabsTrigger value="geral" className="flex items-center gap-2 py-2 px-3 justify-center text-xs font-semibold">
            <Store className="h-4 w-4" />
            Identidade
          </TabsTrigger>
          <TabsTrigger value="recebimentos" className="flex items-center gap-2 py-2 px-3 justify-center text-xs font-semibold">
            <QrCode className="h-4 w-4" />
            Opções de Recebimento
          </TabsTrigger>
          <TabsTrigger value="taxas" className="flex items-center gap-2 py-2 px-3 justify-center text-xs font-semibold">
            <Percent className="h-4 w-4" />
            Descontos &amp; Taxas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-4 outline-none">
          <GeneralSettingsForm />
        </TabsContent>

        <TabsContent value="recebimentos" className="space-y-4 outline-none">
          <PaymentSettingsForm />
        </TabsContent>

        <TabsContent value="taxas" className="space-y-4 outline-none">
          <PaymentRulesSettingsForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
