export default function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}) {
  const styles = {
    primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
    secondary:
      "bg-surface text-foreground border border-border hover:bg-surface-secondary",
    danger: "bg-danger-soft text-danger hover:bg-danger-soft",
  };
  return (
    <button
      className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
