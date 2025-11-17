# Multi-Tenant Kanban Board - Technical Architecture

This README explains how each layer of the application behaves. The focus is on runtime flow and responsibilities rather than setup.

## 1. System Overview
- Runtime: Next.js 14 App Router on Node.js 20 with TypeScript.
- Persistence: PostgreSQL through Prisma (see prisma/schema.prisma).
- Authentication: NextAuth credentials provider with helpers in src/lib/auth.ts.
- Real-time transport: custom Server-Sent Events (SSE) pipeline.
- UI: React components rendered via App Router layouts and Tailwind utility classes.

```
Browser (fetch + EventSource)
     ||
API Route Handlers (src/app/api/**)
     ||
Services (src/core/services/**)
     ||
Repositories (src/core/repositories/**) -> Prisma Client -> PostgreSQL
       \
        SSE Registry (src/lib/sse/boardStreamRegistry.ts)
```

## 2. Transport Layer (HTTP + SSE)
### HTTP handlers
- Located under src/app/api.
- Each handler:
  1. Reads dynamic params (tenantSlug, boardId, todoId).
  2. Calls requireAuth() to resolve the current user.
  3. Uses helpers from src/lib/tenant.ts to verify membership and roles.
  4. Validates the payload with the relevant Zod schema in src/lib/validation.
  5. Invokes the correct service.
- Protected routes export `dynamic = 'force-dynamic'` so Next.js never prerenders them.

### SSE handlers
- src/app/api/stream/boards/[boardId]/route.ts exposes board level events.
- src/app/api/stream/tenants/[tenantSlug]/route.ts exposes tenant level events.
- Flow for both handlers:
  - Authenticate and check membership before opening a stream.
  - Create a ReadableStream whose controller is registered inside the SSE registry.
  - Attach request.signal abort listeners to clean up and close the controller.
  - Return `Response(stream, { headers: { 'Content-Type': 'text/event-stream', ... } })` and set `export const runtime = 'nodejs'`.

## 3. Service Layer (src/core/services)
- boardService: enforces membership and role checks, validates unique board names per tenant, performs CRUD through boardRepository, and emits boardCreated/boardUpdated/boardDeleted events.
- todoService: validates access to the target board, executes CRUD through todoRepository, and emits todo specific events so Kanban clients stay in sync.
- tenantService: coordinates tenant creation, user onboarding, and membership assignments.
- Services are the only layer allowed to trigger SSE broadcasts and to map domain models into DTOs returned by handlers.

## 4. Repository Layer (src/core/repositories)
- Wraps Prisma Client into intent revealing functions such as findByTenantId, existsByNameAndTenant, update, delete, etc.
- Contains zero business logic: repositories only read and write data.
- Switching the datastore or optimizing queries touches only this layer.

## 5. Domain Models, DTOs, Validation
- Domain models live in src/core/domain/models and describe Board, Todo, Tenant, UserTenant.
- DTO definitions in src/types/dto determine what is sent to the client (BoardSummary, TodoItem, TenantSummary).
- Zod schemas in src/lib/validation catch malformed input at the API boundary before anything hits business logic.

## 6. Authentication and Authorization
- src/lib/auth.ts exposes getCurrentUser() and requireAuth() around NextAuth sessions.
- src/lib/tenant.ts centralizes helpers such as requireTenantBySlug, requireUserMembership, checkUserRole, getUserRole.
- Permission model: only creators or owners can update or delete boards; members can read and create within their tenant but cannot remove what others created.

## 7. SSE Infrastructure
### Registry
- Implemented in src/lib/sse/boardStreamRegistry.ts.
- Tracks active board level connections and tenant level connections. Each entry stores connection id, user id, target id, controller, and heartbeat interval.
- Provides methods register, registerTenant, broadcast, broadcastToTenant, unregister, unregisterTenant.

### Event flow
1. API handler calls a service function.
2. Service mutates state through the repository layer.
3. Service builds an event payload via createBoardEvent or createTodoEvent.
4. Service calls boardStreamRegistry.broadcast*.
5. Registry pushes serialized SSE messages onto every matching controller.
6. Clients subscribed via EventSource receive the payload and update local state without polling.

## 8. Frontend Execution Model
- Server components under src/app/... load initial data using the same services (e.g., src/app/app/[tenantSlug]/boards/page.tsx).
- Client components:
  - BoardsList handles board CRUD UI, uses ConfirmDialog for destructive actions, and subscribes to tenant level SSE to keep the list synchronized.
  - KanbanBoard renders the TODO/IN_PROGRESS/DONE columns and listens to board level events.
  - TodoCard offers inline status changes through the Select component, shows toast notifications, and reuses ConfirmDialog for task deletion.
- State management: local React state plus SSE listeners; no global store required, the server remains the source of truth.
- Styling: Tailwind utility classes plus CSS variables defined in src/app/globals.css for consistent colors, surfaces, and typography.

## 9. Error Handling and Security
- src/lib/api-response.ts exports helpers (ok, created, badRequest, forbidden, internalServerError, etc.) so handlers respond consistently.
- Critical failures log context aware messages (for example, `[Create Board Error]`).
- Every Prisma query that touches tenant data filters by tenantId or membership to enforce isolation.
- Passwords are hashed with bcrypt during registration inside tenantService before persisting users.

## 10. Build and Deploy Notes
- `npm run build` is defined as `prisma generate && next build` to regenerate Prisma Client before bundling (important on Vercel caches).
- SSE routes set both `runtime = 'nodejs'` and `dynamic = 'force-dynamic'` so long lived connections keep working and sessions remain available.

## 11. Example Flow: delete todo
1. User confirms deletion inside TodoCard.
2. Component issues fetchDelete to `/api/{tenant}/boards/{board}/todos/{todo}`.
3. Handler authenticates, validates, and calls todoService.deleteTodo.
4. Service checks membership, removes the row via todoRepository, and creates a todoDeleted event.
5. boardStreamRegistry.broadcast(boardId, event) writes onto every board level stream.
6. Each KanbanBoard subscribed to that board receives the event and removes the todo locally in real time.
