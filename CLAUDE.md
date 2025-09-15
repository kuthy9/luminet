# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development server (runs on port 8080)
npm run dev

# Build for production
npm run build

# Build for development
npm run build:dev

# Type checking
tsc -b

# Linting
npm run lint

# Testing
npm test                # Run tests in watch mode
npm run test:run        # Run tests once
npm run test:ui         # Run tests with UI
npm run test:coverage   # Run tests with coverage
npm run test:watch      # Run tests in watch mode (alias)

# Preview production build
npm run preview
```

## Architecture Overview

This is a React-based creative ideation platform built with modern web technologies. The application follows a feature-based architecture with the following key components:

### Core Technologies
- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom theming
- **State Management**: TanStack Query for server state, React hooks for local state
- **Database**: Supabase (PostgreSQL) with real-time subscriptions
- **Authentication**: Supabase Auth
- **Testing**: Vitest with Testing Library

### Application Structure

#### Pages (Main Features)
- **Index**: Landing page with constellation visualization
- **Spark**: Idea generation and brainstorming interface
- **Mesh**: Network visualization of connected ideas
- **Canvas**: Visual workspace for organizing ideas spatially
- **Muse**: AI-powered creative assistant with enhanced features
- **Incubator**: Project development and collaboration tools
- **Discover**: Public idea discovery and collaboration hub with filtering/search
- **PublicIdea**: Individual public idea view with comments, likes, and collaboration features
- **UserProfile**: Public user profiles showing ideas, stats, and collaboration preferences
- **Subscribe/Subscription**: Payment and subscription management

#### Key Components
- **ConstellationGraph/ConstellationSpace**: Interactive 3D-like visualizations
- **IdeaNode/IdeaInput**: Core idea management components
- **NeuralLayout/NeuralButton**: Themed UI components
- **AuthForm**: Authentication interface
- **CollaborationHub**: Real-time collaboration features
- **KanbanBoard/TimelineView**: Project management interfaces
- **ErrorBoundary**: React error boundary with retry/recovery functionality
- **AIInsightsDashboard/SmartSuggestions**: Enhanced Muse AI features

#### Data Architecture
- **Supabase Integration**: Located in `src/integrations/supabase/`
  - `client.ts`: Supabase client configuration
  - `types.ts`: Generated TypeScript types from database schema
- **Database Tables**: Canvas ideas, ideas, canvases, user profiles, subscriptions, collaboration requests, idea likes/comments/bookmarks
- **Real-time Features**: Collaboration, live updates across sessions, public idea interactions

#### Custom Hooks
- **useAuth**: Authentication state and methods
- **useIdeas**: Idea CRUD operations and state management
- **useMuseChat**: AI chat interface for the Muse feature
- **useMuseEnhanced**: Enhanced AI features with deeper analysis
- **useUsageLimits**: Subscription and usage tracking
- **useCollaboration**: Real-time collaboration features
- **useProjectManagement**: Project and task management
- **useUserProfile**: User profile management and data
- **useErrorHandler**: Comprehensive error handling with categorization and recovery
- **useI18n**: Internationalization support

### Development Notes

#### Path Aliases
- `@/*` maps to `src/*` (configured in both tsconfig.json and vite.config.ts)

#### Testing Configuration
- Tests use Vitest with jsdom environment
- Test files can be `.test.tsx` or `.test.ts`
- Setup file: `src/test/setup.ts`
- Coverage reports available via `npm run test:coverage`

#### TypeScript Configuration
- Relaxed settings for rapid development: `noImplicitAny: false`, `strictNullChecks: false`
- Uses project references with `tsconfig.app.json` and `tsconfig.node.json`

#### Supabase Features
- Database migrations in `supabase/migrations/`
- Edge functions in `supabase/functions/`
- Real-time subscriptions for collaboration features
- Row Level Security (RLS) for data access control

#### Styling Patterns
- Tailwind CSS with custom component variants
- Dark mode support via `next-themes`
- shadcn/ui component library for consistent design
- Custom animations via `tailwindcss-animate`

#### State Management Patterns
- TanStack Query for server state caching and synchronization
- Custom hooks for feature-specific state management
- Context providers for global state (Auth, Theme)

#### Error Handling System
- **Global Error Handler**: Centralized error management with categorization (Network, Auth, Validation, etc.)
- **Error Boundaries**: React error boundaries with user-friendly fallbacks and recovery options
- **TanStack Query Integration**: Automatic error handling for API requests with retry logic
- **Supabase Error Processing**: Specialized handling for database operations and auth errors
- **Error Recovery Hooks**: Retry mechanisms with exponential backoff for failed operations

#### Public Features
- **Idea Discovery**: Public marketplace for creative ideas with advanced filtering
- **Social Interactions**: Likes, comments, bookmarks, and collaboration requests
- **User Profiles**: Public profiles showcasing user creativity and collaboration preferences
- **Collaboration System**: Open collaboration requests and project matching

#### Routing Structure
New routes added:
- `/discover` - Public idea discovery page
- `/idea/:ideaId` - Individual public idea view with social features
- `/user/:userId` - User profile pages with public ideas and stats

This application emphasizes visual creativity tools with real-time collaboration, AI assistance, comprehensive project management capabilities, and a robust public community platform for idea sharing and collaboration.