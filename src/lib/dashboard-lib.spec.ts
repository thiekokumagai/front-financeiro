import { describe, it, expect } from "vitest";
import { getPresetRange, describeRange, customRange } from "./dashboard-range";
import { metricOf, formatMetric, SORT_OPTIONS } from "./dashboard-metrics";
import { pickAttentionItems } from "./dashboard-attention";
import { formatBRL, formatCompact } from "./dashboard-format";
import type { BestSellerItem, DiagnosisItem } from "@/services/dashboard.service";

describe("dashboard-range (instantes ISO)", () => {
  const now = new Date(2026, 10, 14, 15, 30); // 14/11/2026 15:30 local
  const startOfDay = (y: number, m: number, d: number) => new Date(y, m, d, 0, 0, 0, 0).toISOString();

  it("hoje: da meia-noite às 23:59:59.999 locais", () => {
    expect(getPresetRange("today", now)).toEqual({
      start: startOfDay(2026, 10, 14),
      end: new Date(2026, 10, 14, 23, 59, 59, 999).toISOString(),
    });
  });

  it("7 e 30 dias terminam hoje e contam hoje", () => {
    expect(getPresetRange("7days", now).start).toBe(startOfDay(2026, 10, 8));
    expect(getPresetRange("30days", now).start).toBe(startOfDay(2026, 9, 16));
  });

  it("6 meses e ano", () => {
    expect(getPresetRange("6months", now).start).toBe(startOfDay(2026, 4, 14));
    expect(getPresetRange("year", now).start).toBe(startOfDay(2025, 10, 14));
  });

  it("customRange: início e fim do dia locais, aceitando valor com hora", () => {
    expect(customRange("2026-01-02", "2026-01-20")).toEqual({
      start: new Date(2026, 0, 2, 0, 0, 0, 0).toISOString(),
      end: new Date(2026, 0, 20, 23, 59, 59, 999).toISOString(),
    });
    expect(customRange("2026-01-02T10:00:00", "2026-01-20T03:00:00").start).toBe(new Date(2026, 0, 2, 0, 0, 0, 0).toISOString());
  });

  it("describeRange: rótulo e datas curtas", () => {
    expect(describeRange("today", getPresetRange("today", now))).toBe("Hoje");
    expect(describeRange("7days", getPresetRange("7days", now))).toBe("Últimos 7 dias · 08/11 a 14/11");
    expect(describeRange("custom", customRange("2026-01-02", "2026-01-20"))).toBe("Período personalizado · 02/01 a 20/01");
    expect(describeRange("custom", null)).toBe("");
  });
});

const item = (over: Partial<BestSellerItem>): BestSellerItem => ({
  id: "p",
  title: "P",
  categoryTitle: "C",
  quantity: 3,
  totalRevenue: 150,
  receitaLiquida: 150,
  lucro: 60,
  margem: 40,
  semCusto: false,
  ...over,
});

describe("dashboard-metrics", () => {
  it("tem os 4 critérios de ordenação", () => {
    expect(SORT_OPTIONS.map((o) => o.id)).toEqual(["quantity", "revenue", "profit", "margin"]);
  });

  it("metricOf devolve o valor do critério; sem custo é null em lucro e margem", () => {
    const p = item({});
    expect(metricOf(p, "quantity")).toBe(3);
    expect(metricOf(p, "revenue")).toBe(150);
    expect(metricOf(p, "profit")).toBe(60);
    expect(metricOf(p, "margin")).toBe(40);
    const noCost = item({ lucro: null, margem: null });
    expect(metricOf(noCost, "profit")).toBeNull();
    expect(metricOf(noCost, "margin")).toBeNull();
  });

  it("formatMetric: unidades, moeda, % e 'Sem custo'", () => {
    expect(formatMetric(1200, "quantity")).toBe("1.200 un.");
    expect(formatMetric(12.5, "revenue")).toBe(formatBRL(12.5));
    expect(formatMetric(39.4, "margin")).toBe("39,4%");
    expect(formatMetric(null, "profit")).toBe("Sem custo");
  });
});

const diag = (id: string, severity: DiagnosisItem["severity"]): DiagnosisItem => ({
  id,
  severity,
  title: id,
  detail: "",
  amount: null,
  estimated: false,
});

describe("pickAttentionItems", () => {
  it("só crítico e atenção, na ordem recebida, no máximo 3", () => {
    const items = [diag("a", "critical"), diag("b", "ok"), diag("c", "info"), diag("d", "warning"), diag("e", "warning"), diag("f", "warning")];
    expect(pickAttentionItems(items).map((i) => i.id)).toEqual(["a", "d", "e"]);
  });

  it("sem itens devolve lista vazia", () => {
    expect(pickAttentionItems(undefined)).toEqual([]);
    expect(pickAttentionItems([diag("x", "ok")])).toEqual([]);
  });
});

describe("dashboard-format", () => {
  it("formatBRL sempre com 2 casas (ticket médio 118,6909 não vira R$ 118,691)", () => {
    expect(formatBRL(118.6909)).toBe("R$ 118,69");
    expect(formatBRL(5)).toBe("R$ 5,00");
    expect(formatBRL(1234.5)).toBe("R$ 1.234,50");
    expect(formatBRL(0.005 + 10)).toBe("R$ 10,01");
  });

  it("formatCompact abrevia a partir de mil", () => {
    expect(formatCompact(999)).toBe("999");
    expect(formatCompact(12500)).toBe("12,5 mil");
    expect(formatCompact(1000)).toBe("1 mil");
  });
});
