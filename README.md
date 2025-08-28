# AffiFlow - Content Creator Platform

AffiFlow is a SaaS platform designed for content creators in decor, lifestyle, and product review niches. It allows creators to build beautiful content channels with integrated product tagging and affiliate marketing capabilities.

## 🎯 Key Features

- **Multi-Workspace Support**: Users can create and manage multiple content channels
- **Video Integration**: Seamless embedding of YouTube, TikTok, and Instagram videos
- **Product Tagging**: Tag products in videos with timestamps and affiliate links
- **Custom Branding**: Personalized workspace themes and custom domains
- **Analytics & Tracking**: Comprehensive view, click, and conversion tracking
- **Subscription Management**: Flexible pricing plans with Stripe integration

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 15 with TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5
- **Deployment**: Vercel (recommended)

### Database Schema

- **Multi-tenant architecture** with workspace isolation
- **User management** with role-based access control
- **Content management** for posts, videos, and products
- **Analytics tracking** for performance monitoring
- **Subscription billing** integration

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd AffiFlow
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` with your database and other configuration values.

4. Set up the database:

```bash
# Start Prisma dev server (if using Prisma Postgres)
npx prisma dev

# Run migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate
```

5. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard pages
│   ├── (public)/          # Public workspace pages
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/                # shadcn/ui components
│   ├── layout/            # Layout components
│   ├── workspace/         # Workspace-specific components
│   └── content/           # Content management components
├── lib/                   # Utility functions
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
└── generated/             # Generated files (Prisma client)
```

## 🎨 Design System

The project uses shadcn/ui components with a custom design system:

- **Primary Color**: Indigo (600)
- **Typography**: Geist Sans & Geist Mono
- \*\*[object Object] Development

### 📋 Development Rules & Standards

Before contributing, please read our comprehensive development guidelines:

- **[Quick Reference Guide](./docs/QUICK_REFERENCE.md)** - Essential patterns and checklists
- **[Development Rules](./docs/rules/DEVELOPMENT_RULES.md)** - Core principles and architecture
- **[Coding Standards](./docs/rules/CODING_STANDARDS.md)** - Code style and best practices
- **[Database Rules](./docs/rules/DATABASE_RULES.md)** - Database design and query patterns
- **[UI Component Rules](./docs/rules/UI_COMPONENT_RULES.md)** - Component design and shadcn/ui usage

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open Prisma Studio

### Database Management

- `npx prisma migrate dev` - Create and apply migrations
- `npx prisma generate` - Generate Prisma client
- `npx prisma studio` - Visual database browser
- `npx prisma reset` - Reset database (development only)

### Code Quality Checklist

Before submitting any code:

- [ ] All TypeScript errors resolved
- [ ] Workspace isolation implemented
- [ ] Error handling added
- [ ] Loading states included
- [ ] Tests written (when applicable)
- [ ] Documentation updated

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables

Required environment variables for production:

- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - NextAuth.js secret key
- `NEXTAUTH_URL` - Application URL

## 📊 Business Model

AffiFlow operates on a subscription-based model:

- **Free Tier**: Basic features, limited workspaces
- **Basic Plan**: $19-39/month per workspace
- **Pro Plan**: Advanced analytics and custom features
- **Enterprise**: Custom pricing for large creators

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is[object Object]

- Create an issue in the repository
- Contact: support@affiflow.com

---

Built with ❤️ for content creators worldwide.
