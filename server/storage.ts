import {
  employees,
  products,
  productColors,
  inventory,
  sales,
  orders,
  returns,
  type Employee,
  type InsertEmployee,
  type Product,
  type InsertProduct,
  type ProductColor,
  type InsertProductColor,
  type Inventory,
  type InsertInventory,
  type Sale,
  type InsertSale,
  type Order,
  type InsertOrder,
  type Return,
  type InsertReturn,
  type ProductWithColors,
  type SaleWithDetails,
  type OrderWithDetails,
  type ReturnWithDetails,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, like, ilike } from "drizzle-orm";

export interface IStorage {
  // Employee operations
  getEmployees(): Promise<Employee[]>;
  getEmployee(id: number): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;

  // Product operations
  getProducts(store?: string, searchTerm?: string): Promise<ProductWithColors[]>;
  getProduct(id: number): Promise<ProductWithColors | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;

  // Product color operations
  createProductColor(color: InsertProductColor): Promise<ProductColor>;
  getProductColors(productId: number): Promise<ProductColor[]>;
  getProductColor(productId: number, colorName: string): Promise<ProductColor | undefined>;
  deleteProductColor(id: number): Promise<void>;

  // Inventory operations
  getInventory(store: string, productColorId?: number): Promise<Inventory[]>;
  updateInventory(inventory: InsertInventory): Promise<Inventory>;
  updateInventoryQuantity(productColorId: number, store: string, size: string, quantityChange: number): Promise<void>;
  checkInventoryAvailability(productColorId: number, store: string, size: string, quantity: number): Promise<boolean>;

  // Sales operations
  getSales(store: string, limit?: number): Promise<SaleWithDetails[]>;
  createSale(sale: InsertSale): Promise<Sale>;
  getSale(saleId: string): Promise<SaleWithDetails | undefined>;

  // Order operations
  getOrders(status?: string, limit?: number): Promise<OrderWithDetails[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(orderId: string, status: string): Promise<Order>;
  getOrder(orderId: string): Promise<OrderWithDetails | undefined>;

  // Return operations
  getReturns(store: string, limit?: number): Promise<ReturnWithDetails[]>;
  createReturn(returnData: InsertReturn): Promise<Return>;

  // Analytics operations
  getDashboardMetrics(store: string): Promise<{
    totalProducts: number;
    todaySales: string;
    pendingOrders: number;
    lowStockItems: number;
  }>;
  getTopProducts(store: string, limit?: number): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  async getEmployees(): Promise<Employee[]> {
    return await db.select().from(employees);
  }

  async getEmployee(id: number): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee;
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [newEmployee] = await db.insert(employees).values(employee).returning();
    return newEmployee;
  }

  async getProducts(store?: string, searchTerm?: string): Promise<ProductWithColors[]> {
    let query = db
      .select()
      .from(products)
      .leftJoin(productColors, eq(products.id, productColors.productId))
      .leftJoin(inventory, eq(productColors.id, inventory.productColorId));

    if (store) {
      query = query.where(eq(inventory.store, store as any));
    }

    if (searchTerm) {
      query = query.where(
        sql`${products.productCode} ILIKE ${`%${searchTerm}%`} OR 
            ${products.modelNumber} ILIKE ${`%${searchTerm}%`} OR 
            ${products.brand} ILIKE ${`%${searchTerm}%`}`
      );
    }

    const results = await query;

    // Group results by product
    const productMap = new Map<number, ProductWithColors>();
    
    for (const row of results) {
      const product = row.products;
      if (!productMap.has(product.id)) {
        productMap.set(product.id, {
          ...product,
          colors: [],
        });
      }

      const productWithColors = productMap.get(product.id)!;
      
      if (row.product_colors) {
        const existingColor = productWithColors.colors.find(c => c.id === row.product_colors!.id);
        if (!existingColor) {
          productWithColors.colors.push({
            ...row.product_colors,
            inventory: row.inventory ? [row.inventory] : [],
          });
        } else if (row.inventory) {
          existingColor.inventory.push(row.inventory);
        }
      }
    }

    return Array.from(productMap.values());
  }

  async getProduct(id: number): Promise<ProductWithColors | undefined> {
    const results = await db
      .select()
      .from(products)
      .leftJoin(productColors, eq(products.id, productColors.productId))
      .leftJoin(inventory, eq(productColors.id, inventory.productColorId))
      .where(eq(products.id, id));

    if (results.length === 0) return undefined;

    const product = results[0].products;
    const colors = new Map<number, ProductColor & { inventory: Inventory[] }>();

    for (const row of results) {
      if (row.product_colors) {
        if (!colors.has(row.product_colors.id)) {
          colors.set(row.product_colors.id, {
            ...row.product_colors,
            inventory: [],
          });
        }
        if (row.inventory) {
          colors.get(row.product_colors.id)!.inventory.push(row.inventory);
        }
      }
    }

    return {
      ...product,
      colors: Array.from(colors.values()),
    };
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async createProductColor(color: InsertProductColor): Promise<ProductColor> {
    const [newColor] = await db.insert(productColors).values(color).returning();
    return newColor;
  }

  async getProductColors(productId: number): Promise<ProductColor[]> {
    return await db.select().from(productColors).where(eq(productColors.productId, productId));
  }

  async getProductColor(productId: number, colorName: string): Promise<ProductColor | undefined> {
    const [color] = await db
      .select()
      .from(productColors)
      .where(
        and(
          eq(productColors.productId, productId),
          eq(productColors.colorName, colorName)
        )
      );
    return color;
  }

  async deleteProductColor(id: number): Promise<void> {
    await db.delete(productColors).where(eq(productColors.id, id));
  }

  async getInventory(store: string, productColorId?: number): Promise<Inventory[]> {
    let query = db.select().from(inventory).where(eq(inventory.store, store as any));
    
    if (productColorId) {
      query = query.where(and(eq(inventory.store, store as any), eq(inventory.productColorId, productColorId)));
    }
    
    return await query;
  }

  async updateInventory(inventoryData: InsertInventory): Promise<Inventory> {
    // Try to find existing inventory record
    const [existing] = await db
      .select()
      .from(inventory)
      .where(
        and(
          eq(inventory.productColorId, inventoryData.productColorId),
          eq(inventory.store, inventoryData.store),
          eq(inventory.size, inventoryData.size)
        )
      );

    if (existing) {
      // Update existing record
      const [updated] = await db
        .update(inventory)
        .set({ ...inventoryData, updatedAt: new Date() })
        .where(eq(inventory.id, existing.id))
        .returning();
      return updated;
    } else {
      // Create new record
      const [newInventory] = await db.insert(inventory).values(inventoryData).returning();
      return newInventory;
    }
  }

  async updateInventoryQuantity(productColorId: number, store: string, size: string, quantityChange: number): Promise<void> {
    const [existing] = await db
      .select()
      .from(inventory)
      .where(
        and(
          eq(inventory.productColorId, productColorId),
          eq(inventory.store, store as any),
          eq(inventory.size, size)
        )
      );

    if (existing) {
      await db
        .update(inventory)
        .set({ 
          quantity: Math.max(0, existing.quantity + quantityChange),
          updatedAt: new Date()
        })
        .where(eq(inventory.id, existing.id));
    }
  }

  async checkInventoryAvailability(productColorId: number, store: string, size: string, quantity: number): Promise<boolean> {
    const [existing] = await db
      .select()
      .from(inventory)
      .where(
        and(
          eq(inventory.productColorId, productColorId),
          eq(inventory.store, store as any),
          eq(inventory.size, size)
        )
      );

    return existing ? existing.quantity >= quantity : false;
  }

  async getSales(store: string, limit: number = 50): Promise<SaleWithDetails[]> {
    return await db
      .select()
      .from(sales)
      .leftJoin(employees, eq(sales.employeeId, employees.id))
      .leftJoin(productColors, eq(sales.productColorId, productColors.id))
      .leftJoin(products, eq(productColors.productId, products.id))
      .where(eq(sales.store, store as any))
      .orderBy(desc(sales.createdAt))
      .limit(limit) as SaleWithDetails[];
  }

  async createSale(sale: InsertSale): Promise<Sale> {
    const [newSale] = await db.insert(sales).values(sale).returning();
    
    // Update inventory
    await this.updateInventoryQuantity(
      sale.productColorId,
      sale.store,
      sale.size.toString(),
      -sale.quantity
    );
    
    return newSale;
  }

  async getSale(saleId: string): Promise<SaleWithDetails | undefined> {
    const [result] = await db
      .select()
      .from(sales)
      .leftJoin(employees, eq(sales.employeeId, employees.id))
      .leftJoin(productColors, eq(sales.productColorId, productColors.id))
      .leftJoin(products, eq(productColors.productId, products.id))
      .where(eq(sales.saleId, saleId)) as SaleWithDetails[];

    return result;
  }

  async getOrders(status?: string, limit: number = 50): Promise<OrderWithDetails[]> {
    let query = db
      .select()
      .from(orders)
      .leftJoin(employees, eq(orders.employeeId, employees.id))
      .leftJoin(productColors, eq(orders.productColorId, productColors.id))
      .leftJoin(products, eq(productColors.productId, products.id))
      .orderBy(desc(orders.createdAt))
      .limit(limit);

    if (status) {
      query = query.where(eq(orders.status, status as any));
    }

    return await query as OrderWithDetails[];
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    
    // Update inventory for online store
    await this.updateInventoryQuantity(
      order.productColorId,
      "online",
      order.size.toString(),
      -order.quantity
    );
    
    return newOrder;
  }

  async updateOrderStatus(orderId: string, status: string): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(orders.orderId, orderId))
      .returning();
    return updatedOrder;
  }

  async getOrder(orderId: string): Promise<OrderWithDetails | undefined> {
    const [result] = await db
      .select()
      .from(orders)
      .leftJoin(employees, eq(orders.employeeId, employees.id))
      .leftJoin(productColors, eq(orders.productColorId, productColors.id))
      .leftJoin(products, eq(productColors.productId, products.id))
      .where(eq(orders.orderId, orderId)) as OrderWithDetails[];

    return result;
  }

  async getReturns(store: string, limit: number = 50): Promise<ReturnWithDetails[]> {
    return await db
      .select()
      .from(returns)
      .leftJoin(employees, eq(returns.employeeId, employees.id))
      .leftJoin(productColors, eq(returns.originalProductColorId, productColors.id))
      .leftJoin(products, eq(productColors.productId, products.id))
      .where(eq(returns.store, store as any))
      .orderBy(desc(returns.createdAt))
      .limit(limit) as ReturnWithDetails[];
  }

  async createReturn(returnData: InsertReturn): Promise<Return> {
    const [newReturn] = await db.insert(returns).values(returnData).returning();
    
    // Update inventory - add back original quantity
    await this.updateInventoryQuantity(
      returnData.originalProductColorId,
      returnData.store,
      returnData.originalSize.toString(),
      returnData.originalQuantity
    );
    
    // If it's an exchange, reduce inventory for new product
    if (returnData.newProductColorId && returnData.newSize && returnData.newQuantity) {
      await this.updateInventoryQuantity(
        returnData.newProductColorId,
        returnData.store,
        returnData.newSize.toString(),
        -returnData.newQuantity
      );
    }
    
    return newReturn;
  }

  async getDashboardMetrics(store: string): Promise<{
    totalProducts: number;
    todaySales: string;
    pendingOrders: number;
    lowStockItems: number;
  }> {
    // Get total products with inventory in this store
    const totalProductsResult = await db
      .select({ count: sql<number>`count(distinct ${products.id})` })
      .from(products)
      .leftJoin(productColors, eq(products.id, productColors.productId))
      .leftJoin(inventory, eq(productColors.id, inventory.productColorId))
      .where(eq(inventory.store, store as any));

    // Get today's sales
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaySalesResult = await db
      .select({ total: sql<string>`COALESCE(SUM(${sales.totalAmount}), 0)` })
      .from(sales)
      .where(
        and(
          eq(sales.store, store as any),
          sql`${sales.createdAt} >= ${today}`
        )
      );

    // Get pending orders (only for online store)
    let pendingOrders = 0;
    if (store === "online") {
      const pendingOrdersResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(eq(orders.status, "pending"));
      pendingOrders = pendingOrdersResult[0]?.count || 0;
    }

    // Get low stock items (quantity < 5)
    const lowStockResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(inventory)
      .where(
        and(
          eq(inventory.store, store as any),
          sql`${inventory.quantity} < 5`
        )
      );

    return {
      totalProducts: totalProductsResult[0]?.count || 0,
      todaySales: todaySalesResult[0]?.total || "0",
      pendingOrders,
      lowStockItems: lowStockResult[0]?.count || 0,
    };
  }

  async getTopProducts(store: string, limit: number = 5): Promise<any[]> {
    const results = await db
      .select({
        productId: products.id,
        productName: sql<string>`CONCAT(${products.brand}, ' ', ${products.modelNumber})`,
        totalSold: sql<number>`SUM(${sales.quantity})`,
        totalRevenue: sql<string>`SUM(${sales.totalAmount})`,
        imageUrl: products.imageUrl,
      })
      .from(sales)
      .leftJoin(productColors, eq(sales.productColorId, productColors.id))
      .leftJoin(products, eq(productColors.productId, products.id))
      .where(eq(sales.store, store as any))
      .groupBy(products.id, products.brand, products.modelNumber, products.imageUrl)
      .orderBy(sql`SUM(${sales.quantity}) DESC`)
      .limit(limit);

    return results;
  }
}

export const storage = new DatabaseStorage();
