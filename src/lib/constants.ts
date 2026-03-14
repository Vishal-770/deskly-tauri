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
