# Nsambya & Mirembe Business Management System

## Overview

This is a full-stack web application for managing two furniture/bedding businesses: Nsambya Furniture Workshop and Mirembe Beddings. The system provides customer features, admin management, and superadmin capabilities with real-time communication.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation
- **UI Components**: Radix UI primitives with custom styling

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL store
- **Real-time Communication**: WebSocket for chat functionality
- **File Uploads**: Multer for handling image uploads

### Database Design
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` for type sharing
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Storage**: PostgreSQL-backed session store

## Key Components

### User Management
- **Roles**: Customer, Admin (per business), SuperAdmin
- **Authentication**: Replit Auth integration with profile management
- **Authorization**: Role-based access control throughout the application

### Product Management
- **CRUD Operations**: Full product lifecycle management
- **Image Uploads**: File-based image storage with preview
- **Product Extras**: Additional product options with pricing
- **Filtering**: By category, quality, business, price range

### Order System
- **Order Types**: Regular orders and custom orders
- **Order Status**: Pending, confirmed, completed, cancelled
- **Custom Orders**: With design uploads and specifications
- **Inquiries**: Product inquiry management

### Real-time Communication
- **WebSocket Chat**: Group chatroom for all users
- **Role Indicators**: Visual role identification in chat
- **Message Management**: Admin/SuperAdmin message deletion

### Branch Management
- **Multi-business Support**: Nsambya and Mirembe branches
- **Admin Assignment**: Admins tied to specific branches
- **Location Tracking**: Branch location management

## Data Flow

1. **Authentication Flow**: 
   - Replit Auth → Session creation → User role assignment
   - Persistent sessions stored in PostgreSQL

2. **Product Flow**:
   - Admin creates products → Database storage → Real-time updates
   - Customer views → Filtering → Product details

3. **Order Flow**:
   - Customer submits order/inquiry → Admin notification → Status updates
   - Custom orders include file uploads and specifications

4. **Chat Flow**:
   - WebSocket connection → Real-time message broadcasting
   - Message persistence in database

## External Dependencies

### Authentication
- **Replit Auth**: OpenID Connect provider for user authentication
- **Session Management**: PostgreSQL-backed session storage

### Database
- **Neon Database**: Serverless PostgreSQL hosting
- **Connection Pooling**: @neondatabase/serverless for WebSocket compatibility

### File Storage
- **Local Storage**: Multer-based file uploads to local filesystem
- **Image Processing**: Basic file validation and storage

### UI Libraries
- **shadcn/ui**: Complete component library
- **Radix UI**: Headless UI primitives
- **Lucide React**: Icon library

## Deployment Strategy

### Development
- **Dev Server**: Vite development server with HMR
- **Backend**: tsx for TypeScript execution
- **Database**: Drizzle Kit for schema management

### Production Build
- **Frontend**: Vite production build to `dist/public`
- **Backend**: esbuild bundling to `dist/index.js`
- **Static Serving**: Express serves built frontend files

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `REPL_ID`: Replit environment identifier
- `ISSUER_URL`: OpenID Connect issuer URL

### Database Migration
- **Schema Management**: Drizzle Kit with PostgreSQL dialect
- **Migration Command**: `npm run db:push` for schema updates