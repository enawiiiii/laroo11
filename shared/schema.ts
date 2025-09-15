import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  decimal,
  timestamp,
  pgEnum,
  jsonb,
  boolean,
  serial,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const storeEnum = pgEnum("store", ["boutique", "online"]);
export const paymentMethodEnum = pgEnum("payment_method", ["cash", "card", "bank_transfer", "cash_on_delivery"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "in_delivery", "delivered", "cancelled"]);
export const returnTypeEnum = pgEnum("return_type", ["refund", "exchange_color", "exchange_size", "exchange_model"]);

// Employees table
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Products table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  modelNumber: varchar("model_number", { length: 50 }).notNull().unique(),
  brand: varchar("brand", { length: 100 }).notNull(),
  productType: varchar("product_type", { length: 50 }).notNull(),
  storePriceAED: decimal("store_price_aed", { precision: 10, scale: 2 }).notNull(),
  onlinePriceAED: decimal("online_price_aed", { precision: 10, scale: 2 }).notNull(),
  specifications: text("specifications"),
  imageUrl: varchar("image_url", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Product colors table
export const productColors = pgTable("product_colors", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  colorName: varchar("color_name", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Inventory table (sizes and quantities per color per store)
export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  productColorId: integer("product_color_id").references(() => productColors.id, { onDelete: "cascade" }).notNull(),
  store: storeEnum("store").notNull(),
  size: decimal("size", { precision: 4, scale: 1 }).notNull(), // Valid sizes: 38, 40, 42, 44, 46, 48, 50, 52
  quantity: integer("quantity").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sales table (Boutique sales)
export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  saleId: varchar("sale_id", { length: 50 }).notNull().unique(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  store: storeEnum("store").notNull(),
  productColorId: integer("product_color_id").references(() => productColors.id).notNull(),
  size: decimal("size", { precision: 4, scale: 1 }).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Orders table (Online orders)
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderId: varchar("order_id", { length: 50 }).notNull().unique(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  customerName: varchar("customer_name", { length: 100 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 20 }).notNull(),
  customerEmirate: varchar("customer_emirate", { length: 50 }).notNull(),
  customerAddress: text("customer_address").notNull(),
  trackingNumber: varchar("tracking_number", { length: 100 }),
  notes: text("notes"),
  productColorId: integer("product_color_id").references(() => productColors.id).notNull(),
  size: decimal("size", { precision: 4, scale: 1 }).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: orderStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Returns table
export const returns = pgTable("returns", {
  id: serial("id").primaryKey(),
  returnId: varchar("return_id", { length: 50 }).notNull().unique(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  store: storeEnum("store").notNull(),
  originalSaleId: varchar("original_sale_id", { length: 50 }),
  originalOrderId: varchar("original_order_id", { length: 50 }),
  returnType: returnTypeEnum("return_type").notNull(),
  originalProductColorId: integer("original_product_color_id").references(() => productColors.id).notNull(),
  originalSize: decimal("original_size", { precision: 4, scale: 1 }).notNull(),
  originalQuantity: integer("original_quantity").notNull(),
  newProductColorId: integer("new_product_color_id").references(() => productColors.id),
  newSize: decimal("new_size", { precision: 4, scale: 1 }),
  newQuantity: integer("new_quantity"),
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }),
  priceDifference: decimal("price_difference", { precision: 10, scale: 2 }),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const productsRelations = relations(products, ({ many }) => ({
  colors: many(productColors),
}));

export const productColorsRelations = relations(productColors, ({ one, many }) => ({
  product: one(products, {
    fields: [productColors.productId],
    references: [products.id],
  }),
  inventory: many(inventory),
  sales: many(sales),
  orders: many(orders),
  returns: many(returns),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
  productColor: one(productColors, {
    fields: [inventory.productColorId],
    references: [productColors.id],
  }),
}));

export const salesRelations = relations(sales, ({ one }) => ({
  employee: one(employees, {
    fields: [sales.employeeId],
    references: [employees.id],
  }),
  productColor: one(productColors, {
    fields: [sales.productColorId],
    references: [productColors.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  employee: one(employees, {
    fields: [orders.employeeId],
    references: [employees.id],
  }),
  productColor: one(productColors, {
    fields: [orders.productColorId],
    references: [productColors.id],
  }),
}));

export const returnsRelations = relations(returns, ({ one }) => ({
  employee: one(employees, {
    fields: [returns.employeeId],
    references: [employees.id],
  }),
  originalProductColor: one(productColors, {
    fields: [returns.originalProductColorId],
    references: [productColors.id],
  }),
  newProductColor: one(productColors, {
    fields: [returns.newProductColorId],
    references: [productColors.id],
  }),
}));

export const employeesRelations = relations(employees, ({ many }) => ({
  sales: many(sales),
  orders: many(orders),
  returns: many(returns),
}));

// Insert schemas
export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  // Add custom validation for sizes
  modelNumber: z.string().min(1, "رقم الموديل مطلوب"),
  brand: z.string().min(1, "اسم الشركة مطلوب"),
  productType: z.string().min(1, "نوع القطعة مطلوب"),
  storePriceAED: z.string().min(1, "سعر البوتيك مطلوب"),
  onlinePriceAED: z.string().min(1, "السعر الأونلاين مطلوب"),
});

// Valid sizes constraint
export const VALID_SIZES = [38, 40, 42, 44, 46, 48, 50, 52] as const;
export const sizeSchema = z.number().refine(
  (size) => VALID_SIZES.includes(size as typeof VALID_SIZES[number]),
  { message: "المقاس يجب أن يكون من المقاسات المتاحة: 38, 40, 42, 44, 46, 48, 50, 52" }
);

// Payment method validation schemas
export const boutiquePaymentSchema = z.object({
  paymentMethod: z.enum(["cash", "card"], { message: "البوتيك يقبل الدفع النقدي أو الفيزا فقط" }),
  store: z.literal("boutique"),
  taxAmount: z.string().optional(),
  totalAmount: z.string(),
});

export const onlinePaymentSchema = z.object({
  paymentMethod: z.enum(["bank_transfer", "cash_on_delivery"], { message: "الأونلاين يقبل التحويل البنكي أو الدفع عند الاستلام فقط" }),
  totalAmount: z.string(),
});

export const insertProductColorSchema = createInsertSchema(productColors).omit({
  id: true,
  createdAt: true,
});

export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  size: sizeSchema.transform(String), // Convert to string for database storage
});

export const insertSaleSchema = createInsertSchema(sales).omit({
  id: true,
  createdAt: true,
}).extend({
  size: sizeSchema.transform(String),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  size: sizeSchema.transform(String),
  customerName: z.string().min(1, "اسم الزبون مطلوب"),
  customerPhone: z.string().min(1, "رقم الهاتف مطلوب"),
  customerEmirate: z.string().min(1, "الإمارة مطلوبة"),
  customerAddress: z.string().min(1, "العنوان مطلوب"),
});

export const insertReturnSchema = createInsertSchema(returns).omit({
  id: true,
  createdAt: true,
}).extend({
  originalSize: sizeSchema.transform(String),
  newSize: z.optional(sizeSchema.transform(String)),
});

// Types
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type ProductColor = typeof productColors.$inferSelect;
export type InsertProductColor = z.infer<typeof insertProductColorSchema>;

export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = z.infer<typeof insertInventorySchema>;

export type Sale = typeof sales.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type Return = typeof returns.$inferSelect;
export type InsertReturn = z.infer<typeof insertReturnSchema>;

// Additional types for complex operations
export type ProductWithColors = Product & {
  colors: (ProductColor & {
    inventory: Inventory[];
  })[];
};

export type SaleWithDetails = Sale & {
  employee: Employee;
  productColor: ProductColor & {
    product: Product;
  };
};

export type OrderWithDetails = Order & {
  employee: Employee;
  productColor: ProductColor & {
    product: Product;
  };
};

export type ReturnWithDetails = Return & {
  employee: Employee;
  originalProductColor: ProductColor & {
    product: Product;
  };
  newProductColor?: ProductColor & {
    product: Product;
  };
};
