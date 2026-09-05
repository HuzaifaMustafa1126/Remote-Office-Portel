export default function Input({ label, error, className = "", ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </span>
      <input
        className={`w-full rounded-xl border px-3.5 py-2.5 outline-none transition focus:border-primary-border focus:ring-3 focus:ring-primary-border ${error ? "border-danger-border" : "border-border"} ${className}`}
        {...props}
      />
      {error && (
        <span className="mt-1 block text-xs text-danger">{error}</span>
      )}
    </label>
  );
}
