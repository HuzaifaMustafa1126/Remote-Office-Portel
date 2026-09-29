const multipliers = { MINUTES: 1, HOURS: 60, DAYS: 1440 };

export function normalizeEstimate(item) {
  if (item.estimatedRemaining?.value != null) {
    const value = Number(item.estimatedRemaining.value);
    const unit = String(item.estimatedRemaining.unit || "").toUpperCase();
    return {
      value,
      unit,
      minutes: Math.round(value * multipliers[unit]),
    };
  }
  if (item.estimatedRemainingMinutes != null) {
    const minutes = Number(item.estimatedRemainingMinutes);
    return { value: minutes, unit: "MINUTES", minutes };
  }
  return null;
}

