export function refreshErrorMessage(error) {
  if (error?.response?.status === 401)
    return "Your session has ended. Please log in again.";
  if (error?.code === "ECONNABORTED" || error?.code === "ETIMEDOUT")
    return "Refresh timed out. Displayed data may be outdated. Try Refresh again.";
  if (!error?.response && error?.request)
    return "Unable to reach the server. Check your connection and try Refresh again.";
  const status = error?.response?.status;
  const message = error?.response?.data?.message;
  return `Unable to refresh data${status ? ` (HTTP ${status})` : ""}.${typeof message === "string" ? ` ${message}` : " Please try Refresh again."}`;
}
