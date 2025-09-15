export const EMPLOYEES = [
  { id: "abdulrahman", name: "Abdulrahman", icon: "fas fa-user-tie" },
  { id: "heba", name: "Heba", icon: "fas fa-user" },
  { id: "hadeel", name: "Hadeel", icon: "fas fa-user" },
] as const;

export const STORES = [
  { id: "boutique", name: "Boutique", icon: "fas fa-store" },
  { id: "online", name: "Online", icon: "fas fa-laptop" },
] as const;

export const PAYMENT_METHODS = {
  boutique: [
    { value: "cash", label: "Cash (No Tax)" },
    { value: "card", label: "Card (5% Tax)" },
  ],
  online: [
    { value: "cash_on_delivery", label: "Cash on Delivery" },
    { value: "bank_transfer", label: "Bank Transfer" },
  ],
} as const;

export const ORDER_STATUSES = [
  { value: "pending", label: "Pending", color: "yellow" },
  { value: "in_delivery", label: "In Delivery", color: "blue" },
  { value: "delivered", label: "Delivered", color: "green" },
  { value: "cancelled", label: "Cancelled", color: "red" },
] as const;

export const RETURN_TYPES = [
  { value: "refund", label: "Refund (No Replacement)" },
  { value: "exchange_color", label: "Exchange - Color to Color" },
  { value: "exchange_size", label: "Exchange - Size to Size" },
  { value: "exchange_model", label: "Exchange - Model to Model" },
] as const;

export const EMIRATES = [
  "Abu Dhabi",
  "Dubai",
  "Sharjah",
  "Ajman",
  "Umm Al Quwain",
  "Ras Al Khaimah",
  "Fujairah",
] as const;

export const PRODUCT_TYPES = [
  "Dress",
  "Shirt",
  "Pants",
  "Blazer",
  "Shoes",
  "Accessories",
  "Bag",
  "Jacket",
] as const;

export const BRANDS = [
  "Zara",
  "H&M",
  "Mango",
  "Forever 21",
  "Massimo Dutti",
  "Pull & Bear",
  "Bershka",
  "Stradivarius",
] as const;

export const SIZES = [
  "34", "34.5", "35", "35.5", "36", "36.5", "37", "37.5", "38", "38.5",
  "39", "39.5", "40", "40.5", "41", "41.5", "42", "42.5", "43", "43.5",
  "44", "44.5", "45", "45.5", "46", "XS", "S", "M", "L", "XL", "XXL"
] as const;

export const COLORS = [
  "Red", "Blue", "Green", "Yellow", "Orange", "Purple", "Pink", "Brown",
  "Black", "White", "Gray", "Navy", "Maroon", "Beige", "Gold", "Silver"
] as const;
