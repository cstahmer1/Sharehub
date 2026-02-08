# OmahaShareHub

## Overview

OmahaShareHub is a two-sided marketplace platform connecting property owners with service providers/contractors in the Omaha area. The platform enables property owners to post projects with photos, descriptions, locations, and pricing, while allowing providers to search, filter, and bid on available work. The system includes secure messaging, booking management with Stripe escrow payments, mutual reviews, scheduling capabilities, and map-based project discovery.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent design
- **State Management**: TanStack Query (React Query) for server state management
- **Authentication**: Context-based auth provider with session management
- **UI Components**: Radix UI primitives with custom styling via class-variance-authority

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Authentication**: Passport.js with local strategy and session-based auth
- **Password Security**: Crypto module with scrypt for hashing
- **Session Storage**: PostgreSQL-backed persistent sessions (connect-pg-simple) with SameSite=strict cookies and rolling expiration (24 hours)
- **API Design**: RESTful endpoints with JSON responses
- **Middleware**: CSRF protection (Origin header validation), request logging, global error handling, and authentication guards

### Database Design
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL with Neon serverless driver
- **Schema**: Comprehensive relational design including:
  - Users with dual roles (owner/provider)
  - Profiles with location data and ratings
  - Listings/projects with categories and images
  - Booking system with status tracking
  - Messaging threads and messages
  - Review and rating system
  - Analytics and audit logging

### User Role System
- **Guest Users**: Browse listings and profiles
- **Authenticated Users**: Messaging, reviews, profile management
- **Property Owners**: Create/manage listings, accept bookings, schedule availability
- **Service Providers**: Search projects, send proposals, accept bookings
- **Admin Users**: Platform management, dispute resolution, analytics

### Payment Integration (Corrected Two-Step Flow)
- **Payment Processor**: Stripe with React Stripe.js integration
- **Escrow System**: Funds held until project completion
- **Connect Accounts**: Stripe Connect Express accounts for provider payouts
- **Transaction Tracking**: Complete payment audit trail with transfer IDs

#### Payment Flow (CORRECTED Oct 2025)
1. **Provider creates booking request** (provider = sellerUserId, homeowner = buyerUserId)
2. **Homeowner accepts booking** and pays into escrow
3. **Provider completes Stripe Connect onboarding** to receive payouts
4. **Work is completed** and verified
5. **Escrow release**: Platform transfers funds to provider's connected account (95% to provider, 5% platform fee)

#### Stripe Connect Implementation
- **Endpoints**:
  - `POST /api/connect/create-or-link` - Creates or returns existing Stripe Connect account
  - `POST /api/connect/onboarding-link` - Generates onboarding URL for providers
  - `GET /api/connect/status` - Checks provider's payout readiness
- **Webhook Handler**: `account.updated` events sync provider payout status
- **Payout Status States**: UNSET, PENDING, READY, RESTRICTED
- **Escrow Release Logic**: Gates fund transfers on `payoutStatus === "READY"`
- **Platform Fee**: 5% deducted from each transaction before provider payout

### Security Features (Production-Ready)
- **Input Validation**: 
  - Zod schemas enforced on ALL POST/PATCH endpoints
  - Update schemas explicitly whitelist allowed fields
  - Sensitive fields (prices, status, roles) protected from tampering
  - Validation applied to: listings, bookings, messages, reviews, threads, profile, provider skills, portfolio, authentication
- **Session Security**:
  - PostgreSQL-backed persistent sessions (connect-pg-simple)
  - SameSite=strict cookies prevent CSRF
  - Secure cookies in production
  - Rolling 24-hour expiration
  - SESSION_SECRET from environment
- **CSRF Protection**: 
  - Origin header validation for state-changing operations
  - Middleware executes BEFORE all API routes
  - Production-enforced origin matching
- **Authorization**: 
  - Role-based access control
  - Ownership checks on all user-scoped mutations (listings, bookings, threads, messages, reviews, skills, portfolio)
  - Prevents horizontal/vertical privilege escalation
- **Error Handling**:
  - Global error handler prevents stack trace leakage in production
  - Generic 500 error messages to users
  - Detailed server-side logging only
- **Payment Security**:
  - Server-side calculation of payment amounts
  - No client-supplied totals accepted
  - Proper status validation on booking updates
- **SQL Injection Prevention**: Parameterized queries via Drizzle ORM
- **File Upload Security**: Multi-layered protection for image uploads
  - Pre-upload validation (MIME type, size, rate limiting)
  - Post-upload content validation (magic number checking)
  - Automatic deletion of invalid files
  - File size limits (10MB maximum)
  - Filename sanitization (prevents path traversal attacks)
  - Rate limiting (50 uploads/hour, 200 uploads/day per user)

## External Dependencies

### Payment Services
- **Stripe**: Payment processing, escrow, and Connect accounts for provider payouts
- **Stripe React**: Frontend components for secure payment forms

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting
- **Drizzle Kit**: Database migrations and schema management

### Email Services
- **Mailgun**: Transactional email delivery (configured but not implemented in current codebase)

### Development Tools
- **Replit**: Development environment with integrated debugging and deployment
- **Vite**: Fast development server and build tool with HMR
- **TypeScript**: Type safety across frontend and backend

### UI and Styling
- **Tailwind CSS**: Utility-first styling framework
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **shadcn/ui**: Pre-built component library

### Map Integration
- **Mapbox**: Geographic search and map visualization (referenced but not fully implemented)

### Form Management
- **React Hook Form**: Form state management with validation
- **Hookform Resolvers**: Zod integration for form validation

### File Upload and Object Storage
- **Storage Provider**: Replit Object Storage with Google Cloud Storage backend
- **Upload Interface**: Uppy dashboard for user-friendly file uploads
- **Security**: Comprehensive validation and rate limiting (see Security Features)
- **Supported Formats**: JPEG, PNG, GIF, WebP, SVG images
- **Use Cases**: Project images, profile avatars
- **Access Control**: Public and private object directories