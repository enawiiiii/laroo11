# LaRosa Fashion Store Management System

## Overview

LaRosa is a full-stack fashion store management application built with React, Express.js, and PostgreSQL. The system manages inventory, sales, orders, and returns for both physical boutique and online store operations. It features a multi-store architecture that completely isolates data and operations between boutique and online stores, ensuring proper segregation of business operations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: React Query for server state, Context API for global state
- **UI Components**: Radix UI with shadcn/ui component library
- **Styling**: Tailwind CSS with custom design tokens
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite for development and bundling

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM for type-safe database operations
- **API Design**: RESTful API with store-specific endpoints
- **Middleware**: JSON parsing, request logging, error handling
- **Development**: Hot reload with Vite integration

### Data Storage Architecture
- **Database**: PostgreSQL with Neon serverless connection
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Store Isolation**: All tables include store filtering to separate boutique/online data
- **Data Models**: Products, inventory, sales, orders, returns, employees with proper relationships

### Authentication and Authorization
- **Session Management**: Simple employee/store selection stored in localStorage
- **Store Access Control**: Frontend routing and API endpoints filter by selected store
- **Employee Tracking**: All transactions record the responsible employee

### Multi-Store Design Pattern
- **Store Separation**: Complete data isolation between "boutique" and "online" stores
- **Filtered Operations**: All CRUD operations include store context
- **Conditional UI**: Orders section hidden for boutique users (sales-only)
- **Store-Specific Pricing**: Separate pricing fields for boutique vs online

### Business Logic Architecture
- **Inventory Management**: Real-time stock tracking with size/color variants
- **Sales Processing**: Different payment methods and tax handling per store
- **Order Management**: Online-specific customer information and status tracking
- **Returns/Exchanges**: Flexible return types with inventory adjustment

## External Dependencies

### Database Services
- **Neon**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle ORM**: Type-safe database queries and schema management

### UI and Styling
- **Radix UI**: Headless component primitives for accessibility
- **shadcn/ui**: Pre-built component library with Tailwind styling
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for UI elements

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type safety across frontend and backend
- **React Query**: Server state management and caching
- **React Hook Form**: Form handling with validation
- **Zod**: Runtime type validation and schema parsing

### Deployment Infrastructure
- **Replit**: Development environment with integrated hosting
- **Node.js**: Runtime environment for Express server
- **WebSocket**: Real-time connection support for Neon database

### Utility Libraries
- **date-fns**: Date formatting and manipulation
- **clsx**: Conditional CSS class management
- **nanoid**: Unique ID generation for records
- **wouter**: Lightweight client-side routing