export const EMPLOYEES = [
  { id: "abdulrahman", name: "عبد الرحمن", icon: "fas fa-user-tie" },
  { id: "heba", name: "هبه", icon: "fas fa-user" },
  { id: "hadeel", name: "هديل", icon: "fas fa-user" },
] as const;

export const STORES = [
  { id: "boutique", name: "البوتيك", icon: "fas fa-store" },
  { id: "online", name: "أونلاين", icon: "fas fa-laptop" },
] as const;

export const PAYMENT_METHODS = {
  boutique: [
    { value: "cash", label: "نقدي" },
    { value: "card", label: "فيزا (ضريبة 5%)" },
  ],
  online: [
    { value: "bank_transfer", label: "تحويل بنكي" },
    { value: "cash_on_delivery", label: "دفع عند الاستلام" },
  ],
} as const;

export const ORDER_STATUSES = [
  { value: "pending", label: "في الانتظار", color: "yellow" },
  { value: "in_delivery", label: "في الطريق", color: "blue" },
  { value: "delivered", label: "تم التوصيل", color: "green" },
  { value: "cancelled", label: "ملغي", color: "red" },
] as const;

export const RETURN_TYPES = [
  { value: "refund", label: "استرداد" },
  { value: "exchange_color", label: "استبدال لون" },
  { value: "exchange_size", label: "استبدال مقاس" },
  { value: "exchange_model", label: "استبدال موديل" },
] as const;

export const EMIRATES = [
  "أبوظبي",
  "دبي",
  "الشارقة",
  "عجمان",
  "أم القيوين",
  "رأس الخيمة",
  "الفجيرة",
] as const;

export const PRODUCT_TYPES = [
  "فستان",
  "بلوزة",
  "بنطال",
  "جاكيت",
  "حذاء",
  "اكسسوارات",
  "حقيبة",
  "معطف",
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
  "أخرى",
] as const;

export const SIZES = [
  "38", "40", "42", "44", "46", "48", "50", "52"
] as const;

export const COLORS = [
  "أحمر", "أزرق", "أخضر", "أصفر", "برتقالي", "بنفسجي", "وردي", "بني",
  "أسود", "أبيض", "رمادي", "كحلي", "عنابي", "بيج", "ذهبي", "فضي"
] as const;
