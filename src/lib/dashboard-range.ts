import type { DashboardRange } from "@/hooks/useDashboard";

export type FilterType = "today" | "7days" | "30days" | "6months" | "year" | "custom";

export const FILTER_OPTIONS: { id: Exclude<FilterType, "custom">; label: string }[] = [
  { id: "today", label: "Hoje" },
  { id: "7days", label: "7 dias" },
  { id: "30days", label: "30 dias" },
  { id: "6months", label: "6 meses" },
  { id: "year", label: "Ano" },
];

export const COMPARISON_LABEL: Record<FilterType, string> = {
  today: "vs. ontem",
  "7days": "vs. 7 dias antes",
  "30days": "vs. 30 dias antes",
  "6months": "vs. 6 meses antes",
  year: "vs. ano anterior",
  custom: "vs. período anterior",
};

// A API recebe início e fim como instantes ISO (meia-noite e 23:59:59.999 locais).
export function getPresetRange(filter: Exclude<FilterType, "custom">, now: Date = new Date()): DashboardRange {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  if (filter === "7days") start.setDate(start.getDate() - 6);
  else if (filter === "30days") start.setDate(start.getDate() - 29);
  else if (filter === "6months") start.setMonth(start.getMonth() - 6);
  else if (filter === "year") start.setFullYear(start.getFullYear() - 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

/** Período personalizado: datas "YYYY-MM-DD" do formulário -> instantes ISO (início e fim do dia locais). */
export function customRange(startDate: string, endDate: string): DashboardRange {
  return {
    start: new Date(`${startDate.split("T")[0]}T00:00:00`).toISOString(),
    end: new Date(`${endDate.split("T")[0]}T23:59:59.999`).toISOString(),
  };
}

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

/** "Hoje", "Últimos 7 dias · 08/11 a 14/11", "Período personalizado · 02/01 a 20/01"… */
export function describeRange(filter: FilterType, range: DashboardRange | null): string {
  if (filter === "today") return "Hoje";
  if (!range) return "";
  const label =
    filter === "7days" ? "Últimos 7 dias"
    : filter === "30days" ? "Últimos 30 dias"
    : filter === "6months" ? "Últimos 6 meses"
    : filter === "year" ? "Último ano"
    : "Período personalizado";
  return `${label} · ${shortDate(range.start)} a ${shortDate(range.end)}`;
}
