export const MOBILE_BREAKPOINT = 768;
export const DESKTOP_BREAKPOINT = 1024;
export const MOBILE_PERMISSION = "portal.access_mobile";

export function detectDevice({ width = 1024, userAgent = "", mobileHint, touchPoints = 0, outerWidth = width, zoomedDesktop } = {}) {
  // Physical tablets remain allowed, including iPadOS's desktop user agent.
  if (/iPad|Tablet|PlayBook|Silk/i.test(userAgent) ||
      (/Android/i.test(userAgent) && !/Mobile/i.test(userAgent)) ||
      (/Macintosh/i.test(userAgent) && touchPoints > 1)) return "tablet";
  // A phone in landscape or desktop-site mode must still be treated as a phone.
  if (mobileHint === true || /iPhone|iPod|Android.*Mobile|Windows Phone|Mobi/i.test(userAgent)) return "mobile";
  // Desktop zoom shrinks the CSS viewport but normally leaves the outer window wide.
  zoomedDesktop ??= touchPoints === 0 && outerWidth / Math.max(width, 1) > 1.25;
  if (width < MOBILE_BREAKPOINT && !zoomedDesktop) return "mobile";
  return width < DESKTOP_BREAKPOINT ? "tablet" : "desktop";
}

let lastViewport;
export function getDeviceType() {
  if (typeof window === "undefined") return "desktop";
  const width = window.innerWidth, pixelRatio = window.devicePixelRatio;
  const ratioSuggestsZoom = navigator.maxTouchPoints === 0 && window.outerWidth / Math.max(width, 1) > 1.25;
  // Real desktop zoom changes devicePixelRatio. A viewport resize with the same
  // ratio is not a new zoom, even when outerWidth is stale (e.g. browser panels).
  const zoomedDesktop = !lastViewport || pixelRatio !== lastViewport.pixelRatio
    ? ratioSuggestsZoom
    : lastViewport.zoomedDesktop && ratioSuggestsZoom;
  lastViewport = { width, pixelRatio, zoomedDesktop };
  return detectDevice({ width, outerWidth: window.outerWidth, zoomedDesktop,
    userAgent: navigator.userAgent, mobileHint: navigator.userAgentData?.mobile,
    touchPoints: navigator.maxTouchPoints });
}
export const canAccessDevice = (user, device) =>
  device !== "mobile" || Boolean(user?.permissions?.includes(MOBILE_PERMISSION));
