export function normalizeIp(value = "") {
  const ip = String(value || "").trim();
  return ip.startsWith("::ffff:") ? ip.slice(7) : ip || null;
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
  return { ip: normalizeIp(req.ip || req.socket?.remoteAddress), ...parseUserAgent(req.get?.("user-agent")) };
}
