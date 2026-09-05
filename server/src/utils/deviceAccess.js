export const MOBILE_PERMISSION = "portal.access_mobile";
export function isMobileRequest(headers = {}, clientDevice) {
  const ua = headers["user-agent"] || "";
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return false;
  // Strong phone signals take precedence over a contradictory custom header.
  return headers["sec-ch-ua-mobile"] === "?1" ||
    /iPhone|iPod|Android.*Mobile|Windows Phone|Mobi/i.test(ua) ||
    (clientDevice || headers["x-client-device"]) === "mobile";
}
