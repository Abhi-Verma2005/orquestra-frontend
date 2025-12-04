# Web3 Chat Frontend (Next.js + TypeScript)

This is the frontend for the Web3 chat application. It provides:

- Wallet–aware AI chat (Solana + EVM)
- One‑to‑one chats and group chats
- Real‑time streaming via WebSockets
- Chat invites and member management

The app is built on **Next.js App Router**, **TypeScript**, **Drizzle ORM**, and **RainbowKit / Wagmi / Solana wallet adapter**.

---

## Tech Stack

- **Framework**: Next.js 15 (App Router, React Server Components)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **State / Data**:
  - React hooks, contexts (WebSocket + wallet)
  - Drizzle ORM (Postgres)
  - Vercel AI SDK for chat streaming
- **Auth**: NextAuth‑style session via `auth()` helpers
- **Wallets**:
  - EVM: RainbowKit + Wagmi + WalletConnect
  - Solana: `@solana/wallet-adapter-*`
- **Transport**:
  - HTTP: Next.js API routes under `app/api/*`
  - WebSockets: custom Rust backend (separate repo / folder) consumed via `websocket-context`

---

## Project Structure (frontend)

- `app/`
  - `(auth)/login`, `(auth)/register`: auth pages
  - `(chat)/chat/[id]`: main chat page
  - `(chat)/chat/join`: join‑by‑invite flow
  - `api/chat/*`: chat CRUD + invites + members
  - `api/users/search`: user search for invites
  - `wallet-providers.tsx`: EVM + Solana wallet setup
  - `layout.tsx`: root layout + providers + polyfills
- `components/custom/`
  - `chat.tsx`: main chat UI + WebSocket + message routing
  - `chat-members.tsx`: group members sidebar
  - `invite-link-dialog.tsx`: invite link + user search + add member
  - `history.tsx`, `left-sidebar.tsx`, etc.
- `contexts/`
  - `websocket-context.tsx`: WebSocket connect / join / send / events
  - `wallet-context.tsx`: frontend wallet state helper
- `db/`
  - `schema.ts`: Drizzle schema for `Users`, `Chat`, `ChatMembers`, `ChatInvites`, etc.
  - `queries.ts`: server‑only database helpers (saveChat, getChatById, searchUsers, addChatMember, …)

---

## Getting Started (Local)

From `cursorr/frontend`:

```bash
pnpm install
pnpm dev
```

The app will run on `http://localhost:3000`.

You also need:

- A reachable **Postgres** instance
- The **Rust backend** WebSocket server running (see backend README)

---

## Required Environment Variables

Create `.env.local` in `cursorr/frontend` with (at minimum):

```env
POSTGRES_URL=postgres://user:password@host:port/dbname
NEXTAUTH_SECRET=your_long_random_secret
NEXTAUTH_URL=http://localhost:3000

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

> In production (e.g. Vercel), set the same variables in your project settings.

---

## Key Flows

### 1. Creating a New Chat

1. User types the first message on the home screen.
2. `components/custom/chat.tsx`:
   - Calls `POST /api/chat/create` with the first `Message`.
   - Stores a pending first message in `sessionStorage`.
   - Redirects to `/chat/[id]`.
3. `app/(chat)/chat/[id]/page.tsx`:
   - Loads the chat from Postgres with `getChatById`.
   - Hydrates initial messages into the `Chat` component.
4. A `useEffect` in `chat.tsx` picks up the pending message and sends it over WebSocket once connected.

### 2. Group Chat & Invites

- **Adding members:**
  - Use the **Invite** button (`InviteLinkDialog`).
  - Search users via `/api/users/search` (by email / id).
  - Clicking the plus icon calls `POST /api/chat/members` → `addChatMember` in `db/queries.ts`.
  - Group chats are represented by `ChatMembers` rows and `Chat.isGroupChat = true`.

- **Join by invite:**
  - `POST /api/chat/invite` creates a `ChatInvites` row and returns an invite URL.
  - `/chat/join?invite=...` validates the invite and adds the current user as a member.

### 3. WebSocket Messaging

- `websocket-context.tsx`:
  - Maintains a single WebSocket connection.
  - Exposes `joinChat(chatId, userId, userName)` and `sendMessage(...)`.
  - Routes server events (TextStream, TextStreamEnd, ChatMessage, FunctionCall, etc.) back into UI callbacks.

- `chat.tsx`:
  - Joins the room on mount when `chatExists` is true.
  - Streams assistant responses and wallet function results.
  - Has deduplication + room‑scoped message handling so messages don’t leak between chats.

---

## Scripts

From `cursorr/frontend`:

- `pnpm dev` – start Next.js dev server
- `pnpm build` – production build (runs DB migrations + Next build)
- `pnpm lint` – run ESLint

---

## Notes & Gotchas

- **DB connection**: `db/queries.ts` uses `POSTGRES_URL` with `?sslmode=require`. Ensure this is set correctly in all environments.
- **Sessions vs. Users table**:
  - `auth()` returns a session user (from auth/JWT).
  - `chat.userId` / `chatMembers.userId` expect that this ID also exists in your `Users` table.
  - Deleting a `Users` row does **not** automatically invalidate existing sessions.
- **SSR IndexedDB error**:
  - `app/polyfills/indexeddb.ts` defines a safe `globalThis.indexedDB` to stop third‑party libs from throwing `ReferenceError` during SSR on Vercel.

---

## Where to Look for Specific Logic

- **First message / chat creation**: `components/custom/chat.tsx` + `app/api/chat/create/route.ts`
- **Chat loading / access control**: `app/(chat)/chat/[id]/page.tsx` + `db/queries.ts (getChatById, isUserInChat)`
- **Group members & invites**:  
  - API: `app/api/chat/members/route.ts`, `app/api/chat/invite/route.ts`  
  - UI: `components/custom/chat-members.tsx`, `components/custom/invite-link-dialog.tsx`
- **Wallet integration**: `app/wallet-providers.tsx`, `contexts/wallet-context.tsx`, `components/wallet/*`

This README only covers the **frontend**; see the backend (Rust) project for WebSocket server, orchestrator, and tools.***
<a href="https://chat.vercel.ai/">
  <img alt="Next.js 14 and App Router-ready AI chatbot." src="app/(chat)/opengraph-image.png">
  <h1 align="center">Next.js Gemini Chatbot</h1>
</a>

<p align="center">
  An Open-Source AI Chatbot Template Built With Next.js and the AI SDK by Vercel.
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#model-providers"><strong>Model Providers</strong></a> ·
  <a href="#deploy-your-own"><strong>Deploy Your Own</strong></a> ·
  <a href="#running-locally"><strong>Running locally</strong></a>
</p>
<br/>

## Features

- [Next.js](https://nextjs.org) App Router
  - Advanced routing for seamless navigation and performance
  - React Server Components (RSCs) and Server Actions for server-side rendering and increased performance
- [AI SDK](https://sdk.vercel.ai/docs)
  - Unified API for generating text, structured objects, and tool calls with LLMs
  - Hooks for building dynamic chat and generative user interfaces
  - Supports Google (default), OpenAI, Anthropic, Cohere, and other model providers
- [shadcn/ui](https://ui.shadcn.com)
  - Styling with [Tailwind CSS](https://tailwindcss.com)
  - Component primitives from [Radix UI](https://radix-ui.com) for accessibility and flexibility
- Data Persistence
  - [Vercel Postgres powered by Neon](https://vercel.com/storage/postgres) for saving chat history and user data
  - [Vercel Blob](https://vercel.com/storage/blob) for efficient object storage
- [NextAuth.js](https://github.com/nextauthjs/next-auth)
  - Simple and secure authentication

## Model Providers

This template ships with Google Gemini `gemini-1.5-pro` models as the default. However, with the [AI SDK](https://sdk.vercel.ai/docs), you can switch LLM providers to [OpenAI](https://openai.com), [Anthropic](https://anthropic.com), [Cohere](https://cohere.com/), and [many more](https://sdk.vercel.ai/providers/ai-sdk-providers) with just a few lines of code.

## Deploy Your Own

You can deploy your own version of the Next.js AI Chatbot to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Fgemini-chatbot&env=AUTH_SECRET,GOOGLE_GENERATIVE_AI_API_KEY&envDescription=Learn%20more%20about%20how%20to%20get%20the%20API%20Keys%20for%20the%20application&envLink=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Fgemini-chatbot%2Fblob%2Fmain%2F.env.example&demo-title=Next.js%20Gemini%20Chatbot&demo-description=An%20Open-Source%20AI%20Chatbot%20Template%20Built%20With%20Next.js%20and%20the%20AI%20SDK%20by%20Vercel.&demo-url=https%3A%2F%2Fgemini.vercel.ai&stores=[{%22type%22:%22postgres%22},{%22type%22:%22blob%22}])

## Running locally

You will need to use the environment variables [defined in `.env.example`](.env.example) to run Next.js AI Chatbot. It's recommended you use [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables) for this, but a `.env` file is all that is necessary.

> Note: You should not commit your `.env` file or it will expose secrets that will allow others to control access to your various Google Cloud and authentication provider accounts.

1. Install Vercel CLI: `npm i -g vercel`
2. Link local instance with Vercel and GitHub accounts (creates `.vercel` directory): `vercel link`
3. Download your environment variables: `vercel env pull`

```bash
pnpm install
pnpm dev
```

Your app template should now be running on [localhost:3000](http://localhost:3000/).
