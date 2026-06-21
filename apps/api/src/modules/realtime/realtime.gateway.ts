import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import type { JobUpdatedEvent } from "@music/contracts";

/**
 * Socket.IO gateway for realtime job progress (plan §1.8).
 *
 * Rooms: `user:{userId}` — each authenticated user subscribes to their own room.
 * Events: `job.updated` (JobUpdatedEvent) pushed by the generation service.
 *
 * Polling fallback: `GET /generation/jobs/:id` guarantees eventual consistency.
 */
@WebSocketGateway({
  namespace: "realtime",
  cors: { origin: true, credentials: true },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket): void {
    const userId = client.handshake.auth?.userId as string | undefined;
    if (userId) {
      void client.join(`user:${userId}`);
    }
  }

  handleDisconnect(client: Socket): void {
    const userId = client.handshake.auth?.userId as string | undefined;
    if (userId) {
      void client.leave(`user:${userId}`);
    }
  }

  /**
   * Push a job update to the user's room.
   * Called by generation service / worker when job status changes.
   */
  emitJobUpdate(userId: string, event: JobUpdatedEvent): void {
    this.server.to(`user:${userId}`).emit("job.updated", event);
  }

  /** Client can also subscribe manually. */
  @SubscribeMessage("subscribe")
  handleSubscribe(client: Socket, payload: { userId: string }): void {
    void client.join(`user:${payload.userId}`);
  }
}
