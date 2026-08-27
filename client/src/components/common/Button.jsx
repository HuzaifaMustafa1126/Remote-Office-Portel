export default function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}) {
  const styles = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700",
    secondary:
      "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
    danger: "bg-red-50 text-red-700 hover:bg-red-100",
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
