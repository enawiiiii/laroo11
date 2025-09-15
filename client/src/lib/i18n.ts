// Arabic translations for the LaRosa Fashion Store Management System

export const translations = {
  // Navigation & Common
  "dashboard": "لوحة التحكم",
  "inventory": "إدارة المخزون",
  "sales": "المبيعات",
  "orders": "الطلبات",
  "returns": "المرتجعات",
  "reports": "التقارير",
  "logout": "تسجيل الخروج",
  "login": "تسجيل الدخول",
  "employee": "الموظف",
  "store": "المتجر",
  "select_employee": "اختر الموظف",
  "select_store": "اختر المتجر",
  
  // Product Management
  "add_product": "إضافة منتج",
  "edit_product": "تعديل المنتج",
  "delete_product": "حذف المنتج",
  "product_details": "تفاصيل المنتج",
  "model_number": "رقم الموديل",
  "brand": "الشركة",
  "product_type": "نوع القطعة",
  "price": "السعر",
  "store_price": "سعر البوتيك",
  "online_price": "السعر الأونلاين",
  "specifications": "المواصفات",
  "image_url": "رابط الصورة",
  "colors": "الألوان",
  "sizes": "المقاسات",
  "stock": "المخزون",
  "available_stock": "المخزون المتاح",
  "quantity": "الكمية",
  "add_color": "إضافة لون",
  "remove_color": "إزالة لون",
  "add_size": "إضافة مقاس",
  "size": "المقاس",
  
  // Sales & Orders
  "new_sale": "بيع جديد",
  "new_order": "طلب جديد",
  "sale_details": "تفاصيل البيع",
  "order_details": "تفاصيل الطلب",
  "customer_name": "اسم الزبون",
  "customer_phone": "رقم الهاتف",
  "customer_address": "العنوان",
  "customer_emirate": "الإمارة",
  "tracking_number": "رقم التتبع",
  "payment_method": "طريقة الدفع",
  "cash": "نقدي",
  "card": "بطاقة ائتمان",
  "visa": "فيزا",
  "bank_transfer": "تحويل بنكي",
  "cash_on_delivery": "دفع عند الاستلام",
  "tax": "الضريبة",
  "total": "المجموع",
  "subtotal": "المبلغ الفرعي",
  "unit_price": "سعر الوحدة",
  
  // Status
  "pending": "في الانتظار",
  "processing": "قيد المعالجة",
  "in_delivery": "في الطريق",
  "delivered": "تم التوصيل",
  "cancelled": "ملغي",
  "completed": "مكتمل",
  
  // Actions
  "save": "حفظ",
  "cancel": "إلغاء",
  "edit": "تعديل",
  "delete": "حذف",
  "view": "عرض",
  "add": "إضافة",
  "create": "إنشاء",
  "update": "تحديث",
  "search": "بحث",
  "filter": "تصفية",
  "export": "تصدير",
  "print": "طباعة",
  "back": "رجوع",
  "next": "التالي",
  "previous": "السابق",
  
  // Messages
  "success": "نجح",
  "error": "خطأ",
  "warning": "تحذير",
  "info": "معلومات",
  "loading": "جاري التحميل...",
  "no_data": "لا توجد بيانات",
  "confirm_delete": "هل أنت متأكد من الحذف؟",
  "operation_successful": "تمت العملية بنجاح",
  "operation_failed": "فشلت العملية",
  "validation_error": "خطأ في البيانات المدخلة",
  "required_field": "هذا الحقل مطلوب",
  "invalid_input": "المدخل غير صحيح",
  
  // Dashboard
  "total_products": "إجمالي المنتجات",
  "total_sales": "إجمالي المبيعات",
  "total_orders": "إجمالي الطلبات",
  "revenue": "الإيرادات",
  "today_sales": "مبيعات اليوم",
  "this_month": "هذا الشهر",
  "top_products": "أفضل المنتجات",
  "recent_activities": "الأنشطة الأخيرة",
  
  // Returns
  "return_type": "نوع الإرجاع",
  "refund": "استرداد",
  "exchange": "استبدال",
  "exchange_color": "استبدال لون",
  "exchange_size": "استبدال مقاس",
  "exchange_model": "استبدال موديل",
  "return_reason": "سبب الإرجاع",
  "original_sale": "البيع الأصلي",
  "new_product": "المنتج الجديد",
  "refund_amount": "مبلغ الاسترداد",
  "price_difference": "فرق السعر",
  
  // Form Labels
  "create_product": "إنشاء منتج جديد",
  "product_information": "معلومات المنتج",
  "inventory_management": "إدارة المخزون",
  "colors_inventory": "الألوان والمخزون",
  "sale_information": "معلومات البيع",
  "order_information": "معلومات الطلب",
  "customer_information": "معلومات الزبون",
  "return_information": "معلومات الإرجاع",
  
  // Buttons
  "view_stock": "عرض المخزون",
  "add_to_inventory": "إضافة للمخزون",
  "create_sale": "إنشاء بيع",
  "create_order": "إنشاء طلب",
  "process_return": "معالجة الإرجاع",
  
  // Boutique vs Online
  "boutique": "البوتيك",
  "online": "أونلاين",
  "boutique_store": "متجر البوتيك",
  "online_store": "المتجر الأونلاين",
  
  // Emirates
  "abu_dhabi": "أبوظبي",
  "dubai": "دبي",
  "sharjah": "الشارقة",
  "ajman": "عجمان",
  "umm_al_quwain": "أم القيوين",
  "ras_al_khaimah": "رأس الخيمة",
  "fujairah": "الفجيرة"
} as const;

export type TranslationKey = keyof typeof translations;

// Hook to use translations
export function useI18n() {
  const t = (key: TranslationKey): string => {
    return translations[key] || key;
  };

  return { t };
}