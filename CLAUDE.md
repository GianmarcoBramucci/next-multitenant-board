Piano tecnico completo - Mini Trello multi-tenant con Next.js + Supabase (solo DB) + SSE
=======================================================================================

Obiettivo
---------
Costruire una mini app tipo Trello:
- multi-tenant (più organizzazioni, dati isolati)
- con todo/task per board
- collaborativa in tempo reale (aggiornamenti live tra utenti sullo stesso board)
- full-stack Next.js (frontend + backend nello stesso repo)
- nessun servizio esterno per realtime (solo DB Supabase + codice nostro con SSE)
- TypeScript ovunque, tipi forti e chiari, architettura a layer ben separati.


STACK TECNICO (definitivo)
--------------------------
- Runtime: Node.js 20+
- Framework full-stack: Next.js 14 (App Router) con TypeScript
- Database: PostgreSQL su Supabase (usato SOLO come DB)
- ORM / Data layer: Prisma
- Auth: NextAuth (Auth.js) con provider Credentials (email/password, nessun provider esterno)
- Realtime: SSE (Server-Sent Events) implementato a mano (niente Pusher, niente Socket.io)
- Validazione dati: Zod
- UI: React + Tailwind CSS
- State management client: hooks + context o Zustand (facoltativo), sempre tipizzato.

====================================================================
1. DATABASE (Supabase Postgres + Prisma)
====================================================================

1.1. Modello concettuale
------------------------
Entità principali:
- Tenant: organizzazione / team, separa logicamente i dati.
- User: utente globale, può appartenere a più tenant.
- UserTenant: tabella di join user→tenant con ruolo.
- Board: progetto/tabella Kanban appartenente a un tenant.
- Todo: singolo task con status, titolo, descrizione, assegnatario, ecc.
- TodoActivity: log di attività sui todo (per audit e per eventuali stream, opzionale ma utile).

Multi-tenancy: row-level
- Ogni record che appartiene a un tenant ha un campo tenantId (UUID) e gli accessi passano sempre da lì.
- Nessun dato cross-tenant visibile tramite query: tutte le query filtrano per tenantId.
- Le URL usano un tenantSlug (es. /app/acme/boards), che viene risolto in tenantId sul server.


1.2. Schema Prisma (logica tabelle)
-----------------------------------
datasource e generator:
- datasource db: provider "postgresql", url env("DATABASE_URL")
- generator client: prisma-client-js

Modelli:

Tenant
- id: String @id @default(uuid())
- name: String @unique
- slug: String @unique (per URL, es. "acme-corp")
- createdAt: DateTime @default(now())
- updatedAt: DateTime @updatedAt
- memberships: [UserTenant] (1-N)
- boards: [Board] (1-N)
- activities: [TodoActivity] (1-N)

User
- id: String @id @default(uuid())
- email: String @unique
- passwordHash: String (bcrypt)
- displayName: String (nome da mostrare nel board)
- isActive: Boolean @default(true)
- createdAt: DateTime @default(now())
- updatedAt: DateTime @updatedAt
- memberships: [UserTenant]
- boards: [Board] (board creati dall’utente)
- todosCreated: [Todo]
- todosAssigned: [Todo]
- activities: [TodoActivity]

UserTenant (membership)
- id: String @id @default(uuid())
- userId: String (FK → User.id)
- tenantId: String (FK → Tenant.id)
- role: String @default("member") // 'owner' | 'admin' | 'member'
- createdAt: DateTime @default(now())
Relazioni:
- user: User @relation(fields: [userId], references: [id])
- tenant: Tenant @relation(fields: [tenantId], references: [id])
Vincoli:
- @@unique([userId, tenantId])
- @@index([tenantId])
- @@index([userId])

Board
- id: String @id @default(uuid())
- tenantId: String (FK → Tenant.id)
- name: String
- description: String?
- createdById: String (FK → User.id)
- createdAt: DateTime @default(now())
- updatedAt: DateTime @updatedAt
Relazioni:
- tenant: Tenant @relation(fields: [tenantId], references: [id])
- createdBy: User @relation("BoardCreatedBy", fields: [createdById], references: [id])
- todos: [Todo]
- activities: [TodoActivity]
Vincoli:
- @@index([tenantId])
- @@unique([tenantId, name]) // evita nomi duplicati per tenant

Enum TodoStatus
- TODO
- IN_PROGRESS
- DONE

Todo
- id: String @id @default(uuid())
- tenantId: String (FK → Tenant.id)
- boardId: String (FK → Board.id)
- title: String
- description: String?
- status: TodoStatus @default(TODO)
- assigneeId: String? (FK → User.id, opzionale)
- createdById: String (FK → User.id)
- position: Int @default(0) (per ordinamento all’interno del board)
- createdAt: DateTime @default(now())
- updatedAt: DateTime @updatedAt
Relazioni:
- tenant: Tenant @relation(fields: [tenantId], references: [id])
- board: Board @relation(fields: [boardId], references: [id])
- assignee: User? @relation("TodoAssignee", fields: [assigneeId], references: [id])
- createdBy: User @relation("TodoCreatedBy", fields: [createdById], references: [id])
- activities: [TodoActivity]
Vincoli/indici:
- @@index([tenantId])
- @@index([boardId])
- @@index([status])
- @@index([assigneeId])

TodoActivity ( opzionale ma raccomandata )
- id: String @id @default(uuid())
- tenantId: String (FK → Tenant.id)
- boardId: String (FK → Board.id)
- todoId: String (FK → Todo.id)
- userId: String (FK → User.id)
- action: String // es. "CREATED" | "UPDATED" | "DELETED" | "STATUS_CHANGED"
- metadata: Json? // informazioni extra (before/after)
- createdAt: DateTime @default(now())
Relazioni:
- tenant: Tenant @relation(fields: [tenantId], references: [id])
- board: Board @relation(fields: [boardId], references: [id])
- todo: Todo @relation(fields: [todoId], references: [id])
- user: User @relation(fields: [userId], references: [id])
Indici:
- @@index([tenantId])
- @@index([boardId])
- @@index([todoId])

1.3. Migrazioni e best practice DB
----------------------------------
- Usare `prisma migrate dev` per gestire migrazioni e sincronizzare schema con Supabase.
- Non modificare direttamente lo schema da Supabase SQL editor (solo per debugging).
- Ogni cambiamento di schema passa da Prisma:
  - modifica `schema.prisma`
  - `npx prisma migrate dev --name descriptive_name`
- Abilitare log query su Prisma solo in sviluppo (già incluso nel client).

====================================================================
2. ARCHITETTURA BACKEND IN NEXT.JS (LAYER BEN DEFINITI)
====================================================================

2.1. Struttura cartelle (indicativa)
------------------------------------
src/
  app/
    api/
      auth/
        [...nextauth]/route.ts         // NextAuth handlers
      tenants/
        route.ts                       // GET lista tenant dell’utente
      app/
        [tenantSlug]/
          boards/
            route.ts                   // GET/POST boards per tenant
          boards/
            [boardId]/
              route.ts                 // GET/PATCH/DELETE board
              todos/
                route.ts               // GET/POST todos
                [todoId]/
                  route.ts             // PATCH/DELETE todo
      stream/
        boards/
          [boardId]/route.ts           // SSE stream per un board
  core/
    domain/
      models.ts                        // tipi dominio (Tenant, Board, Todo, ecc.)
      valueObjects.ts                  // eventuali value object (Status, Slug, ecc.)
    services/
      tenantService.ts                 // logica business tenant
      boardService.ts                  // logica business board
      todoService.ts                   // logica business todo
      activityService.ts               // scrittura attività
    repositories/
      tenantRepository.ts              // accesso DB tenant
      userRepository.ts
      boardRepository.ts
      todoRepository.ts
      activityRepository.ts
  lib/
    prisma.ts                          // client Prisma singleton
    auth.ts                            // helper getCurrentUser, getUserTenants
    tenant.ts                          // helper getTenantBySlug + check membership
    sse/
      boardStreamRegistry.ts           // gestione connessioni SSE per board
      events.ts                        // tipi eventi SSE, helper broadcast
    validation/
      authSchemas.ts                   // Zod schema per register/login
      boardSchemas.ts
      todoSchemas.ts
  types/
    dto/
      auth.ts                          // DTO input/output auth
      board.ts                         // DTO per board
      todo.ts                          // DTO per todo


2.2. Layer logici e responsabilità (forte separazione)
------------------------------------------------------

Layer 1 - Domain layer (core/domain)
- Contiene i tipi fondamentali e la logica più “pura” (senza Next, senza Prisma):
  - Tipi Typescript per Tenant, Board, Todo, TenantMembership, ecc.
  - Eventuali funzioni di dominio (es. `canChangeStatus(from, to)` se volessi regole complesse).
- Non importa da framework o librerie esterne (salvo tipi generici).
- Serve per mantenere il business logic indipendente dall’infrastruttura.

Layer 2 - Repository layer (core/repositories)
- Incapsula tutte le operazioni di accesso ai dati (CRUD) verso Prisma.
- Esempi:
  - `boardRepository.findByTenant(tenantId: string)`
  - `todoRepository.createForBoard(input: CreateTodoInput)`
  - `userRepository.findByEmail(email: string)`
- Qui si usano:
  - prisma
  - mapping tra prisma models e domain models (se vuoi separarli)
- Nessuna logica di business complessa, solo:
  - query
  - filtri
  - mapping dei risultati.

Layer 3 - Service layer (core/services)
- Queste sono le “use case functions” che implementano logica di business:
  - `createBoardForTenant(userId, tenantId, data)`
    - verifica che l’utente appartenga al tenant (chiamando repository).
    - crea il board.
  - `createTodoForBoard(userId, tenantId, boardId, data)`
    - verifica membership
    - verifica che il board appartenga al tenant
    - calcola `position`
    - chiama repository per creare todo
    - registra attività
    - notifica il layer SSE (broadcast evento).
  - `updateTodo(userId, tenantId, boardId, todoId, patch)`
    - carica todo
    - applica regole (es: validazione status)
    - scrive modifiche
    - registra attività
    - broadcast.
- Qui entra la logica di permessi base (chi può fare cosa), oltre a ruoli (owner/admin/member).

Layer 4 - Transport layer (API HTTP + SSE) (app/api + lib/sse)
- API HTTP (route handlers):
  - Convertono Request → input DTO tipizzati (validati con Zod).
  - Ottenengono sessione utente con NextAuth.
  - Risolvono tenant tramite slug (es. `getTenantBySlug`).
  - Chiamano service layer, gestiscono errori e restituiscono Response JSON.
  - Non contengono logica di business pesante (solo orchestrazione).
- SSE endpoints:
  - Mantengono una lista (in memoria) dei client connessi per board.
  - Espongono /api/stream/boards/[boardId] con una Response "text/event-stream".
  - Offrono funzioni per:
    - registrare/disconnettere client
    - broadcast di eventi ai client di un certo board
  - Ricevono eventi dal service layer (es. `BoardEventBus.emit(boardId, event)`)

Layer 5 - UI layer (Next app + React components)
- Server components:
  - fetch iniziale dei dati (lista board, lista todo, ecc.) usando i service (direttamente o repository).
  - rendering SSR rapido.
- Client components:
  - gestione interazione (form, click, drag, ecc.)
  - apertura connessione SSE per board
  - aggiornamento stato in base agli eventi SSE.
- Hooks custom (client):
  - `useBoardTodos(boardId)` che gestisce:
    - stato locale dei todo
    - integrazione CRUD (fetch POST/PATCH/DELETE)
    - subscribe/unsubscribe SSE.

Questa separazione ti permette:
- testare i servizi in isolamento
- cambiare transport layer (HTTP/SSE/Websocket) senza toccare la logica core.


2.3. Autenticazione (NextAuth con Credentials)
---------------------------------------------
Implementazione:
- Provider: Credentials
- authorize(credentials):
  - legge email/password
  - trova user via userRepository (prisma)
  - compara password con bcrypt.compare()
  - se ok, ritorna user base { id, email, name: displayName }
- callbacks.jwt:
  - aggiunge `userId` al token
- callbacks.session:
  - espone `session.user.id` al client/server

Registrazione custom (route UUID)
- Endpoint POST /api/auth/register
  - body validato con Zod: { email, password, displayName, tenantName }
  - crea user + tenant + userTenant (owner)
  - opzionale: auto-login (chiamando NextAuth internamente) o redirect al login.

Best practice:
- Mai salvare password in chiaro, sempre bcrypt hash.
- Limit rate di login/registrazione (base per sicurezza) se hai tempo.


2.4. Gestione tenant e autorizzazione
-------------------------------------
Concetto chiave: ogni request per dati multi-tenant contiene un tenantSlug in URL:
- /app/[tenantSlug]/boards
- /api/[tenantSlug]/boards

Flusso tipico in un route handler API:
1. Recupera sessione (NextAuth) → userId.
2. Risolve tenant (`getTenantBySlug(tenantSlug)`).
3. Verifica membership utente→tenant (userTenantRepository).
4. In base all’azione, chiama service layer passando userId + tenantId + dati.

Questo garantisce che:
- l’utente vede e modifica solo dati del proprio tenant
- non puoi “forzare” tenantId dal client, viene sempre derivato dallo slug e dalla membership.


2.5. Realtime con SSE (Server-Sent Events) - architettura interna
-----------------------------------------------------------------
Obiettivo: rifare "solo quello che serve" al posto di Pusher, senza servizi esterni.

Componenti:

a) Registry in-memory per board → client
- Una struttura dati modulare, es.:
  - `Map<string, Set<ClientConnection>>`
  - ClientConnection contiene:
    - id connessione
    - `write` (funzione per scrivere sullo stream)
    - `close` (cleanup)
- File: `lib/sse/boardStreamRegistry.ts`

b) Tipi di eventi
- Definire un tipo TypeScript per gli eventi:
  - es. `BoardEvent = { type: 'TODO_CREATED' | 'TODO_UPDATED' | 'TODO_DELETED', payload: ... }`
- File: `lib/sse/events.ts`

c) API SSE
- Route: `src/app/api/stream/boards/[boardId]/route.ts`
- Responsabilità:
  - accettare solo utenti autenticati e membri del tenant del board
  - settare headers SSE:
    - Content-Type: text/event-stream
    - Cache-Control: no-cache
    - Connection: keep-alive
  - registrare il client nel registry
  - gestire cleanup su chiusura connessione.
- Per inviare un evento SSE:
  - formato: `event: message
data: <JSON stringify>

`

d) Integrazione con service layer
- Service per todo (todoService) dopo una create/update/delete:
  - costruisce il `BoardEvent`
  - chiama `BoardEventBus.broadcast(boardId, event)`
- `BoardEventBus.broadcast` usa il registry per scrivere l’evento a tutti i client connessi al board.

Limitazioni accettabili per l’assignment:
- Stato SSE in-memory → se il server si riavvia, si perdono le connessioni (accettabile in dev/prototipo).
- Per l’uso reale in produzione servirebbe un message broker (Redis/pub-sub) ma qui NON lo usiamo per semplicità.


2.6. Validazione e tipi forti (Zod + DTO)
-----------------------------------------
Per ogni endpoint importante, definire:
- Schema Zod per input (es. `CreateTodoSchema`)
- Tipo TypeScript derivato (`type CreateTodoInput = z.infer<typeof CreateTodoSchema>`)

Esempi di DTO logici (nei file in /types/dto):
- Auth DTO:
  - LoginRequest
  - RegisterRequest
  - AuthResponse (user + tenants list)
- Board DTO:
  - BoardSummary
  - BoardDetails
- Todo DTO:
  - TodoItem (come viene mandato al client)
  - CreateTodoInput
  - UpdateTodoInput

Route handlers:
- parse Request JSON
- `CreateTodoSchema.parse(body)`
- passano `CreateTodoInput` al service layer.

Questo elimina `any` e riduce al minimo bug di forma.


2.7. Error handling e best practice server
------------------------------------------
- Creare un piccolo helper per le API:
  - funzioni `ok(data)`, `badRequest(msg)`, `unauthorized()`, `forbidden()`, `notFound()`, ecc.
- Service layer lancia errori custom (es. `new ForbiddenError('...')`)
- Route handlers catturano e trasformano in status code HTTP corretti:
  - 400 per validazione input
  - 401 se non autenticato
  - 403 se l’utente non appartiene al tenant
  - 404 se board/todo non esistono o non appartengono al tenant
  - 500 per imprevisti

====================================================================
3. FRONTEND CON NEXT.JS (APP ROUTER + TYPESCRIPT)
====================================================================

3.1. Struttura app (routing)
----------------------------
src/app/
  (auth)/
    login/page.tsx
    register/page.tsx
  (app)/
    app/layout.tsx                     // layout protetto con session
    app/page.tsx                       // redirect al tenant/board di default
    app/[tenantSlug]/
      layout.tsx                       // layout per tenant (sidebar, ecc.)
      boards/page.tsx                  // lista boards per tenant
      boards/[boardId]/page.tsx        // pagina board (todos + realtime)

Note:
- I layout sono server components e leggono la sessione lato server.
- Se l’utente non è loggato → redirect /login.


3.2. Gestione auth nel frontend
-------------------------------
- NextAuth fornisce hook useSession nel client.
- flusso tipico:
  - pagine (auth) usano form client component per login/register.
  - submit chiama endpoint /api/auth/login (NextAuth) o /api/auth/register.
- In layout protetto:
  - funzione server `getServerSession` per verificare la sessione.
  - se non c’è session → redirect /login.

Non serve uno store custom complesso: NextAuth gestisce sessione e access token.


3.3. Pagina lista board
-----------------------
- Route: /app/[tenantSlug]/boards
- Server component:
  - legge sessione & tenant
  - chiama boardService / repository per avere la lista boards
  - renderizza lista con `BoardCard`s
- Client component per:
  - bottone "Crea board":
    - apre form
    - chiama POST /api/[tenantSlug]/boards
    - fa refresh delle board (either `router.refresh()` o ottimistic update)


3.4. Pagina board (core della collaborazione)
---------------------------------------------
- Route: /app/[tenantSlug]/boards/[boardId]
- Server component:
  - recupera board + lista todo iniziale dal DB (tenant-check incluso)
  - passa i dati iniziali a un client component `BoardClient`

BoardClient (client component):
- Stato:
  - `todos` (array di TodoItem)
- Effetti:
  1. Inizializzazione stato con dati server (prop)
  2. `useEffect` per aprire connessione SSE:
     - `const eventSource = new EventSource('/api/stream/boards/[boardId]')`
     - `eventSource.onmessage = (event) => { parse JSON; switch su type; aggiorna state }`
     - cleanup: `eventSource.close()`
- Azioni utente (mutazioni):
  - crea todo:
    - chiamata POST /api/[tenantSlug]/boards/[boardId]/todos
    - UI ottimistica (aggiunge subito) oppure aspetta SSE di ritorno
  - aggiorna todo (status, title, descrizione):
    - PATCH /api/.../todos/[todoId]
  - elimina todo:
    - DELETE /api/.../todos/[todoId]

UI:
- 3 colonne (TODO, IN_PROGRESS, DONE)
- ogni colonna filtra `todos` per status
- ogni TodoItem con pulsanti per edit/delete e select per lo status (o drag&drop se hai tempo).


3.5. Hooks e tipi client
------------------------
Hooks utili:
- `useBoardTodos(boardId, initialTodos)`:
  - gestisce stato + subscribe SSE + update su eventi.
- `useCreateTodo`, `useUpdateTodo`, `useDeleteTodo`:
  - incapsulano le chiamate API e ritornano funzioni tipizzate con i rispettivi DTO.

Tipi:
- usare i tipi generati da Prisma per base (`Prisma.TodoGetPayload`) + definire DTO puliti:
  - `TodoItemDTO` = tipo con solo le info che servono al client.
- evitare `any`, preferire generics tipizzati per fetch helper.


3.6. UI e UX best practice
--------------------------
- Layout chiaro:
  - header con switch tenant (drop-down dei tenant dell’utente).
  - sidebar con lista board, area principale con board attivo.
- Loading states:
  - skeleton o spinner quando carichi board/todos.
- Error states:
  - messaggi chiari (es. "Non hai accesso a questo tenant", "Board non trovato", ecc.).
- Responsivo ma senza esagerare, la priorità è funzionalità e code quality.



