export default function Loader({ full = false }) {
  return (
    <div
      className={`${full ? "min-h-screen" : ""} grid place-items-center p-10`}
    >
      <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary-border border-t-indigo-600" />
    </div>
  );
}
