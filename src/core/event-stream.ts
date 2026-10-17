import type { Response } from "express";

/**
 * A Server-Sent Events response: named events with JSON data, written as they happen.
 * Writes after the client has gone away are dropped.
 */
export class EventStream {
  constructor(private readonly res: Response) {
    res.status(200).set({
      "Content-Type": "text/event-stream; charset=utf-8",
      // no-transform: proxies must not compress (and so buffer) the stream.
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.flushHeaders();
  }

  send(event: string, data: unknown): void {
    if (this.res.writableEnded || this.res.destroyed) return;
    this.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }

  end(): void {
    if (!this.res.writableEnded) this.res.end();
  }
}
