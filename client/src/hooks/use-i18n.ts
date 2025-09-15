import { useState, useEffect } from "react";

interface I18nContextType {
  language: "en" | "ar";
  direction: "ltr" | "rtl";
  setLanguage: (lang: "en" | "ar") => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Navigation
    "nav.dashboard": "Dashboard",
    "nav.inventory": "Inventory Management", 
    "nav.sales": "Sales",
    "nav.orders": "Orders",
    "nav.returns": "Returns & Exchanges",
    "nav.reports": "Reports",
    
    // Common
    "common.employee": "Employee",
    "common.store": "Store",
    "common.boutique": "Boutique",
    "common.online": "Online",
    "common.search": "Search",
    "common.filter": "Filter",
    "common.add": "Add",
    "common.edit": "Edit",
    "common.delete": "Delete",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.submit": "Submit",
    "common.loading": "Loading...",
    
    // Products
    "product.code": "Product Code",
    "product.model": "Model Number",
    "product.brand": "Brand",
    "product.type": "Product Type",
    "product.price.store": "Store Price",
    "product.price.online": "Online Price",
    "product.specifications": "Specifications",
    "product.image": "Product Image",
    "product.color": "Color",
    "product.size": "Size",
    "product.quantity": "Quantity",
    "product.stock": "Stock",
    
    // Sales
    "sales.payment.method": "Payment Method",
    "sales.payment.cash": "Cash (No Tax)",
    "sales.payment.card": "Card (5% Tax)",
    "sales.total": "Total Amount",
    "sales.tax": "Tax Amount",
    "sales.complete": "Complete Sale",
    
    // Orders
    "order.customer.name": "Customer Name",
    "order.customer.phone": "Phone Number",
    "order.customer.emirate": "Emirate",
    "order.customer.address": "Address",
    "order.tracking": "Tracking Number",
    "order.status": "Order Status",
    "order.notes": "Notes",
    "order.payment.cod": "Cash on Delivery",
    "order.payment.transfer": "Bank Transfer",
    
    // Returns
    "return.type": "Return Type",
    "return.refund": "Refund (No Replacement)",
    "return.exchange.color": "Exchange - Color to Color",
    "return.exchange.size": "Exchange - Size to Size", 
    "return.exchange.model": "Exchange - Model to Model",
    "return.original": "Original Product",
    "return.new": "New Product",
    "return.reason": "Reason",
    
    // Status
    "status.pending": "Pending",
    "status.in_delivery": "In Delivery",
    "status.delivered": "Delivered",
    "status.cancelled": "Cancelled",
    "status.in_stock": "In Stock",
    "status.low_stock": "Low Stock",
    "status.out_of_stock": "Out of Stock"
  },
  ar: {
    // Navigation
    "nav.dashboard": "لوحة التحكم",
    "nav.inventory": "إدارة المخزون",
    "nav.sales": "المبيعات",
    "nav.orders": "الطلبات",
    "nav.returns": "المرتجعات والاستبدال",
    "nav.reports": "التقارير",
    
    // Common
    "common.employee": "الموظف",
    "common.store": "المتجر",
    "common.boutique": "البوتيك",
    "common.online": "أونلاين",
    "common.search": "بحث",
    "common.filter": "تصفية",
    "common.add": "إضافة",
    "common.edit": "تعديل",
    "common.delete": "حذف",
    "common.save": "حفظ",
    "common.cancel": "إلغاء",
    "common.submit": "إرسال",
    "common.loading": "جاري التحميل...",
    
    // Products
    "product.code": "كود المنتج",
    "product.model": "رقم الموديل",
    "product.brand": "العلامة التجارية",
    "product.type": "نوع المنتج",
    "product.price.store": "سعر المتجر",
    "product.price.online": "السعر الإلكتروني",
    "product.specifications": "المواصفات",
    "product.image": "صورة المنتج",
    "product.color": "اللون",
    "product.size": "المقاس",
    "product.quantity": "الكمية",
    "product.stock": "المخزون",
    
    // Sales
    "sales.payment.method": "طريقة الدفع",
    "sales.payment.cash": "نقدي (بدون ضريبة)",
    "sales.payment.card": "بطاقة (ضريبة 5%)",
    "sales.total": "المبلغ الإجمالي",
    "sales.tax": "مبلغ الضريبة",
    "sales.complete": "إتمام البيع",
    
    // Orders
    "order.customer.name": "اسم العميل",
    "order.customer.phone": "رقم الهاتف",
    "order.customer.emirate": "الإمارة",
    "order.customer.address": "العنوان",
    "order.tracking": "رقم التتبع",
    "order.status": "حالة الطلب",
    "order.notes": "ملاحظات",
    "order.payment.cod": "الدفع عند الاستلام",
    "order.payment.transfer": "تحويل بنكي",
    
    // Returns
    "return.type": "نوع الإرجاع",
    "return.refund": "استرداد (بدون استبدال)",
    "return.exchange.color": "استبدال - لون بلون",
    "return.exchange.size": "استبدال - مقاس بمقاس",
    "return.exchange.model": "استبدال - موديل بموديل",
    "return.original": "المنتج الأصلي",
    "return.new": "المنتج الجديد",
    "return.reason": "السبب",
    
    // Status
    "status.pending": "في الانتظار",
    "status.in_delivery": "في التوصيل",
    "status.delivered": "تم التوصيل",
    "status.cancelled": "ملغى",
    "status.in_stock": "متوفر",
    "status.low_stock": "مخزون منخفض",
    "status.out_of_stock": "غير متوفر"
  }
};

export function useI18n(): I18nContextType {
  const [language, setLanguageState] = useState<"en" | "ar">("en");
  const [direction, setDirection] = useState<"ltr" | "rtl">("ltr");

  useEffect(() => {
    // Load saved language from localStorage
    const savedLanguage = localStorage.getItem("larosa_language") as "en" | "ar";
    if (savedLanguage) {
      setLanguageState(savedLanguage);
      setDirection(savedLanguage === "ar" ? "rtl" : "ltr");
    }
  }, []);

  const setLanguage = (lang: "en" | "ar") => {
    setLanguageState(lang);
    setDirection(lang === "ar" ? "rtl" : "ltr");
    localStorage.setItem("larosa_language", lang);
    
    // Update document direction
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  return {
    language,
    direction,
    setLanguage,
    t,
  };
}
