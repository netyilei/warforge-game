type WebSocketMessageHandler = (message: unknown) => void;
type WebSocketStatusHandler = (status: 'connected' | 'disconnected' | 'error') => void;

interface NakamaWebSocketOptions {
  host?: string;
  port?: number;
  token: string;
  onMessage?: WebSocketMessageHandler;
  onStatus?: WebSocketStatusHandler;
}

interface MatchMessage {
  match_id: string;
  op_code: number;
  data: string;
  presences?: unknown[];
}

export class NakamaWebSocket {
  private socket: WebSocket | null = null;
  private options: NakamaWebSocketOptions;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  constructor(options: NakamaWebSocketOptions) {
    this.options = {
      host: options.host || import.meta.env.VITE_NAKAMA_WS_HOST || 'localhost',
      port: options.port || import.meta.env.VITE_NAKAMA_WS_PORT || 8205,
      ...options
    };
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const url = `${protocol}://${this.options.host}:${this.options.port}/ws?token=${this.options.token}`;

      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        console.log('[Nakama WS] Connected');
        this.reconnectAttempts = 0;
        this.startPing();
        this.options.onStatus?.('connected');
        resolve();
      };

      this.socket.onmessage = event => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
          this.options.onMessage?.(message);
        } catch (error) {
          console.error('[Nakama WS] Parse error:', error);
        }
      };

      this.socket.onclose = event => {
        console.log('[Nakama WS] Disconnected:', event.code, event.reason);
        this.stopPing();
        this.options.onStatus?.('disconnected');
        this.attemptReconnect();
      };

      this.socket.onerror = error => {
        console.error('[Nakama WS] Error:', error);
        this.options.onStatus?.('error');
        reject(error);
      };
    });
  }

  private handleMessage(message: { cid?: string; [key: string]: unknown }): void {
    if (message.cid) {
      console.log('[Nakama WS] Response:', message.cid);
    }
  }

  private startPing(): void {
    this.pingInterval = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.send({ ping: {} });
      }
    }, 15000);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[Nakama WS] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;

    console.log(`[Nakama WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect().catch(console.error);
    }, delay);
  }

  send(message: Record<string, unknown>): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  createMatch(): void {
    this.send({ match_create: {} });
  }

  joinMatch(matchId: string, metadata?: Record<string, unknown>): void {
    this.send({
      match_join: {
        match_id: matchId,
        metadata: metadata || {}
      }
    });
  }

  leaveMatch(matchId: string): void {
    this.send({
      match_leave: {
        match_id: matchId
      }
    });
  }

  sendMatchData(matchId: string, opCode: number, data: Record<string, unknown>): void {
    this.send({
      match_data_send: {
        match_id: matchId,
        op_code: opCode,
        data: btoa(JSON.stringify(data)),
        presences: []
      }
    });
  }

  createParty(open: boolean, maxSize: number): void {
    this.send({
      party_create: {
        open,
        max_size: maxSize
      }
    });
  }

  joinParty(partyId: string): void {
    this.send({
      party_join: {
        party_id: partyId
      }
    });
  }

  leaveParty(partyId: string): void {
    this.send({
      party_leave: {
        party_id: partyId
      }
    });
  }

  sendPartyData(partyId: string, opCode: number, data: Record<string, unknown>): void {
    this.send({
      party_data_send: {
        party_id: partyId,
        op_code: opCode,
        data: btoa(JSON.stringify(data))
      }
    });
  }

  followUsers(userIds: string[]): void {
    this.send({
      status_follow: {
        user_ids: userIds
      }
    });
  }

  updateStatus(status: string): void {
    this.send({
      status_update: {
        status
      }
    });
  }

  disconnect(): void {
    this.stopPing();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  get isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

export type { NakamaWebSocketOptions, MatchMessage };
