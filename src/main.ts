import "./style.css";
import { Board } from "@penpot/plugin-types";
import { displayImagesWithImgTags } from "./util";

// get the current theme from the URL
const searchParams = new URLSearchParams(window.location.search);
document.body.dataset.theme = searchParams.get("theme") ?? "light";

const imgContainer = document.getElementById("img-container") as HTMLDivElement;
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const qrContainer = document.getElementById(
  "qr-container"
) as HTMLCanvasElement;

let selectedBoards: Board[] = [];
let boardImages: Uint8Array[] = [];

// Listen plugin.ts messages
window.addEventListener("message", async (event) => {
  if (event.data.source === "penpot") {
    document.body.dataset.theme = event.data.theme;
  }

  if (event.data.type === "selection") {
    selectedBoards = event.data.data;
    boardImages = event.data.images;

    await displayImagesWithImgTags(boardImages, imgContainer);
    console.log("Images: ", boardImages);
  }
});

// const connection = new DesignConnection(qrContainer);
// connection.createConnectionQR();

document
  .querySelector("[data-handler='send-message']")
  ?.addEventListener("click", () => {
    // send message to plugin.ts
    parent.postMessage("create-text", "*");
    // connection.sendMessage();
  });

import Peer from "peerjs";
import QRCode from "qrcode";
const peer = new Peer();

peer.on("open", (id: string) => {
  console.log("The ID: ", id);

  QRCode.toCanvas(qrContainer, btoa(id));
});

// Handle incoming connections
peer.on("connection", (conn) => {
  console.log("Incoming connection from:", conn.peer);

  // Handle incoming data
  conn.on("data", (data) => {
    try {
      // Convert received data to ArrayBuffer if it isn't already
      const arrayBuffer = data instanceof ArrayBuffer ? data : data.buffer;
      const decoder = new TextDecoder();
      const decodedMessage = decoder.decode(arrayBuffer);
      console.log("Received message:", decodedMessage);
      
      // When sending back
      const encoder = new TextEncoder();
      const response = encoder.encode("Message received!");
      conn.send(response);
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  // Handle connection events
  conn.on("open", () => {
    console.log("Connection established");
  });

  conn.on("close", () => {
    console.log("Connection closed");
  });

  conn.on("error", (error) => {
    console.error("Connection error:", error);
  });
});

// Handle peer errors
peer.on("error", (error) => {
  console.error("Peer error:", error);
});
