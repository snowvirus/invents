import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  decimal,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ["customer", "admin", "superadmin"] }).notNull().default("customer"),
  branchId: integer("branch_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const branches = pgTable("branches", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  quality: varchar("quality", { enum: ["high", "medium", "low"] }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  business: varchar("business", { length: 100 }).notNull(),
  stock: integer("stock").notNull().default(0),
  imageUrl: varchar("image_url"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const productExtras = pgTable("product_extras", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  productId: integer("product_id"),
  type: varchar("type", { enum: ["inquiry", "custom", "standard"] }).notNull(),
  description: text("description"),
  imageUrl: varchar("image_url"),
  location: varchar("location", { length: 255 }),
  status: varchar("status", { enum: ["pending", "approved", "completed", "rejected"] }).notNull().default("pending"),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orderExtras = pgTable("order_extras", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  extraId: integer("extra_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: varchar("sender_id").notNull(),
  senderRole: varchar("sender_role", { enum: ["customer", "admin", "superadmin"] }).notNull(),
  message: text("message").notNull(),
  taggedUsers: text("tagged_users").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  branch: one(branches, {
    fields: [users.branchId],
    references: [branches.id],
  }),
  orders: many(orders),
  messages: many(messages),
}));

export const branchesRelations = relations(branches, ({ many }) => ({
  users: many(users),
}));

export const productsRelations = relations(products, ({ many }) => ({
  extras: many(productExtras),
  orders: many(orders),
}));

export const productExtrasRelations = relations(productExtras, ({ one }) => ({
  product: one(products, {
    fields: [productExtras.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [orders.productId],
    references: [products.id],
  }),
  extras: many(orderExtras),
}));

export const orderExtrasRelations = relations(orderExtras, ({ one }) => ({
  order: one(orders, {
    fields: [orderExtras.orderId],
    references: [orders.id],
  }),
  extra: one(productExtras, {
    fields: [orderExtras.extraId],
    references: [productExtras.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertBranchSchema = createInsertSchema(branches).omit({
  id: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductExtraSchema = createInsertSchema(productExtras).omit({
  id: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Branch = typeof branches.$inferSelect;
export type InsertBranch = z.infer<typeof insertBranchSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type ProductExtra = typeof productExtras.$inferSelect;
export type InsertProductExtra = z.infer<typeof insertProductExtraSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
