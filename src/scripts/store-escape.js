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

      // Both native routes are rebuilt from the id rather than from the href,
      // so the campaign parameters have to be carried across by hand. Losing
      // them here would be invisible and expensive: every install that came
      // through an in-app browser — which is most of the paid traffic — would
      // arrive at the store untagged and be filed as organic.
      const query = new URL(link.href, location.href).searchParams;

      if (ANDROID && store === "google") {
        ev.preventDefault();
        // Play reads the UTM campaign out of `referrer`. URLSearchParams
        // re-encodes it, which is the form Play expects and is also what keeps
        // any `;` inside it from terminating the intent's own `;`-separated
        // fragment below.
        const params = new URLSearchParams({ id: ref });
        const referrer = query.get("referrer");
        if (referrer) params.set("referrer", referrer);
        // Hands off to Play through Chrome, with the web page as the fallback
        // if the intent is refused.
        window.location.href =
          `intent://details?${params}#Intent;scheme=market;package=com.android.vending;` +
          `S.browser_fallback_url=${encodeURIComponent(link.href)};end`;
        return;
      }

      if (IOS && store === "apple") {
        ev.preventDefault();
        // Same scheme, same query: `ct` (App Analytics campaign) and Apple's
        // own `itsc*` marketing-tools tokens ride along untouched.
        const search = query.toString();
        // Best effort. If the webview refuses the scheme nothing happens, which
        // is exactly why the banner above is already on screen.
        window.location.href =
          `itms-apps://apps.apple.com/app/id${ref}${search ? `?${search}` : ""}`;
      }
    });
  }
}
