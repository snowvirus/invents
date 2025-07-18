import {
  users,
  branches,
  products,
  productExtras,
  orders,
  orderExtras,
  messages,
  type User,
  type UpsertUser,
  type Branch,
  type InsertBranch,
  type Product,
  type InsertProduct,
  type ProductExtra,
  type InsertProductExtra,
  type Order,
  type InsertOrder,
  type Message,
  type InsertMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, ilike, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Branch operations
  getAllBranches(): Promise<Branch[]>;
  createBranch(branch: InsertBranch): Promise<Branch>;
  getBranchById(id: number): Promise<Branch | undefined>;
  
  // Product operations
  getAllProducts(filters?: {
    category?: string;
    quality?: string;
    business?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
  }): Promise<(Product & { extras: ProductExtra[] })[]>;
  getProductById(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
  
  // Product extras operations
  getProductExtras(productId: number): Promise<ProductExtra[]>;
  createProductExtra(extra: InsertProductExtra): Promise<ProductExtra>;
  deleteProductExtra(id: number): Promise<void>;
  
  // Order operations
  getAllOrders(filters?: {
    userId?: string;
    status?: string;
    type?: string;
  }): Promise<(Order & { user: User; product?: Product })[]>;
  getOrderById(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order>;
  
  // Message operations
  getAllMessages(limit?: number): Promise<(Message & { sender: User })[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  deleteMessage(id: number): Promise<void>;
  
  // Analytics
  getDashboardStats(): Promise<{
    totalProducts: number;
    pendingOrders: number;
    activeBranches: number;
    monthlyRevenue: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Branch operations
  async getAllBranches(): Promise<Branch[]> {
    return await db.select().from(branches).orderBy(branches.name);
  }

  async createBranch(branch: InsertBranch): Promise<Branch> {
    const [newBranch] = await db.insert(branches).values(branch).returning();
    return newBranch;
  }

  async getBranchById(id: number): Promise<Branch | undefined> {
    const [branch] = await db.select().from(branches).where(eq(branches.id, id));
    return branch;
  }

  // Product operations
  async getAllProducts(filters?: {
    category?: string;
    quality?: string;
    business?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
  }): Promise<(Product & { extras: ProductExtra[] })[]> {
    let query = db.select().from(products).$dynamic();

    if (filters) {
      const conditions = [];
      
      if (filters.category) {
        conditions.push(eq(products.category, filters.category));
      }
      if (filters.quality) {
        conditions.push(eq(products.quality, filters.quality));
      }
      if (filters.business) {
        conditions.push(eq(products.business, filters.business));
      }
      if (filters.minPrice !== undefined) {
        conditions.push(sql`${products.price} >= ${filters.minPrice}`);
      }
      if (filters.maxPrice !== undefined) {
        conditions.push(sql`${products.price} <= ${filters.maxPrice}`);
      }
      if (filters.search) {
        conditions.push(
          or(
            ilike(products.name, `%${filters.search}%`),
            ilike(products.description, `%${filters.search}%`)
          )
        );
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }

    const productsResult = await query.orderBy(desc(products.createdAt));

    // Get extras for each product
    const productsWithExtras = await Promise.all(
      productsResult.map(async (product) => {
        const extras = await this.getProductExtras(product.id);
        return { ...product, extras };
      })
    );

    return productsWithExtras;
  }

  async getProductById(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
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

  // Product extras operations
  async getProductExtras(productId: number): Promise<ProductExtra[]> {
    return await db.select().from(productExtras).where(eq(productExtras.productId, productId));
  }

  async createProductExtra(extra: InsertProductExtra): Promise<ProductExtra> {
    const [newExtra] = await db.insert(productExtras).values(extra).returning();
    return newExtra;
  }

  async deleteProductExtra(id: number): Promise<void> {
    await db.delete(productExtras).where(eq(productExtras.id, id));
  }

  // Order operations
  async getAllOrders(filters?: {
    userId?: string;
    status?: string;
    type?: string;
  }): Promise<(Order & { user: User; product?: Product })[]> {
    let query = db
      .select({
        order: orders,
        user: users,
        product: products,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .leftJoin(products, eq(orders.productId, products.id))
      .$dynamic();

    if (filters) {
      const conditions = [];
      
      if (filters.userId) {
        conditions.push(eq(orders.userId, filters.userId));
      }
      if (filters.status) {
        conditions.push(eq(orders.status, filters.status));
      }
      if (filters.type) {
        conditions.push(eq(orders.type, filters.type));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }

    const result = await query.orderBy(desc(orders.createdAt));
    return result.map(({ order, user, product }) => ({
      ...order,
      user: user!,
      product: product || undefined,
    }));
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  // Message operations
  async getAllMessages(limit = 50): Promise<(Message & { sender: User })[]> {
    const result = await db
      .select({
        message: messages,
        sender: users,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .orderBy(desc(messages.createdAt))
      .limit(limit);

    return result.map(({ message, sender }) => ({
      ...message,
      sender: sender!,
    }));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async deleteMessage(id: number): Promise<void> {
    await db.delete(messages).where(eq(messages.id, id));
  }

  // Analytics
  async getDashboardStats(): Promise<{
    totalProducts: number;
    pendingOrders: number;
    activeBranches: number;
    monthlyRevenue: number;
  }> {
    const [totalProducts] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products);

    const [pendingOrders] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(eq(orders.status, "pending"));

    const [activeBranches] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(branches);

    const [monthlyRevenue] = await db
      .select({ 
        revenue: sql<number>`coalesce(sum(total_price::numeric), 0)::int`
      })
      .from(orders)
      .where(
        and(
          eq(orders.status, "completed"),
          sql`created_at >= date_trunc('month', current_date)`
        )
      );

    return {
      totalProducts: totalProducts.count,
      pendingOrders: pendingOrders.count,
      activeBranches: activeBranches.count,
      monthlyRevenue: monthlyRevenue.revenue,
    };
  }
}

export const storage = new DatabaseStorage();
