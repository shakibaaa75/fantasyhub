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
  private reconnectDelayMs = 2000;
  private currentTags: string[] = [];
  private currentMode: 'chat' | 'video' = 'chat';
  private isIntentionallyClosed = false;

  connect(tags: string[], mode: 'chat' | 'video' = 'chat'): Promise<void> {
    this.currentTags = tags;
    this.currentMode = mode;
    this.isIntentionallyClosed = false;

    return new Promise((resolve, reject) => {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws";
      console.log(`[WS] Connecting to ${wsUrl}`);
      
      try {
        this.ws = new WebSocket(wsUrl);
      } catch (err) {
        console.error('[WS] Failed to create WebSocket:', err);
        reject(new Error('Failed to create WebSocket connection'));
        return;
      }

      const connectionTimeout = setTimeout(() => {
        if (this.ws?.readyState !== WebSocket.OPEN) {
          console.error('[WS] Connection timeout');
          this.ws?.close();
          reject(new Error('WebSocket connection timeout'));
        }
      }, 10000);

      this.ws.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log('[WS] Connected successfully');
        this.reconnectAttempts = 0;
        
        console.log(`[WS] Sending find_match with tags: ${tags.join(', ')}, mode: ${mode}`);
        this.send({
          type: "find_match",
          data: { tags, mode },
        });
        
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log(`[WS] Received: ${message.type}`, message.data);
          this.handleMessage(message);
        } catch (error) {
          console.error("[WS] Failed to parse message:", error, event.data);
        }
      };

      this.ws.onerror = (error) => {
        clearTimeout(connectionTimeout);
        console.error("[WS] Error:", error);
        if (this.reconnectAttempts === 0) {
          reject(error);
        }
      };

      this.ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        console.log(`[WS] Closed (code: ${event.code}, clean: ${event.wasClean})`);
        
        if (!this.isIntentionallyClosed) {
          this.attemptReconnect();
        }
      };
    });
  }

  private attemptReconnect() {
    if (this.isIntentionallyClosed) return;
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelayMs * this.reconnectAttempts;
      
      console.log(`[WS] Reconnecting in ${delay}ms (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        if (!this.isIntentionallyClosed) {
          this.connect(this.currentTags, this.currentMode).catch((err) => {
            console.error('[WS] Reconnect failed:', err);
          });
        }
      }, delay);
    } else {
      console.error("[WS] Max reconnection attempts reached");
      this.notifyListeners('error', { message: 'Connection lost. Please refresh.' });
    }
  }

  private handleMessage(message: WebSocketMessage) {
    const callbacks = this.listeners.get(message.type);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(message.data, message);
        } catch (err) {
          console.error(`[WS] Listener error for ${message.type}:`, err);
        }
      });
    } else {
      console.log(`[WS] No listeners for message type: ${message.type}`);
    }
  }

  private notifyListeners(type: string, data: any) {
    const callbacks = this.listeners.get(type);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (err) {
          console.error(`[WS] Notify error for ${type}:`, err);
        }
      });
    }
  }

  send(message: { type: string; data?: any; from_id?: string; to_id?: string; timestamp?: string }) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const fullMessage: WebSocketMessage = {
        type: message.type,
        data: message.data ?? {},
        from_id: message.from_id,
        to_id: message.to_id,
        timestamp: message.timestamp || new Date().toISOString(),
      };
      console.log(`[WS] Sending: ${message.type}`, message.data);
      this.ws.send(JSON.stringify(fullMessage));
    } else {
      console.warn(`[WS] Cannot send ${message.type} - not connected (state: ${this.ws?.readyState})`);
    }
  }

  // Video call helpers with logging
  sendOffer(offer: RTCSessionDescriptionInit) {
    console.log('[WS] Sending offer');
    this.send({ type: 'offer', data: offer });
  }

  sendAnswer(answer: RTCSessionDescriptionInit) {
    console.log('[WS] Sending answer');
    this.send({ type: 'answer', data: answer });
  }

  sendIceCandidate(candidate: RTCIceCandidateInit) {
    console.log('[WS] Sending ICE candidate');
    this.send({ type: 'ice_candidate', data: candidate });
  }

  sendVideoReady() {
    console.log('[WS] Sending video_ready');
    this.send({ type: 'video_ready', data: {} });
  }

  sendVideoToggle(enabled: boolean) {
    console.log(`[WS] Sending video_toggle: ${enabled}`);
    this.send({ type: 'video_toggle', data: { enabled } });
  }

  sendAudioToggle(enabled: boolean) {
    console.log(`[WS] Sending audio_toggle: ${enabled}`);
    this.send({ type: 'audio_toggle', data: { enabled } });
  }

  sendEndCall() {
    console.log('[WS] Sending end_call');
    this.send({ type: 'end_call', data: {} });
  }

  sendChatMessage(content: string, toId?: string) {
    this.send({ type: 'chat_message', data: { content }, to_id: toId });
  }

  sendTyping(isTyping: boolean) {
    this.send({ type: 'typing', data: { is_typing: isTyping } });
  }

  sendSkip() {
    console.log('[WS] Sending skip');
    this.send({ type: 'skip', data: {} });
  }

  sendReport(reason: string) {
    console.log(`[WS] Sending report: ${reason}`);
    this.send({ type: 'report', data: { reason } });
  }

  sendReSearch(tags: string[], mode: 'chat' | 'video' = 'chat') {
    console.log(`[WS] Sending re-search with tags: ${tags.join(', ')}, mode: ${mode}`);
    this.currentTags = tags;
    this.currentMode = mode;
    this.send({ type: 'find_match', data: { tags, mode } });
  }

  on(type: string, callback: Function) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(callback);
    console.log(`[WS] Added listener for: ${type} (total: ${this.listeners.get(type)!.length})`);
  }

  off(type: string, callback: Function) {
    const callbacks = this.listeners.get(type);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
        console.log(`[WS] Removed listener for: ${type} (remaining: ${callbacks.length})`);
      }
    }
  }

  once(type: string, callback: Function) {
    const onceWrapper = (data: any, msg: WebSocketMessage) => {
      this.off(type, onceWrapper);
      callback(data, msg);
    };
    this.on(type, onceWrapper);
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  disconnect() {
    console.log('[WS] Disconnecting (intentional)');
    this.isIntentionallyClosed = true;
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.reconnectAttempts = 0;
  }

  destroy() {
    this.disconnect();
    this.listeners.clear();
    this.currentTags = [];
  }
}

export const wsService = new WebSocketService();