import { randomUUID } from "node:crypto";
import { requestSecurityMeta } from "./requestSecurity.js";

export const twofaRequestContext = (req) => {
  const supplied = String(req.get?.("x-request-id") || "").trim();
  const requestId = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,99}$/.test(supplied)
    ? supplied
    : randomUUID();
  return { ...requestSecurityMeta(req), requestId };
};
