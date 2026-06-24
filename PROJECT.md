# Locked-In Project

## 1. Project Overview
"Locked-In" is a secure, campus-focused study and skill room web platform. It enables verified university students to create, join, and manage both free and paid educational sessions (study rooms for academics, and skill rooms for any topics like AI or Design). The platform includes real-time chat, attendance tracking, and a curated repository for free learning resources.

## 2. Repository Structure & Services
The repository is structured as a monorepo containing the core application alongside several microservices and marketing tools.

### Core Web Application (`/`)
The main platform interface and backend logic.
- **Framework**: Next.js 16 (App Router) with React 19 and TypeScript.
- **Styling**: Tailwind CSS v4.
- **Backend/Database**: Supabase (Auth, real-time DB, Storage, RLS policies).
- **Authentication**: Clerk (`@clerk/nextjs`) alongside Supabase integrations.
- **Payments**: Paystack integration for handling paid room transactions and platform commission logic.
- **Other Tools**: Resend & React Email (transactional emails), Canvas-Confetti (UI gamification), Sentry (error tracking).
- **Key Features**: Secure room links, Paystack checkout flow, per-user unique tokens for online access, room chat, and resource uploading with a thumbs up/down rating system.

### WhatsApp Service (`/whatsapp-service`)
A standalone background worker written in Go.
- **Tech Stack**: Go, SQLite (`store.db`), `whatsmeow` library.
- **Purpose**: Connects a designated "Locked In" WhatsApp account via QR code. It handles automated messaging and notifications.
- **Cron Job**: It features an internal cron that pings the Next.js API (`/api/cron/reminders`) every 5 minutes to trigger and dispatch pending WhatsApp reminders/notifications to students.

### UMaT Campaign Landing Page (`/umat-campaign`)
A separate, lightweight Next.js application tailored for a marketing and launch campaign at UMaT (University of Mines and Technology).
- **Tech Stack**: Next.js 16, Tailwind CSS v4, Supabase JS client.
- **Deployment**: Configured with Netlify (`netlify.toml` and plugins).

### Programmatic Video (`/remotion-video`)
A module using Remotion for programmatic video generation. This is likely used for dynamically generating personalized marketing videos, social media promotional content, or automated course teasers.

### Testing & Infrastructure
- **E2E Testing**: Located in `/e2e` and `/testsprite_tests`, utilizing Playwright for robust end-to-end user flow testing.
- **Database Migrations**: Located in `/supabase`, containing the schema and migrations for the real-time rooms, chat, transactions, and resource tables.
- **Design Specifications**: UI designs and design system elements are located in `/stitch_screens`.

## 3. Core Business Logic
1. **User Verification**: Only users with verified student emails can participate.
2. **Access Control (RLS)**: Users can only see chat and access links for rooms they have joined (and paid for, if applicable).
3. **Monetization**: Room creators can host paid sessions. The platform takes a default 10% commission via Paystack.
4. **Content Security**: Paid online sessions use per-user unique tokens generated upon successful payment to prevent link-sharing.

*This document was generated comprehensively based on the `PROJECT.md` specification and the actual services found in the repository.*
