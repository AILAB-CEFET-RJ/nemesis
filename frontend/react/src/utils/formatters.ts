// Formata valores monetários em reais (R$)
export function formatCurrencyBR(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return String(value);
  return num.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Formata números decimais com vírgula e 2 casas
export function formatNumberBR(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return String(value);
  return num.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Formata números inteiros (sem casas decimais)
export function formatIntegerBR(value: number | string): string {
  const num = typeof value === "string" ? parseInt(value) : value;
  if (isNaN(num)) return String(value);
  return num.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}

// Formata data no padrão brasileiro (dd/mm/aaaa)
export function formatDateBR(value: string | Date): string {
  const date = new Date(value);
  if (isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}
