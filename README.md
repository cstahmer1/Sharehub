#ShareHub

A two-sided marketplace platform connecting property owners with service providers and contractors. Property owners post projects with photos, descriptions, locations, and pricing. Providers search, filter, and bid on available work. The platform includes secure messaging, escrow payments, mutual reviews, scheduling, and map-based project discovery.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (Drizzle ORM)
- **Payments**: Stripe + Stripe Connect (escrow)
- **Auth**: Passport.js (session-based)
- **Real-time**: WebSocket messaging
- **Storage**: Cloud object storage for images

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file with the following:

```bash
# Required
DATABASE_URL=postgresql://user:password@localhost:5432/omahasharehub
SESSION_SECRET=your-long-random-secret-here

# Optional - admin accounts (comma-separated emails)
ADMIN_EMAILS=admin@example.com

# Optional - Stripe (app runs in demo mode without these)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional - Object Storage
PRIVATE_OBJECT_DIR=/bucket-name/.private
PUBLIC_OBJECT_SEARCH_PATHS=/bucket-name/public
```

### Database Setup

```bash
npm run db:push
```

### Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5000`.

## Features

- **Dual Roles**: Users can be both property owners and service providers
- **Project Listings**: Create listings with images, categories, pricing, and location
- **Escrow Payments**: Deposit-based escrow with Stripe Connect payouts to providers
- **Real-time Messaging**: WebSocket-powered direct messaging between users
- **Reviews & Ratings**: Mutual review system after project completion
- **Admin Dashboard**: User management, dispute resolution, analytics
- **File Uploads**: Secure image uploads with validation and rate limiting
- **Search & Filter**: Browse projects by category, location, price, and status

## Project Structure

```
├── client/              # React frontend
│   └── src/
│       ├── components/  # UI components
│       ├── hooks/       # Custom React hooks
│       ├── lib/         # Utilities
│       └── pages/       # Route pages
├── server/              # Express backend
│   ├── auth.ts          # Authentication (Passport.js)
│   ├── routes.ts        # API endpoints
│   ├── storage.ts       # Database access layer
│   ├── objectStorage.ts # File storage service
│   └── uploadSecurity.ts# Upload validation
├── shared/              # Shared types & schema
│   └── schema.ts        # Drizzle ORM schema
└── prompt-pack/         # Architecture documentation
```

## License

MIT
