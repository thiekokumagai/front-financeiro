import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  Landmark,
  Settings,
  Users,
  Store as StoreIcon,
  WalletCards,
  Receipt,
  Layers,
  CreditCard,
} from "lucide-react";

export const superAdminNavItems = [
  {
    title: "Dashboard Super Admin",
    url: "/super-admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Lojas Cadastradas",
    url: "/super-admin/lojas",
    icon: StoreIcon,
  },
  {
    title: "Assinaturas",
    url: "/super-admin/assinaturas",
    icon: WalletCards,
  },
  {
    title: "Transações",
    url: "/super-admin/transacoes",
    icon: Receipt,
  },
  {
    title: "Planos de Cobrança",
    url: "/super-admin/planos",
    icon: Layers,
  },
];

export const dashboardNavItem = {
  title: "Dashboard",
  url: "/",
  icon: LayoutDashboard,
};

export const navSections = [
  {
    label: "Catálogo",
    items: [
      { title: "Produtos", url: "/produtos", icon: Package },
      { title: "Categorias", url: "/categorias", icon: FolderTree },
    ],
  },
  {
    label: "Vendas",
    items: [
      { title: "Pedidos", url: "/pedidos", icon: ShoppingBag },
      { title: "Clientes", url: "/clientes", icon: Users },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { title: "Caixa Atual", url: "/financeiro/atual", icon: Landmark },
      { title: "Histórico de Caixas", url: "/caixa", icon: FolderTree },
      { title: "Minha assinatura", url: "/minha-assinatura", icon: CreditCard },
    ],
  },
  {
    label: "Configuração",
    items: [
      { title: "Configuração", url: "/configuracoes", icon: Settings },
    ],
  },
];
