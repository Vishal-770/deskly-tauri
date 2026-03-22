export type MessType =
  | "Veg-mens"
  | "Non-Veg-mens"
  | "Special-mens"
  | "Veg-womens"
  | "Non-Veg-womens"
  | "Special-womens";

export const MESS_OPTIONS: MessType[] = [
  "Veg-mens",
  "Non-Veg-mens",
  "Special-mens",
  "Veg-womens",
  "Non-Veg-womens",
  "Special-womens",
];

export type LaundryBlock = "A" | "B" | "CB" | "CG" | "D1" | "D2" | "E";

export const LAUNDRY_BLOCKS: LaundryBlock[] = ["A", "B", "CB", "CG", "D1", "D2", "E"];

export const CHART_PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--primary)",
  "var(--foreground)",
];
