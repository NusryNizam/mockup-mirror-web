penpot.ui.open("Mockup Mirror", `?theme=${penpot.theme}`, {
  width: 800,
  height: 600,
});

penpot.ui.onMessage<{
  type: string;
  data: any;
}>((message) => {
  // Logic
});

// Update the theme in the iframe
penpot.on("themechange", (theme) => {
  penpot.ui.sendMessage({
    source: "penpot",
    type: "themechange",
    theme,
  });
});

let images: Uint8Array[] = [];

// send the selected boards on change
penpot.on("selectionchange", async () => {
  images = await getImages();
  penpot.ui.sendMessage({
    type: "selection",
    data: penpot.selection.filter((e) => e.type === "board"),
    images: images,
  });
});

async function getImages(): Promise<Uint8Array[]> {
  const promises = penpot.selection
    .filter((e) => e.type === "board")
    .map((e) => e.export({ type: "png", scale: 1 }));

  return Promise.all(promises);
}

getImages().then((images) => {
  penpot.ui.sendMessage({
    type: "selection",
    data: penpot.selection.filter((e) => e.type === "board"),
    images: images,
  });
});
