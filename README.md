# 🏍️ Motor Shop Inventory + POS System

A complete inventory management and point-of-sale system built with Next.js 14+, TypeScript, Supabase, and Tailwind CSS.

## Features

### Admin Portal
- **Dashboard** - Overview with stats, low stock alerts, and quick actions
- **Inventory Management** - Add, edit, delete motor parts with full CRUD operations
- **Categories** - Manage product categories
- **Suppliers** - Track supplier information
- **Users** - Manage cashier and admin accounts
- **Reports** - Generate and download PDF reports:
  - Sales Report (Daily/Weekly/Monthly)
  - Stock Report (All/Low Stock/Out of Stock)
  - Transaction Report (Custom date range)
- **Settings** - Configure shop preferences

### Cashier Portal
- **POS Counter** - Fast point-of-sale interface with:
  - Category filtering
  - Product search
  - Cart management
  - Tax and discount support
  - Multiple payment methods (Cash/Card/Other)
  - Automatic change calculation
  - Real-time stock deduction
- **Transaction History** - View own sales history

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16+ (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **Components** | Custom shadcn/ui-style components |
| **Icons** | Lucide React |
| **Animations** | Framer Motion |
| **Validation** | Zod |
| **PDF Reports** | jsPDF + jspdf-autotable |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth |

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- A Supabase account and project

### Installation

1. **Clone or navigate to the project:**
   ```bash
   cd motor-shop-inventory
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   
   Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. **Set up the database:**
   
   Run the SQL migration in your Supabase SQL editor:
   ```
   database/schema.sql
   ```

5. **Create your first admin user:**
   - Go to Supabase Dashboard → Authentication → Users
   - Add a new user with email/password
   - In the SQL editor, run:
     ```sql
     UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
     ```

6. **Run the development server:**
   ```bash
   npm run dev
   ```

7. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
motor-shop-inventory/
├── src/
│   ├── app/
│   │   ├── (auth)/login/          # Login page
│   │   ├── admin/                  # Admin portal
│   │   │   ├── dashboard/          # Stats overview
│   │   │   ├── inventory/          # Product management
│   │   │   ├── categories/         # Category management
│   │   │   ├── suppliers/          # Supplier management
│   │   │   ├── users/              # User management
│   │   │   ├── reports/            # PDF reports
│   │   │   └── settings/           # App settings
│   │   └── cashier/                # Cashier portal
│   │       ├── pos/                # Point of sale
│   │       └── transactions/       # Sales history
│   ├── components/
│   │   ├── ui/                     # Reusable UI components
│   │   ├── admin/                  # Admin-specific components
│   │   ├── cashier/                # Cashier-specific components
│   │   └── shared/                 # Shared components
│   ├── hooks/                      # Custom React hooks
│   │   ├── useAuth.ts              # Authentication hook
│   │   ├── useInventory.ts         # Inventory management hook
│   │   ├── usePOS.ts               # POS cart management hook
│   │   └── useSales.ts             # Sales processing hook
│   ├── lib/
│   │   ├── supabase/               # Supabase client setup
│   │   ├── pdf/                    # PDF generation utilities
│   │   └── validations/            # Zod validation schemas
│   └── types/                      # TypeScript type definitions
├── database/
│   └── schema.sql                  # Database migration script
├── middleware.ts                   # Route protection middleware
└── .env.local                      # Environment variables
```

## Database Schema

The application uses the following tables:
- `profiles` - User profiles with role-based access (admin/cashier)
- `categories` - Product categories
- `suppliers` - Supplier information
- `inventory` - Motor parts and stock levels
- `sales` - Completed sale transactions
- `sale_items` - Items sold per transaction

Row Level Security (RLS) policies ensure:
- Admins have full access to all data
- Cashiers can only view inventory and create sales
- Cashiers can only view their own transactions

## Role-Based Access Control

| Feature | Admin | Cashier |
|---|---|---|
| POS Counter | ❌ | ✅ |
| View Inventory | ✅ | ✅ (via POS) |
| Add/Edit/Delete Parts | ✅ | ❌ |
| Manage Categories | ✅ | ❌ |
| Sales Reports + PDF | ✅ | ❌ |
| Stock Reports + PDF | ✅ | ❌ |
| All Transactions | ✅ | ❌ |
| Own Transactions | ✅ | ✅ |
| Manage Suppliers | ✅ | ❌ |
| Manage Users | ✅ | ❌ |
| App Settings | ✅ | ❌ |

## Build for Production

```bash
npm run build
npm start
```

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables in Vercel settings
4. Deploy

### Supabase Cloud
Your Supabase project should be hosted on Supabase Cloud for production use.

## License

MIT

---

Built with ❤️ using Next.js and Supabase
