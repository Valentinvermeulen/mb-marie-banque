# Banking Application

## Overview

This is a comprehensive mobile-first banking application built for the CIC (Crédit Industriel et Commercial) bank. The application provides separate interfaces for bank clients and financial advisors, featuring account management, card management, and transaction processing capabilities. The system is designed as a full-stack TypeScript application with a React frontend and Express.js backend, utilizing a PostgreSQL database with Drizzle ORM for data management.

## Recent Changes (January 2025)

✓ **Database Migration Completed**: Successfully migrated from in-memory storage to PostgreSQL database with full data persistence
✓ **User Registration System**: Added public registration with email validation and username uniqueness checks
✓ **PIN Setup Workflow**: Implemented mandatory 6-digit PIN creation for new clients with automatic account/card generation
✓ **Advisor Approval System**: Created approval workflow where advisors can approve new client registrations
✓ **Real-time Data Sync**: All account, card, and transaction data now persists in PostgreSQL with real-time updates
✓ **Statistics Fix (August 2025)**: Resolved route conflicts causing advisor dashboard to show 0 clients instead of actual count (2 clients)
✓ **Enhanced Client Interface**: Added comprehensive account management with 4 functional sections:
  - Agency Information display
  - Direct advisor communication system
  - RIB/IBAN management space
  - Biometric authentication settings with native device support
✓ **Bank Information Updates**: Fixed persistent data updates allowing advisors to modify bank details in real-time
✓ **Bug Fixes (August 2025)**:
  - Fixed navigation issues in RIB/IBAN section with proper header routing
  - Enhanced advisor name updates with real-time synchronization (5-second refresh)
  - Added account deletion functionality for advisors with balance verification
  - Corrected IBAN display in client interface after database migration
  - Implemented secure account deletion API with confirmation prompts
✓ **Account Management Rules (August 2025)**:
  - RIB/IBAN creation is now manual only (no automatic generation)
  - Maximum 2 current accounts per client enforced
  - One RIB per client (shared across all their accounts)
  - Savings accounts (Livret A) have no RIB/IBAN
  - Advisors have full control over RIB creation and management
✓ **Design Transformation Complete (August 2025)**:
  - Full rebrand from CIC to MB MARIE BANQUE with new logo integration
  - Complete dark theme implementation with futuristic animations
  - Animated gradient backgrounds with color shifting effects
  - Rotating border animations around "Actions Rapides" section
  - Glassmorphism effects on cards and modern UI elements
  - Logo integration on login, register, dashboards, and virtual bank cards
  - Mobile-responsive design optimized for all screen sizes
  - Enhanced button styling with proper color contrast and text visibility
✓ **Final Color Corrections (August 2025)**:
  - Fixed all remaining dark theme visibility issues across entire application
  - Virtual card display now properly visible with glassmorphism effects
  - PIN modal and numeric keypad fully adapted to dark theme
  - All text elements converted from gray/black to white/white opacity variants
  - Bottom navigation and transfer modals corrected for visibility
  - Account cards and transaction displays modernized with proper contrast
  - Complete systematic color audit and correction implemented
✓ **Transaction Display Enhancement (August 2025)**:
  - Implemented intelligent IBAN-based internal transfer detection
  - Fixed transaction display to show correct sender/recipient names
  - Added proper +/- signs based on transaction direction (outgoing = -, incoming = +)
  - Enhanced notifications with actual sender names instead of generic messages
  - Improved transaction API to include sender and recipient name information
  - Corrected color coding: red for outgoing transfers, green for incoming transfers
✓ **Transfer System Perfection (August 2025)**:
  - Made transfer description field completely optional for user convenience
  - Resolved bidirectional transfer detection ensuring Marie ↔ Valentin transfers work flawlessly
  - Fixed IBAN validation to correctly identify internal vs external transfers
  - Enhanced error handling for beneficiary creation (added missing updated_at column)
  - Confirmed full functionality: both users can send/receive money with proper name detection
  - Corrected schema validation to accept optional descriptions without breaking transfers
✓ **Logo Integration Update (August 2025)**:
  - Successfully integrated new simplified MB MARIE BANQUE logo (4C3AC811-0CFB-48D4-BC8E-1044C48FF3F7_1754406833025.png)
  - Replaced all previous logo references across entire application
  - Logo positioned discretely in top-left corner of client pages (h-16 size)
  - Optimized logo sizing: h-6 for login/register pages, h-16 for client interface visibility
  - Logo maintains professional appearance while being clearly visible to users
  - Enhanced brand consistency throughout the application with appropriate contrast
✓ **Modern Advisor Interface Implementation (August 2025)**:
  - Complete interface redesign inspired by client space layout for consistent UX
  - Sidebar navigation with glassmorphism effects matching client interface design
  - Modern welcome screen with personalized greeting and advisor statistics
  - Actions rapides section with animated gradient borders and hover effects
  - Advisor information panel with professional avatar and contact button
  - Recent activity dashboard showing approved clients and pending approvals
  - Responsive sidebar navigation replacing horizontal tabs for better mobile experience
  - All text elements properly adapted to dark theme with white/opacity variants
  - Seamless integration with existing advisor functionality and modals
✓ **Enhanced Client Notification System (August 2025)**:
  - Modern notification modal with type-based visual styling (WARNING/INFO/SUCCESS)
  - Glassmorphism design with colored icons and badges for clear distinction
  - Interactive elements with hover effects and pulse animations
  - Functional "Mark all as read" button with proper mutation handling
  - Color-coded notification types: orange for warnings, blue for info, green for success
✓ **Financial Health Mini-Dashboard (August 2025)**:
  - Real-time financial health metrics integrated into client home screen
  - Dynamic calculation of total account balance across all user accounts
  - Monthly spending analysis with automatic transaction filtering
  - Intelligent financial health scoring system (45-95 points based on balance and overdraft status)
  - Contextual daily advice system with personalized recommendations
  - Visual metrics cards with gradient backgrounds and appropriate iconography
  - Responsive grid layout supporting both desktop and mobile viewing experiences

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for development tooling
- **UI Framework**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: TanStack React Query for server state management and data fetching
- **Routing**: Wouter for lightweight client-side routing
- **Mobile-First Design**: Responsive design optimized for mobile devices with a maximum width container

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with JSON responses
- **Authentication**: Simple username/password authentication with localStorage persistence
- **Error Handling**: Centralized error handling middleware with structured error responses
- **Development Tools**: Hot module reloading with Vite integration in development mode

### Database Design
- **Database**: PostgreSQL with connection via Neon serverless
- **ORM**: Drizzle ORM with schema-first approach
- **Schema Structure**:
  - Users table with role-based access (client/advisor)
  - Accounts table supporting multiple account types (courant, epargne, pel)
  - Cards table for virtual and physical payment cards
  - Transactions table for financial operations
- **Data Validation**: Zod schemas for runtime type checking and validation

### Authentication & Authorization
- **Client Authentication**: Username/password login with role-based routing
- **Session Management**: Local storage for user session persistence
- **PIN Verification**: 6-digit PIN system for transaction authorization
- **Role-Based Access**: Separate interfaces and permissions for clients vs advisors

### Application Features
- **Client Features**: Account overview, transaction history, money transfers, card management, PIN operations, agency information access, direct advisor communication, RIB/IBAN management, biometric authentication
- **Advisor Features**: Client management, card creation, account monitoring, IBAN generation, real-time statistics dashboard, bank information management
- **Transaction Processing**: Internal and external transfers with real-time balance updates
- **Card Management**: Virtual card creation, blocking/unblocking, PIN management
- **Biometric Authentication**: Native device integration (Face ID, Touch ID, Windows Hello, Android fingerprint)

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: PostgreSQL connection driver for serverless environments
- **drizzle-orm** & **drizzle-kit**: Database ORM and migration tools
- **express**: Web application framework for Node.js
- **react** & **react-dom**: Frontend framework and DOM rendering

### UI Component Libraries
- **@radix-ui/react-***: Comprehensive set of unstyled, accessible UI primitives
- **tailwindcss**: Utility-first CSS framework for styling
- **class-variance-authority**: Utility for creating type-safe component variants
- **lucide-react**: Icon library for consistent iconography

### Development & Build Tools
- **vite**: Frontend build tool and development server
- **typescript**: Static type checking
- **tsx**: TypeScript execution engine for Node.js
- **esbuild**: JavaScript bundler for production builds

### Data Management
- **@tanstack/react-query**: Server state management and caching
- **react-hook-form** & **@hookform/resolvers**: Form handling and validation
- **zod**: Schema validation library
- **date-fns**: Date manipulation utilities

### Specialized Libraries
- **wouter**: Lightweight routing library for React
- **cmdk**: Command palette component
- **embla-carousel-react**: Carousel component for image/content sliding
- **nanoid**: Unique ID generation