export default defineContentScript({
  matches: ["https://sylview.e-chan.me/*"],
  runAt: "document_idle",
  main(ctx) {}
});
