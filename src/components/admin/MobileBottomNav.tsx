import { NavLink } from "react-router-dom";
import { LayoutDashboard, Package, Plus, ShoppingBag, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border md:hidden pb-[env(safe-area-inset-bottom)] shadow-lg">
      <div className="flex h-16 items-center justify-around px-1 relative">
        {/* Dashboard */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-all duration-200 select-none",
              isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
            )
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200",
                  isActive ? "bg-primary/15 text-primary scale-105" : "text-muted-foreground"
                )}
              >
                <LayoutDashboard className={cn("h-5 w-5", isActive ? "stroke-[2.5px]" : "stroke-[1.75px]")} />
              </div>
              <span className="truncate max-w-[76px] leading-tight text-[10px] mt-0.5">
                Dashboard
              </span>
            </>
          )}
        </NavLink>

        {/* Produtos */}
        <NavLink
          to="/produtos"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-all duration-200 select-none mr-2",
              isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
            )
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200",
                  isActive ? "bg-primary/15 text-primary scale-105" : "text-muted-foreground"
                )}
              >
                <Package className={cn("h-5 w-5", isActive ? "stroke-[2.5px]" : "stroke-[1.75px]")} />
              </div>
              <span className="truncate max-w-[76px] leading-tight text-[10px] mt-0.5">
                Produtos
              </span>
            </>
          )}
        </NavLink>

        {/* Central Plus / Novo Pedido Button */}
        <div className="relative -top-5 flex justify-center items-center z-10">
          <NavLink
            to="/pedidos/novo"
            aria-label="Novo Pedido"
            className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:brightness-110 active:scale-95 transition-all duration-200"
          >
            <Plus className="h-7 w-7 stroke-[2.5px]" />
          </NavLink>
        </div>

        {/* Pedidos */}
        <NavLink
          to="/pedidos"
          end
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-all duration-200 select-none ml-2",
              isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
            )
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200",
                  isActive ? "bg-primary/15 text-primary scale-105" : "text-muted-foreground"
                )}
              >
                <ShoppingBag className={cn("h-5 w-5", isActive ? "stroke-[2.5px]" : "stroke-[1.75px]")} />
              </div>
              <span className="truncate max-w-[76px] leading-tight text-[10px] mt-0.5">
                Pedidos
              </span>
            </>
          )}
        </NavLink>

        {/* Caixa Atual */}
        <NavLink
          to="/financeiro/atual"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-all duration-200 select-none",
              isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
            )
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200",
                  isActive ? "bg-primary/15 text-primary scale-105" : "text-muted-foreground"
                )}
              >
                <Landmark className={cn("h-5 w-5", isActive ? "stroke-[2.5px]" : "stroke-[1.75px]")} />
              </div>
              <span className="truncate max-w-[76px] leading-tight text-[10px] mt-0.5">
                Caixa Atual
              </span>
            </>
          )}
        </NavLink>
      </div>
    </nav>
  );
}

