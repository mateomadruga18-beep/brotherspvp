import net from "node:net";
import { env } from "../env";

type PendingRequest = {
  resolve: (value: string) => void;
  reject: (reason?: unknown) => void;
  timeout: NodeJS.Timeout;
};

const RCON_AUTH = 3;
const RCON_COMMAND = 2;

class PersistentRconClient {
  private socket: net.Socket | null = null;
  private connected = false;
  private authenticating = false;
  private buffer = Buffer.alloc(0);
  private requestId = 1;
  private pending = new Map<number, PendingRequest>();
  private connectPromise: Promise<void> | null = null;

  private nextRequestId() {
    this.requestId += 1;
    return this.requestId;
  }

  private buildPacket(requestId: number, type: number, body: string) {
    const payload = Buffer.from(body, "utf8");
    const size = 4 + 4 + payload.length + 2;
    const packet = Buffer.alloc(4 + size);
    packet.writeInt32LE(size, 0);
    packet.writeInt32LE(requestId, 4);
    packet.writeInt32LE(type, 8);
    payload.copy(packet, 12);
    packet.writeInt16LE(0, 12 + payload.length);
    return packet;
  }

  private flushBuffer() {
    while (this.buffer.length >= 4) {
      const size = this.buffer.readInt32LE(0);
      if (this.buffer.length < size + 4) return;

      const packet = this.buffer.subarray(4, 4 + size);
      this.buffer = this.buffer.subarray(4 + size);

      const requestId = packet.readInt32LE(0);
      const body = packet.subarray(8, packet.length - 2).toString("utf8");
      const pending = this.pending.get(requestId);
      if (!pending) continue;

      clearTimeout(pending.timeout);
      this.pending.delete(requestId);
      pending.resolve(body);
    }
  }

  private teardown(reason: string) {
    this.connected = false;
    this.authenticating = false;
    this.connectPromise = null;
    if (this.socket) {
      try {
        this.socket.destroy();
      } catch {
        // no-op
      }
    }
    this.socket = null;

    for (const [id, req] of this.pending.entries()) {
      clearTimeout(req.timeout);
      req.reject(new Error(`RCON connection closed: ${reason} (request ${id})`));
    }
    this.pending.clear();
  }

  private async connect() {
    if (this.connected) return;
    if (this.connectPromise) return this.connectPromise;

    this.connectPromise = new Promise<void>((resolve, reject) => {
      const host = env.RCON_HOST;
      const port = Number(env.RCON_PORT ?? "");
      const password = env.RCON_PASSWORD ?? "";

      if (!host || !Number.isFinite(port) || !password) {
        reject(new Error("RCON not configured. Check RCON_HOST, RCON_PORT, RCON_PASSWORD."));
        return;
      }

      const socket = net.createConnection({ host, port });
      this.socket = socket;
      this.buffer = Buffer.alloc(0);

      socket.on("data", (chunk) => {
        this.buffer = Buffer.concat([this.buffer, chunk]);
        this.flushBuffer();
      });
      socket.on("error", (err) => {
        console.error("[rcon]", { message: "Socket error", error: err.message });
        this.teardown(err.message);
      });
      socket.on("close", () => {
        this.teardown("closed");
      });

      socket.once("connect", async () => {
        try {
          this.authenticating = true;
          const authId = this.nextRequestId();
          const authPacket = this.buildPacket(authId, RCON_AUTH, password);
          const authPromise = new Promise<string>((res, rej) => {
            const timeout = setTimeout(() => {
              this.pending.delete(authId);
              rej(new Error("RCON auth timeout"));
            }, 5000);
            this.pending.set(authId, { resolve: res, reject: rej, timeout });
          });
          socket.write(authPacket);
          await authPromise;
          this.connected = true;
          this.authenticating = false;
          console.info("[rcon]", { message: "Connected and authenticated", host, port });
          resolve();
        } catch (error) {
          this.authenticating = false;
          this.teardown(error instanceof Error ? error.message : "auth_failed");
          reject(error);
        }
      });
    });

    try {
      await this.connectPromise;
    } finally {
      this.connectPromise = null;
    }
  }

  async sendCommand(command: string) {
    if (!command.trim()) throw new Error("RCON command is empty.");
    if (/[\r\n\0]/.test(command)) {
      throw new Error("RCON command contains invalid control characters.");
    }
    if (!this.connected && !this.authenticating) {
      await this.connect();
    }
    if (!this.socket || !this.connected) {
      throw new Error("RCON is not connected.");
    }

    const requestId = this.nextRequestId();
    const responsePromise = new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(requestId);
        reject(new Error("RCON command timeout"));
      }, 7000);
      this.pending.set(requestId, { resolve, reject, timeout });
    });

    this.socket.write(this.buildPacket(requestId, RCON_COMMAND, command));
    return responsePromise;
  }
}

const client = new PersistentRconClient();

export async function sendRconCommand(command: string) {
  return client.sendCommand(command);
}
