export function normalizeIp(value = "") {
  const ip = String(value || "").trim();
  return ip.toLowerCase().startsWith("::ffff:") ? ip.slice(7) : ip || null;
}

export function getClientIp(req) {
  // req.ip is calculated by Express/proxy-addr from the configured trusted
  // proxy chain. Never read forwarding headers directly for authentication
  // or security records.
  return normalizeIp(req.ip || req.socket?.remoteAddress);
}

export function parseUserAgent(value = "") {
  const ua = String(value || "").slice(0, 500);
  let browser = "Unknown";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/OPR\//i.test(ua)) browser = "Opera";
  else if (/Chrome\//i.test(ua)) browser = "Chrome";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  else if (/Safari\//i.test(ua)) browser = "Safari";
  let operatingSystem = "Unknown";
  if (/Windows/i.test(ua)) operatingSystem = "Windows";
  else if (/Android/i.test(ua)) operatingSystem = "Android";
  else if (/(iPhone|iPad|iPod)/i.test(ua)) operatingSystem = "iOS/iPadOS";
  else if (/(Macintosh|Mac OS X)/i.test(ua)) operatingSystem = "macOS";
  else if (/Linux/i.test(ua)) operatingSystem = "Linux";
  const deviceType = /iPad|Tablet/i.test(ua)
    ? "TABLET"
    : /Mobile|iPhone|Android/i.test(ua)
      ? "MOBILE"
      : ua ? "DESKTOP" : "UNKNOWN";
  return { userAgent: ua || null, browser, operatingSystem, deviceType };
}

export function requestSecurityMeta(req) {
  return { ip: getClientIp(req), ...parseUserAgent(req.get?.("user-agent")) };
}

export function logIpDiagnostics(req) {
  console.info("[IP_DIAGNOSTICS]", {
    expressIp: req.ip,
    expressIps: req.ips,
    socketRemoteAddress: req.socket?.remoteAddress,
    xForwardedFor: req.get?.("x-forwarded-for") || null,
    xRealIp: req.get?.("x-real-ip") || null,
  });
}
