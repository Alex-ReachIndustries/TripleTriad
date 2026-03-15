/**
 * WebSocket transport for lobby communication.
 */

import type { ITransport, ClientMessage, ServerMessage } from '../types/multiplayer'

export class WebSocketTransport implements ITransport {
  private ws: WebSocket | null = null
  private messageHandler: ((msg: ServerMessage) => void) | null = null
  private disconnectHandler: (() => void) | null = null

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  get type(): 'websocket' {
    return 'websocket'
  }

  async connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(url)

      this.ws.onopen = () => resolve()

      this.ws.onerror = () => {
        reject(new Error('WebSocket connection failed'))
      }

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as ServerMessage
          this.messageHandler?.(msg)
        } catch { /* ignore malformed messages */ }
      }

      this.ws.onclose = () => {
        this.disconnectHandler?.()
      }
    })
  }

  disconnect(): void {
    this.ws?.close()
    this.ws = null
  }

  send(msg: ClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg))
    }
  }

  onMessage(handler: (msg: ServerMessage) => void): void {
    this.messageHandler = handler
  }

  onDisconnect(handler: () => void): void {
    this.disconnectHandler = handler
  }
}
