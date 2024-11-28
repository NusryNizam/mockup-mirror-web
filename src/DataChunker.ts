import { DataConnection } from "peerjs";

interface ChunkData {
  chunkIndex: number;
  totalChunks: number;
  data: any; // Replace 'any' with your specific data type
  id: string; // To identify chunks from same message
}

export class DataChunker {
  private static readonly CHUNK_SIZE = 16000;
  private receivedChunks: Map<string, any[]> = new Map();

  constructor(private connection: DataConnection) {
    this.setupReceiver();
  }

  public sendData(data: any): void {
    const jsonString = JSON.stringify(data);
    const chunks = this.createChunks(jsonString);
    const messageId = this.generateMessageId();

    chunks.forEach((chunk, index) => {
      const chunkData: ChunkData = {
        chunkIndex: index,
        totalChunks: chunks.length,
        data: chunk,
        id: messageId,
      };
      this.connection.send(chunkData);
    });
  }

  private setupReceiver(): void {
    this.connection.on("data", (receivedChunk: unknown) => {
      this.processChunk(receivedChunk as ChunkData);
    });
  }

  private processChunk(chunk: ChunkData): void {
    if (!this.receivedChunks.has(chunk.id)) {
      this.receivedChunks.set(chunk.id, new Array(chunk.totalChunks));
    }

    const chunks = this.receivedChunks.get(chunk.id)!;
    chunks[chunk.chunkIndex] = chunk.data;

    if (this.isMessageComplete(chunk.id)) {
      const completeData = this.reconstructMessage(chunk.id);
      this.handleCompleteMessage(completeData);
      this.receivedChunks.delete(chunk.id);
    }
  }

  private createChunks(jsonString: string): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < jsonString.length; i += DataChunker.CHUNK_SIZE) {
      chunks.push(jsonString.slice(i, i + DataChunker.CHUNK_SIZE));
    }
    return chunks;
  }

  private isMessageComplete(messageId: string): boolean {
    const chunks = this.receivedChunks.get(messageId);
    return chunks?.every((chunk) => chunk !== undefined) ?? false;
  }

  private reconstructMessage(messageId: string): any {
    const chunks = this.receivedChunks.get(messageId)!;
    const completeJson = chunks.join("");
    return JSON.parse(completeJson);
  }

  private generateMessageId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private handleCompleteMessage(data: any): void {
    // Handle your reconstructed data here
    console.log("Received complete message:", data);
    // Emit event or call callback with complete data
  }
}
