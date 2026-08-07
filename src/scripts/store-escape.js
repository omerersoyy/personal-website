// store-escape.js — getting out of an in-app browser.
//
// THE PROBLEM. A link tapped inside Instagram (or Facebook, TikTok, Snapchat,
// X, LinkedIn) opens in that app's own WKWebView / Android WebView, not in the
// browser. On iOS, apps.apple.com immediately redirects to the itms-appss://
// scheme, and an in-app browser is not allowed to hand that scheme to the App
// Store — so the tap does nothing and the visitor is left on a blank page. This
// is not something the page did wrong, and a link shortener does not fix it:
// the redirect lands in the very same webview.
//
// WHAT ACTUALLY WORKS.
//   Android — an intent:// URL usually escapes to Play, so try that first.
//   iOS     — there is no reliable programmatic escape. itms-apps:// works
//             sometimes and costs nothing to try, but the honest fix is to tell
//             the visitor how to leave: the ••• menu → Open in browser.
//
// So: try the best native route, and show the instruction either way. The
// banner is the part that always works, which is why it is not hidden again
// after a tap.

const UA = navigator.userAgent || "";
const IN_APP =
  /Instagram|FBAN|FBAV|FB_IAB|TikTok|BytedanceWebview|Snapchat|Twitter|LinkedInApp|Line\//i.test(
    UA,
  );
const IOS = /iPhone|iPad|iPod/i.test(UA) ||
  (/Macintosh/.test(UA) && navigator.maxTouchPoints > 1);
const ANDROID = /Android/i.test(UA);

const banner = document.querySelector("[data-store-escape]");

if (IN_APP) {
  document.documentElement.classList.add("in-app-browser");
  if (banner) {
    const how = banner.querySelector("[data-store-escape-how]");
    if (how) {
      how.textContent = IOS
        ? "Tap ••• at the top right, then Open in browser."
        : "Tap ⋮ at the top right, then Open in browser.";
    }
    banner.hidden = false;
  }

  for (const link of document.querySelectorAll("a[data-store]")) {
    link.addEventListener("click", (ev) => {
      const store = link.dataset.store;
      const ref = link.dataset.storeRef;
      if (!ref) return; // no id parsed: leave the normal link alone

      if (ANDROID && store === "google") {
        ev.preventDefault();
        // Hands off to Play through Chrome, with the web page as the fallback
        // if the intent is refused.
        window.location.href =
          `intent://details?id=${ref}#Intent;scheme=market;package=com.android.vending;` +
          `S.browser_fallback_url=${encodeURIComponent(link.href)};end`;
        return;
      }

      if (IOS && store === "apple") {
        ev.preventDefault();
        // Best effort. If the webview refuses the scheme nothing happens, which
        // is exactly why the banner above is already on screen.
        window.location.href = `itms-apps://apps.apple.com/app/id${ref}`;
      }
    });
  }
}
