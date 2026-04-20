export interface WebSocketMessage {
  type: string;
  data: any;
  from_id?: string;
  to_id?: string;
  timestamp: string; // Make sure this is string, not optional
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(tags: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws";
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("WebSocket connected");
        this.reconnectAttempts = 0;
        
        // Send initial find_match message with tags
        this.send({
          type: "find_match",
          data: { tags },
          timestamp: new Date().toISOString(),
        });
        
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error("Failed to parse message:", error);
        }
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        reject(error);
      };

      this.ws.onclose = () => {
        console.log("WebSocket disconnected");
        this.attemptReconnect(tags);
      };
    });
  }

  private attemptReconnect(tags: string[]) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect(tags);
      }, 2000 * this.reconnectAttempts);
    }
  }

  private handleMessage(message: WebSocketMessage) {
    const callbacks = this.listeners.get(message.type);
    if (callbacks) {
      callbacks.forEach(callback => callback(message.data, message));
    }
  }

  send(message: Omit<WebSocketMessage, 'timestamp'> & { timestamp?: string }) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const fullMessage: WebSocketMessage = {
        ...message,
        timestamp: message.timestamp || new Date().toISOString(),
      };
      this.ws.send(JSON.stringify(fullMessage));
    } else {
      console.warn("WebSocket is not connected");
    }
  }

  on(type: string, callback: Function) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(callback);
  }

  off(type: string, callback: Function) {
    const callbacks = this.listeners.get(type);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) callbacks.splice(index, 1);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }
}

export const wsService = new WebSocketService();