import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertSaleSchema, insertOrderSchema, insertReturnSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Employee routes
  app.get("/api/employees", async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.post("/api/employees", async (req, res) => {
    try {
      const employee = await storage.createEmployee(req.body);
      res.json(employee);
    } catch (error) {
      console.error("Error creating employee:", error);
      res.status(500).json({ message: "Failed to create employee" });
    }
  });

  // Product routes with store filtering
  app.get("/api/:store/products", async (req, res) => {
    try {
      const { store } = req.params;
      const { search } = req.query;
      
      if (!["boutique", "online"].includes(store)) {
        return res.status(400).json({ message: "Invalid store" });
      }

      const products = await storage.getProducts(store, search as string);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(id, validatedData);
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProduct(id);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Product colors routes
  app.post("/api/products/:id/colors", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const color = await storage.createProductColor({
        productId,
        colorName: req.body.colorName,
      });
      res.json(color);
    } catch (error) {
      console.error("Error creating product color:", error);
      res.status(500).json({ message: "Failed to create product color" });
    }
  });

  // Inventory routes
  app.get("/api/:store/inventory", async (req, res) => {
    try {
      const { store } = req.params;
      
      if (!["boutique", "online"].includes(store)) {
        return res.status(400).json({ message: "Invalid store" });
      }

      const inventory = await storage.getInventory(store);
      res.json(inventory);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  app.put("/api/inventory", async (req, res) => {
    try {
      const inventory = await storage.updateInventory(req.body);
      res.json(inventory);
    } catch (error) {
      console.error("Error updating inventory:", error);
      res.status(500).json({ message: "Failed to update inventory" });
    }
  });

  // Sales routes
  app.get("/api/:store/sales", async (req, res) => {
    try {
      const { store } = req.params;
      const { limit } = req.query;
      
      if (!["boutique", "online"].includes(store)) {
        return res.status(400).json({ message: "Invalid store" });
      }

      const sales = await storage.getSales(store, limit ? parseInt(limit as string) : undefined);
      res.json(sales);
    } catch (error) {
      console.error("Error fetching sales:", error);
      res.status(500).json({ message: "Failed to fetch sales" });
    }
  });

  app.post("/api/:store/sales", async (req, res) => {
    try {
      const { store } = req.params;
      
      if (!["boutique", "online"].includes(store)) {
        return res.status(400).json({ message: "Invalid store" });
      }

      // Check inventory availability
      const { productColorId, size, quantity } = req.body;
      const available = await storage.checkInventoryAvailability(productColorId, store, size.toString(), quantity);
      
      if (!available) {
        return res.status(400).json({ message: "Insufficient inventory" });
      }

      const validatedData = insertSaleSchema.parse({ ...req.body, store });
      const sale = await storage.createSale(validatedData);
      res.json(sale);
    } catch (error) {
      console.error("Error creating sale:", error);
      res.status(500).json({ message: "Failed to create sale" });
    }
  });

  // Orders routes (Online only)
  app.get("/api/orders", async (req, res) => {
    try {
      const { status, limit } = req.query;
      const orders = await storage.getOrders(
        status as string,
        limit ? parseInt(limit as string) : undefined
      );
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      // Check inventory availability for online store
      const { productColorId, size, quantity } = req.body;
      const available = await storage.checkInventoryAvailability(productColorId, "online", size.toString(), quantity);
      
      if (!available) {
        return res.status(400).json({ message: "Insufficient inventory" });
      }

      const validatedData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(validatedData);
      res.json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.put("/api/orders/:orderId/status", async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;
      
      const order = await storage.updateOrderStatus(orderId, status);
      res.json(order);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Returns routes
  app.get("/api/:store/returns", async (req, res) => {
    try {
      const { store } = req.params;
      const { limit } = req.query;
      
      if (!["boutique", "online"].includes(store)) {
        return res.status(400).json({ message: "Invalid store" });
      }

      const returns = await storage.getReturns(store, limit ? parseInt(limit as string) : undefined);
      res.json(returns);
    } catch (error) {
      console.error("Error fetching returns:", error);
      res.status(500).json({ message: "Failed to fetch returns" });
    }
  });

  app.post("/api/:store/returns", async (req, res) => {
    try {
      const { store } = req.params;
      
      if (!["boutique", "online"].includes(store)) {
        return res.status(400).json({ message: "Invalid store" });
      }

      const validatedData = insertReturnSchema.parse({ ...req.body, store });
      const returnRecord = await storage.createReturn(validatedData);
      res.json(returnRecord);
    } catch (error) {
      console.error("Error creating return:", error);
      res.status(500).json({ message: "Failed to create return" });
    }
  });

  // Dashboard metrics
  app.get("/api/:store/dashboard", async (req, res) => {
    try {
      const { store } = req.params;
      
      if (!["boutique", "online"].includes(store)) {
        return res.status(400).json({ message: "Invalid store" });
      }

      const metrics = await storage.getDashboardMetrics(store);
      const topProducts = await storage.getTopProducts(store);
      
      res.json({ metrics, topProducts });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Export routes
  app.get("/api/:store/export", async (req, res) => {
    try {
      const { store } = req.params;
      
      if (!["boutique", "online"].includes(store)) {
        return res.status(400).json({ message: "Invalid store" });
      }

      // Get all data for export
      const products = await storage.getProducts(store);
      const sales = await storage.getSales(store, 1000);
      const returns = await storage.getReturns(store, 1000);
      const inventory = await storage.getInventory(store);
      
      let orders = [];
      if (store === "online") {
        orders = await storage.getOrders(undefined, 1000);
      }

      const exportData = {
        products,
        sales,
        returns,
        inventory,
        orders,
        exportDate: new Date().toISOString(),
        store,
      };

      res.json(exportData);
    } catch (error) {
      console.error("Error generating export:", error);
      res.status(500).json({ message: "Failed to generate export" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
