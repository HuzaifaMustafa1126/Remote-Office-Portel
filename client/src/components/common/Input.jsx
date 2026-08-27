export default function Input({ label, error, className = "", ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <input
        className={`w-full rounded-xl border px-3.5 py-2.5 outline-none transition focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 ${error ? "border-red-400" : "border-slate-200"} ${className}`}
        {...props}
      />
      {error && (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      )}
    </label>
  );
}
