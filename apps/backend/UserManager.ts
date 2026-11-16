import { User, type Socket } from "./User";
import type { Activity, ServerMessage } from "common";
import { PermissionBroker } from "./permission-broker";

export class UserManager {
  private readonly users = new Map<string, User>();
  private readonly running = new Map<string, { controller: AbortController; text: string; activity: Activity[] }>();

  private broadcast = (message: ServerMessage) => {
    const encoded = JSON.stringify(message);
    for (const user of this.users.values()) user.deliver(encoded);
  };
  private readonly permissions = new PermissionBroker(this.broadcast);

  async open(socket: Socket): Promise<void> {
    const user = new User(socket, this.running, this.broadcast, this.permissions);
    this.users.set(socket.data.id, user);
    await user.initialize();
  }

  async message(socket: Socket, message: string): Promise<void> {
    const user = this.users.get(socket.data.id);
    if (user) {
      await user.handleIncomingMessage(message);
    }
  }

  close(socket: Socket): void {
    this.users.delete(socket.data.id);
  }
}
