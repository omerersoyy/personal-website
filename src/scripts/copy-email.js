// copy-email.js — copy-to-clipboard for the press page address.
// The address is always visible and selectable in the markup, so this is a
// convenience only; nothing depends on it.

for (const button of document.querySelectorAll("[data-copy]")) {
  button.addEventListener("click", async () => {
    const value = button.dataset.copy;
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
    } catch {
      return; // clipboard blocked — the address is on screen to select
    }

    const original = button.textContent;
    button.textContent = "Copied";
    setTimeout(() => {
      button.textContent = original;
    }, 1600);
  });
}
