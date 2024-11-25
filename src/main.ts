import "./style.css";
import { DesignConnection } from "./DesignConnection";
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

const connection = new DesignConnection(qrContainer);
connection.createConnectionQR();

document
  .querySelector("[data-handler='send-message']")
  ?.addEventListener("click", () => {
    // send message to plugin.ts
    parent.postMessage("create-text", "*");
    connection.sendMessage();
  });
