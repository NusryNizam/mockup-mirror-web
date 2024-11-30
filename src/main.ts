import "./style.css";
import { displayImagesWithImgTags } from "./util";

import Peer, { DataConnection } from "peerjs";
import QRCode from "qrcode";
import { DataChunker } from "./DataChunker";

const peer = new Peer();
const connections = <Record<string, DataConnection>>{}; // To store active connections by peer ID
let peerId: string = "";

// get the current theme from the URL
const searchParams = new URLSearchParams(window.location.search);
document.body.dataset.theme = searchParams.get("theme") ?? "light";

const imgContainer = document.getElementById("img-container") as HTMLDivElement;
const qrContainer = document.getElementById(
  "qr-container"
) as HTMLCanvasElement;
const qrWrapper = document.querySelector(".qr-wrapper") as HTMLElement;
const content = document.querySelector(".content") as HTMLElement;
content.style.display = "none";

let boardImages: Uint8Array[] = [];

// Listen plugin.ts messages
window.addEventListener("message", async (event) => {
  if (event.data.source === "penpot") {
    document.body.dataset.theme = event.data.theme;
  }

  if (event.data.type === "selection") {
    boardImages = event.data.images;

    await displayImagesWithImgTags(boardImages, imgContainer);
    sendMessage(peerId, boardImages);
  }
});

peer.on("open", (id) => {
  QRCode.toCanvas(qrContainer, btoa(id));
});

let chunker: DataChunker | null = null;

// Handle incoming connections
peer.on("connection", (conn) => {
  console.info("Incoming connection from:", conn.peer);
  peerId = conn.peer;

  // Store connection
  connections[conn.peer] = conn;
  chunker = new DataChunker(conn);

  // Handle incoming data
  conn.on("data", (data: any) => {
    try {
      // Convert received data to ArrayBuffer if it isn't already
      const arrayBuffer = data instanceof ArrayBuffer ? data : data.buffer;
      const decoder = new TextDecoder();
      const decodedMessage = decoder.decode(arrayBuffer);
      console.log("Received message:", decodedMessage);

      //   sendMessage(conn.peer, "Message received!");
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  // Handle connection events
  conn.on("open", () => {
    console.log("Connection established");
    qrWrapper.style.display = "none";
    content.style.display = "block";
    sendMessage(peerId, boardImages);
  });

  conn.on("close", () => {
    console.log("Connection closed");
    delete connections[conn.peer]; // Remove closed connection

    qrWrapper.style.display = "flex";
    content.style.display = "none";
  });

  conn.on("error", (error) => {
    qrWrapper.style.display = "flex";
    content.style.display = "none";

    console.error("Connection error:", error);
  });
});

// Handle peer errors
peer.on("error", (error) => {
  console.error("Peer error:", error);
});

// Function to send a message
function sendMessage(peerId: string, data: Uint8Array[]) {
  const conn = connections[peerId];

  console.log("ID: ", peerId);
  if (!conn || conn.open === false) {
    console.error(`No active connection to peer: ${peerId}`);
    return;
  }

  data.forEach((image) => {
    const base64 = uint8ArrayToBase64(image);
    console.log("LENGTH: ", base64.length);
    const encoder = new TextEncoder();

    const start = encoder.encode("START");
    conn.send(start);

    const chunks = divideStringIntoChunks(base64, 16000);

    chunks.forEach((chunk) => {
      const encodedData = encoder.encode(chunk);
      conn.send(encodedData);
    });

    const end = encoder.encode("END");
    conn.send(end);
  });
}

function uint8ArrayToBase64(uint8Array: Uint8Array) {
  // Convert the Uint8Array to a binary string
  const binaryString = Array.from(uint8Array)
    .map((byte) => String.fromCharCode(byte))
    .join("");

  // Encode the binary string as Base64
  return btoa(binaryString);
}

function divideStringIntoChunks(input: string, chunkSize: number): string[] {
  if (chunkSize <= 0) {
    throw new Error("Chunk size must be greater than zero.");
  }
  const chunks: string[] = [];
  for (let i = 0; i < input.length; i += chunkSize) {
    chunks.push(input.slice(i, i + chunkSize));
  }
  return chunks;
}
