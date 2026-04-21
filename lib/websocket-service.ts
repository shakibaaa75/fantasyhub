export interface WebSocketMessage {
  type: string;
  data: any;
  from_id?: string;
  to_id?: string;
  timestamp: string;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private currentTags: string[] = [];
  private currentMode: 'chat' | 'video' = 'chat';

  connect(tags: string[], mode: 'chat' | 'video' = 'chat'): Promise<void> {
    this.currentTags = tags;
    this.currentMode = mode;

    return new Promise((resolve, reject) => {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws";
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("WebSocket connected");
        this.reconnectAttempts = 0;
        
        // Send initial find_match message with tags and mode
        this.send({
          type: "find_match",
          data: { tags, mode },
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
        this.attemptReconnect();
      };
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect(this.currentTags, this.currentMode);
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

  // WebRTC signaling helpers
  sendOffer(offer: RTCSessionDescriptionInit) {
    this.send({ type: 'offer', data: offer });
  }

  sendAnswer(answer: RTCSessionDescriptionInit) {
    this.send({ type: 'answer', data: answer });
  }

  sendIceCandidate(candidate: RTCIceCandidateInit) {
    this.send({ type: 'ice_candidate', data: candidate });
  }

  sendVideoReady() {
    this.send({ type: 'video_ready', data: {} });
  }

  sendVideoToggle(enabled: boolean) {
    this.send({ type: 'video_toggle', data: { enabled } });
  }

  sendAudioToggle(enabled: boolean) {
    this.send({ type: 'audio_toggle', data: { enabled } });
  }

  sendEndCall() {
    this.send({ type: 'end_call', data: {} });
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
    this.currentTags = [];
  }
}

export const wsService = new WebSocketService();