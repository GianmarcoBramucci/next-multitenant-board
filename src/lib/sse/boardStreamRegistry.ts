// Board Stream Registry - Manages SSE connections for board real-time updates

import { BoardEvent, formatSSEMessage } from './events';

/**
 * Represents a client connection for SSE
 */
export interface ClientConnection {
  id: string;
  userId: string;
  controller: ReadableStreamDefaultController;
  boardId: string;
  connectedAt: Date;
}

/**
 * Registry to manage board SSE connections
 * Maps boardId -> Set of client connections
 * Also manages tenant-level connections for board list updates
 */
class BoardStreamRegistry {
  private connections: Map<string, Set<ClientConnection>>;
  private tenantConnections: Map<string, Set<ClientConnection>>;

  constructor() {
    this.connections = new Map();
    this.tenantConnections = new Map();
  }

  /**
   * Register a new client connection for a board
   */
  register(
    boardId: string,
    userId: string,
    controller: ReadableStreamDefaultController
  ): ClientConnection {
    const connectionId = `${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const connection: ClientConnection = {
      id: connectionId,
      userId,
      controller,
      boardId,
      connectedAt: new Date(),
    };

    if (!this.connections.has(boardId)) {
      this.connections.set(boardId, new Set());
    }

    this.connections.get(boardId)!.add(connection);

    console.log(
      `[SSE] Client ${connectionId} connected to board ${boardId}. Total connections: ${this.connections.get(boardId)!.size}`
    );

    return connection;
  }

  /**
   * Unregister a client connection
   */
  unregister(connectionId: string): void {
    for (const [boardId, clients] of this.connections.entries()) {
      for (const client of clients) {
        if (client.id === connectionId) {
          clients.delete(client);
          console.log(
            `[SSE] Client ${connectionId} disconnected from board ${boardId}. Remaining connections: ${clients.size}`
          );

          // Clean up empty board entries
          if (clients.size === 0) {
            this.connections.delete(boardId);
            console.log(`[SSE] Removed board ${boardId} from registry (no active connections)`);
          }

          return;
        }
      }
    }
  }

  /**
   * Broadcast an event to all clients connected to a board
   * Optionally exclude a specific user (the one who triggered the event)
   */
  broadcast(boardId: string, event: BoardEvent, excludeUserId?: string): void {
    const clients = this.connections.get(boardId);

    if (!clients || clients.size === 0) {
      console.log(`[SSE] No clients connected to board ${boardId}, skipping broadcast`);
      return;
    }

    const message = formatSSEMessage(event);
    let sentCount = 0;
    let failedCount = 0;

    for (const client of clients) {
      // Skip the user who triggered the event if specified
      if (excludeUserId && client.userId === excludeUserId) {
        continue;
      }

      try {
        const encoder = new TextEncoder();
        client.controller.enqueue(encoder.encode(message));
        sentCount++;
      } catch (error) {
        console.error(`[SSE] Failed to send to client ${client.id}:`, error);
        failedCount++;
        // Remove failed connection
        this.unregister(client.id);
      }
    }

    console.log(
      `[SSE] Broadcasted ${event.type} to board ${boardId}: ${sentCount} sent, ${failedCount} failed`
    );
  }

  /**
   * Get connection count for a board
   */
  getConnectionCount(boardId: string): number {
    return this.connections.get(boardId)?.size ?? 0;
  }

  /**
   * Get all connected board IDs
   */
  getActiveBoardIds(): string[] {
    return Array.from(this.connections.keys());
  }

  /**
   * Get total connection count across all boards
   */
  getTotalConnectionCount(): number {
    let total = 0;
    for (const clients of this.connections.values()) {
      total += clients.size;
    }
    return total;
  }

  /**
   * Send a ping/keep-alive to all connections of a board
   */
  sendKeepAlive(boardId: string): void {
    const clients = this.connections.get(boardId);

    if (!clients || clients.size === 0) {
      return;
    }

    const pingMessage = ': ping\n\n';

    for (const client of clients) {
      try {
        const encoder = new TextEncoder();
        client.controller.enqueue(encoder.encode(pingMessage));
      } catch (error) {
        console.error(`[SSE] Keep-alive failed for client ${client.id}:`, error);
        this.unregister(client.id);
      }
    }
  }

  /**
   * Register a tenant-level connection (for board list updates)
   */
  registerTenant(
    tenantId: string,
    userId: string,
    controller: ReadableStreamDefaultController
  ): ClientConnection {
    const connectionId = `tenant-${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const connection: ClientConnection = {
      id: connectionId,
      userId,
      controller,
      boardId: tenantId, // Reuse boardId field for tenantId
      connectedAt: new Date(),
    };

    if (!this.tenantConnections.has(tenantId)) {
      this.tenantConnections.set(tenantId, new Set());
    }

    this.tenantConnections.get(tenantId)!.add(connection);

    console.log(
      `[SSE] Client ${connectionId} connected to tenant ${tenantId}. Total tenant connections: ${this.tenantConnections.get(tenantId)!.size}`
    );

    return connection;
  }

  /**
   * Unregister a tenant-level connection
   */
  unregisterTenant(connectionId: string): void {
    for (const [tenantId, clients] of this.tenantConnections.entries()) {
      for (const client of clients) {
        if (client.id === connectionId) {
          clients.delete(client);
          console.log(
            `[SSE] Client ${connectionId} disconnected from tenant ${tenantId}. Remaining connections: ${clients.size}`
          );

          if (clients.size === 0) {
            this.tenantConnections.delete(tenantId);
            console.log(`[SSE] Removed tenant ${tenantId} from registry (no active connections)`);
          }

          return;
        }
      }
    }
  }

  /**
   * Broadcast an event to all clients connected to a tenant
   */
  broadcastToTenant(tenantId: string, event: BoardEvent, excludeUserId?: string): void {
    const clients = this.tenantConnections.get(tenantId);

    if (!clients || clients.size === 0) {
      console.log(`[SSE] No clients connected to tenant ${tenantId}, skipping tenant broadcast`);
      return;
    }

    const message = formatSSEMessage(event);
    let sentCount = 0;
    let failedCount = 0;

    for (const client of clients) {
      if (excludeUserId && client.userId === excludeUserId) {
        continue;
      }

      try {
        const encoder = new TextEncoder();
        client.controller.enqueue(encoder.encode(message));
        sentCount++;
      } catch (error) {
        console.error(`[SSE] Failed to send to tenant client ${client.id}:`, error);
        failedCount++;
        this.unregisterTenant(client.id);
      }
    }

    console.log(
      `[SSE] Broadcasted ${event.type} to tenant ${tenantId}: ${sentCount} sent, ${failedCount} failed`
    );
  }

  /**
   * Send keep-alive to tenant connections
   */
  sendTenantKeepAlive(tenantId: string): void {
    const clients = this.tenantConnections.get(tenantId);

    if (!clients || clients.size === 0) {
      return;
    }

    const pingMessage = ': ping\n\n';

    for (const client of clients) {
      try {
        const encoder = new TextEncoder();
        client.controller.enqueue(encoder.encode(pingMessage));
      } catch (error) {
        console.error(`[SSE] Keep-alive failed for tenant client ${client.id}:`, error);
        this.unregisterTenant(client.id);
      }
    }
  }

  /**
   * Get all active tenant IDs
   */
  getActiveTenantIds(): string[] {
    return Array.from(this.tenantConnections.keys());
  }
}

// Global singleton instance that persists across hot reloads in development
const globalForRegistry = global as typeof globalThis & {
  boardStreamRegistry?: BoardStreamRegistry;
};

if (!globalForRegistry.boardStreamRegistry) {
  globalForRegistry.boardStreamRegistry = new BoardStreamRegistry();

  // Set up periodic keep-alive pings (every 15 seconds - SSE best practice)
  setInterval(() => {
    const registry = globalForRegistry.boardStreamRegistry!;

    // Keep-alive for board connections
    const activeBoardIds = registry.getActiveBoardIds();
    for (const boardId of activeBoardIds) {
      registry.sendKeepAlive(boardId);
    }

    // Keep-alive for tenant connections
    const activeTenantIds = registry.getActiveTenantIds();
    for (const tenantId of activeTenantIds) {
      registry.sendTenantKeepAlive(tenantId);
    }
  }, 15000);

  console.log('[SSE] Global registry initialized with 15s keep-alive for boards and tenants');
}

export const boardStreamRegistry = globalForRegistry.boardStreamRegistry;
