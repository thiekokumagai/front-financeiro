import { useState, useEffect } from "react";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { apiFetch } from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Save, Phone, Store } from "lucide-react";

export function GeneralSettingsForm() {
  const { data: settings, isLoading } = useSettings();
  const updateSettingsMutation = useUpdateSettings();

  const [storeName, setStoreName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (settings) {
      const cleanVal = (val: string | null | undefined, defaults: string[]) => {
        if (!val) return "";
        const trimmed = val.trim();
        return defaults.some((d) => d.toLowerCase() === trimmed.toLowerCase())
          ? ""
          : val;
      };

      setStoreName(cleanVal(settings.storeName, ["Minha Loja", "Financeiro"]));
      setPhone(
        cleanVal(settings.phone, [
          "(67) 99999-9999",
          "67999999999",
          "6799999-9999",
        ])
      );
    }
  }, [settings]);

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/g, "($1) $2")
      .replace(/(\d)(\d{4})$/g, "$1-$2")
      .substring(0, 15);
  };

  const handleSave = async () => {
    if (!storeName.trim()) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "O Nome da Loja é obrigatório.",
      });
      return;
    }

    try {
      const storeId = (settings as any)?.storeId;
      if (storeId) {
        await apiFetch(`/stores/${storeId}`, {
          method: "PUT",
          body: JSON.stringify({
            title: storeName,
          }),
        });
      }

      await updateSettingsMutation.mutateAsync({
        storeName,
        phone,
      });

      toast({
        title: "Configurações atualizadas!",
        description: "As informações da loja foram salvas com sucesso.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description:
          err.message || "Ocorreu um erro ao atualizar as configurações.",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-5 text-center text-muted-foreground">
          Carregando configurações...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Store className="h-5 w-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">
              Identidade da Loja
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="font-medium">Nome da Loja *</Label>
              <Input
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Ex: Financeiro"
              />
            </div>

            <div>
              <Label className="font-medium">Telefone / WhatsApp</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={updateSettingsMutation.isPending}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {updateSettingsMutation.isPending
                ? "Salvando..."
                : "Salvar Configurações"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
