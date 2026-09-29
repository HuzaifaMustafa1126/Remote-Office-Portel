export const estimateFromItem = (item) => {
  if (item?.estimatedRemaining?.value != null) return item.estimatedRemaining;
  if (item?.estimatedRemainingValue != null)
    return {
      value: Number(item.estimatedRemainingValue),
      unit: item.estimatedRemainingUnit,
    };
  if (item?.estimatedRemainingMinutes != null)
    return { value: Number(item.estimatedRemainingMinutes), unit: "MINUTES" };
  return null;
};

export const formatEstimate = (item) => {
  const estimate = estimateFromItem(item);
  if (!estimate) return "—";
  const value = Number(estimate.value);
  const labels = {
    MINUTES: value === 1 ? "minute" : "minutes",
    HOURS: value === 1 ? "hour" : "hours",
    DAYS: value === 1 ? "day" : "days",
  };
  const amount = Number.isInteger(value)
    ? value
    : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  return `${amount} ${labels[estimate.unit] || String(estimate.unit).toLowerCase()}`;
};
