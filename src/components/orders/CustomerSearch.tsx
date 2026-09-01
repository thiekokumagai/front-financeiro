import { useState, useEffect } from "react";
import { Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useCustomers } from "@/hooks/useCustomers";
import type { Customer } from "@/services/customers.service";
import { formatPhone } from "@/utils/formatters";

interface CustomerSearchProps {
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
}

export function CustomerSearch({ selectedCustomer, onSelectCustomer }: CustomerSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const [customerName, setCustomerName] = useState(selectedCustomer?.name || "");
  const [customerPhone, setCustomerPhone] = useState(selectedCustomer?.phone || "");

  useEffect(() => {
    if (selectedCustomer) {
      setCustomerName(selectedCustomer.name);
      setCustomerPhone(selectedCustomer.phone);
    }
  }, [selectedCustomer]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading } = useCustomers(debouncedTerm ? debouncedTerm : undefined, 1, 10);
  const customers = data?.data || [];

  const handleSelect = (cust: Customer) => {
    onSelectCustomer(cust);
    setCustomerName(cust.name);
    setCustomerPhone(cust.phone);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleNameChange = (val: string) => {
    setCustomerName(val);
    onSelectCustomer({
      id: selectedCustomer?.id || "temp_" + Date.now(),
      name: val,
      phone: customerPhone,
    });
  };

  const handlePhoneChange = (val: string) => {
    const formatted = formatPhone(val);
    setCustomerPhone(formatted);
    onSelectCustomer({
      id: selectedCustomer?.id || "temp_" + Date.now(),
      name: customerName,
      phone: formatted,
    });
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Buscar cliente cadastrado por nome ou telefone..."
          className="pl-9 h-11"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />

        {isOpen && searchTerm && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-auto">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-slate-400">Buscando...</div>
            ) : customers.length > 0 ? (
              <div className="py-1">
                {customers.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                    onClick={() => handleSelect(c)}
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-400" />
                      <div>
                        <div className="font-semibold text-slate-800 text-sm">{c.name}</div>
                        <div className="text-xs text-slate-500">{formatPhone(c.phone)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-slate-500">
                Nenhum cliente encontrado. Preencha os campos abaixo.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">Nome do Cliente *</label>
          <Input
            placeholder="Nome Completo"
            value={customerName}
            onChange={(e) => handleNameChange(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">Telefone / WhatsApp *</label>
          <Input
            placeholder="(00) 00000-0000"
            value={customerPhone}
            onChange={(e) => handlePhoneChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
