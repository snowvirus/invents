import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertBranchSchema,
  insertProductSchema,
  insertProductExtraSchema,
  insertOrderSchema,
  insertMessageSchema,
} from "@shared/schema";
import { upload } from "./middleware/upload";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Branch routes
  app.get('/api/branches', isAuthenticated, async (req: any, res) => {
    try {
      const branches = await storage.getAllBranches();
      res.json(branches);
    } catch (error) {
      console.error("Error fetching branches:", error);
      res.status(500).json({ message: "Failed to fetch branches" });
    }
  });

  app.post('/api/branches', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'superadmin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const branchData = insertBranchSchema.parse(req.body);
      const branch = await storage.createBranch(branchData);
      res.json(branch);
    } catch (error) {
      console.error("Error creating branch:", error);
      res.status(500).json({ message: "Failed to create branch" });
    }
  });

  // Product routes
  app.get('/api/products', async (req, res) => {
    try {
      const { category, quality, business, minPrice, maxPrice, search } = req.query;
      const filters = {
        category: category as string,
        quality: quality as string,
        business: business as string,
        minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        search: search as string,
      };

      const products = await storage.getAllProducts(filters);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post('/api/products', isAuthenticated, upload.single('image'), async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin' && user?.role !== 'superadmin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const productData = insertProductSchema.parse({
        ...req.body,
        price: parseFloat(req.body.price),
        stock: parseInt(req.body.stock),
        imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
        tags: req.body.tags ? req.body.tags.split(',').map((tag: string) => tag.trim()) : [],
      });

      const product = await storage.createProduct(productData);

      // Create extras if provided
      if (req.body.extras) {
        const extras = JSON.parse(req.body.extras);
        for (const extra of extras) {
          await storage.createProductExtra({
            productId: product.id,
            name: extra.name,
            price: parseFloat(extra.price),
          });
        }
      }

      res.json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put('/api/products/:id', isAuthenticated, upload.single('image'), async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin' && user?.role !== 'superadmin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const productId = parseInt(req.params.id);
      const updateData: any = {
        ...req.body,
        price: req.body.price ? parseFloat(req.body.price) : undefined,
        stock: req.body.stock ? parseInt(req.body.stock) : undefined,
        tags: req.body.tags ? req.body.tags.split(',').map((tag: string) => tag.trim()) : undefined,
      };

      if (req.file) {
        updateData.imageUrl = `/uploads/${req.file.filename}`;
      }

      const product = await storage.updateProduct(productId, updateData);
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete('/api/products/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin' && user?.role !== 'superadmin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const productId = parseInt(req.params.id);
      await storage.deleteProduct(productId);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Order routes
  app.get('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      const { status, type } = req.query;

      const filters: any = {
        status: status as string,
        type: type as string,
      };

      // Customers can only see their own orders
      if (user?.role === 'customer') {
        filters.userId = user.id;
      }

      const orders = await storage.getAllOrders(filters);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.post('/api/orders', isAuthenticated, upload.single('image'), async (req: any, res) => {
    try {
      const orderData = insertOrderSchema.parse({
        ...req.body,
        userId: req.user.claims.sub,
        productId: req.body.productId ? parseInt(req.body.productId) : null,
        totalPrice: req.body.totalPrice ? parseFloat(req.body.totalPrice) : null,
        imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
      });

      const order = await storage.createOrder(orderData);
      res.json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.patch('/api/orders/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin' && user?.role !== 'superadmin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const orderId = parseInt(req.params.id);
      const { status } = req.body;

      const statusSchema = z.enum(['pending', 'approved', 'completed', 'rejected']);
      const validatedStatus = statusSchema.parse(status);

      const order = await storage.updateOrderStatus(orderId, validatedStatus);
      res.json(order);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Message routes
  app.get('/api/messages', isAuthenticated, async (req, res) => {
    try {
      const { limit } = req.query;
      const messages = await storage.getAllMessages(limit ? parseInt(limit as string) : undefined);
      res.json(messages.reverse()); // Show oldest first
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.delete('/api/messages/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin' && user?.role !== 'superadmin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const messageId = parseInt(req.params.id);
      await storage.deleteMessage(messageId);
      res.json({ message: "Message deleted successfully" });
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({ message: "Failed to delete message" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin' && user?.role !== 'superadmin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // File uploads route for serving static files
  app.use('/uploads', (req, res, next) => {
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    next();
  });

  const httpServer = createServer(app);

  // WebSocket setup for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected to chat');

    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'chat_message') {
          // Extract tagged users from message content
          const taggedUsers = (message.content.match(/@(\w+)/g) || [])
            .map((tag: string) => tag.substring(1));

          // Save message to database
          const savedMessage = await storage.createMessage({
            senderId: message.senderId,
            senderRole: message.senderRole,
            message: message.content,
            taggedUsers,
          });

          // Broadcast to all connected clients
          const broadcastData = JSON.stringify({
            type: 'new_message',
            message: savedMessage,
          });

          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(broadcastData);
            }
          });
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected from chat');
    });
  });

  return httpServer;
}
