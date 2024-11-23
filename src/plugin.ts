penpot.ui.open("Mockup Mirror", `?theme=${penpot.theme}`);

penpot.ui.onMessage<{
  type: string;
  data: any;
}>((message) => {
  console.log(message);
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
