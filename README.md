# Multi-Tenant Kanban Board - Real-Time Collaboration

Un'applicazione Kanban multi-tenant completa con aggiornamenti real-time tramite Server-Sent Events (SSE).

## 🎯 Funzionalità Principali

### ✅ Multi-Tenancy Completo
- **Isolamento dati per organizzazione**: ogni tenant (organizzazione) ha i propri dati completamente isolati
- **Gestione ruoli**: Owner, Admin, Member con permessi differenziati
- **Owner privileges**: il creatore della prima organizzazione diventa automaticamente owner

### ✅ Autenticazione Sicura
- NextAuth con provider Credentials (email/password)
- Password hashate con bcrypt
- Sessioni JWT sicure
- Registrazione con creazione automatica tenant

### ✅ Board Management con Permessi
- **Creazione board**: tutti i membri possono creare board
- **Modifica board**: solo il creatore o gli owner possono modificare
- **Eliminazione board**: solo il creatore o gli owner possono eliminare
- **Real-time updates**: modifiche ed eliminazioni si riflettono istantaneamente su tutti i client connessi

### ✅ Kanban Board Real-Time
- 3 colonne: TODO, IN_PROGRESS, DONE
- **CRUD completo todo**:
  - Creazione task in tempo reale
  - Modifica titolo, descrizione, status
  - Eliminazione task
  - Cambio status visuale
- **Real-time collaboration**: tutti gli utenti vedono istantaneamente le modifiche degli altri

### ✅ SSE (Server-Sent Events) Implementato
- Sistema SSE personalizzato senza dipendenze esterne
- Eventi supportati:
  - `TODO_CREATED`: nuovo task creato
  - `TODO_UPDATED`: task modificato
  - `TODO_DELETED`: task eliminato
  - `TODO_STATUS_CHANGED`: status task cambiato
  - `BOARD_UPDATED`: board modificata
  - `BOARD_DELETED`: board eliminata
- Riconnessione automatica in caso di disconnessione
- Keep-alive ping ogni 30 secondi

## 🏗️ Architettura

### Layer Separati (Clean Architecture)
1. **Domain Layer**: modelli e logica pura
2. **Repository Layer**: accesso dati
3. **Service Layer**: business logic
4. **Transport Layer**: API HTTP + SSE endpoints
5. **UI Layer**: React components

### Stack Tecnico
- **Runtime**: Node.js 20+
- **Framework**: Next.js 14 (App Router) + TypeScript
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Auth**: NextAuth (Auth.js)
- **Real-time**: SSE (implementazione custom)
- **Validazione**: Zod
- **UI**: React + Tailwind CSS

## 🚀 Setup e Avvio

### 1. Prerequisiti
- Node.js 20+
- Database PostgreSQL su Supabase (già configurato)

### 2. Installazione
```bash
npm install
```

### 3. Configurazione Database
```bash
# Genera Prisma Client
npm run db:generate
```

### 4. Avvio Applicazione
```bash
# Sviluppo
npm run dev

# Build production
npm run build
npm start
```

L'app sarà disponibile su `http://localhost:3000`

## 📖 Come Usare

### Registrazione
1. Vai su `/register`
2. Inserisci: email, password, nome, nome organizzazione
3. Diventi automaticamente **owner** della tua organizzazione

### Gestione Board
- Crea board dalla dashboard
- Modifica/elimina (solo se sei creatore o owner)

### Task Real-Time
- Crea task in qualsiasi colonna
- Modifica status, titolo, descrizione
- **Apri in 2 browser per vedere gli aggiornamenti real-time!**

## 🔐 Sicurezza
- ✅ Password hashate con bcrypt
- ✅ Row-level security (filtraggio per tenantId)
- ✅ Controllo permessi granulare
- ✅ Validazione Zod su tutti gli input

## 🎨 Features Completate
✅ Multi-tenant completo
✅ Autenticazione NextAuth
✅ CRUD board con permessi
✅ CRUD todo real-time
✅ SSE per collaboration
✅ Kanban 3 colonne
✅ Permissions system
✅ TypeScript strict
✅ Clean Architecture.