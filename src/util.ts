import { Board } from "@penpot/plugin-types";

export async function displayImages(
  imageDataArray: Uint8Array[],
  boardInfo: Board[],
  canvas: HTMLCanvasElement
) {
  const ctx = canvas.getContext("2d")!;
  const padding = 10; // Space between images

  canvas.height = Math.max(...boardInfo.map((e) => e.height));
  canvas.width = boardInfo.reduce((acc, curr) => acc + curr.width + padding, 0);

  // Clear existing content
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let currentX = 0;

  for (const imageData of imageDataArray) {
    // Convert Uint8Array to SVG string

    // Create a Blob from the SVG string
    const blob = new Blob([imageData], { type: "image/png" });
    const url = URL.createObjectURL(blob);

    // Load image
    const img = new Image();
    await new Promise((resolve) => {
      img.onload = resolve;
      img.src = url;
    });

    // Draw image
    ctx.drawImage(img, currentX, 0);

    // Update position for next image
    currentX += img.width + padding;

    // Clean up
    URL.revokeObjectURL(url);
  }
}

export async function displayImagesWithImgTags(
  imageDataArray: Uint8Array[],
  container: HTMLElement
) {
  container.innerHTML = ""; // Clear existing content

  for (const imageData of imageDataArray) {
    // Create a Blob from the image data
    const blob = new Blob([imageData], { type: "image/png" });
    const url = URL.createObjectURL(blob);

    // Create an <img> element
    const img = document.createElement("img");
    img.src = url;

    // Style the image for padding
    img.style.marginRight = `10px`;
    img.style.maxHeight = `400px`;

    // Append the image to the container
    container.appendChild(img);

    // Clean up URL object when image is loaded
    img.onload = () => URL.revokeObjectURL(url);
  }
}
