import { Link } from "react-router-dom";
export default function NotFoundPage() {
  return (
    <div className="grid min-h-[60vh] place-items-center text-center">
      <div>
        <p className="text-7xl font-black text-indigo-100">404</p>
        <h1 className="text-2xl font-bold">Page not found</h1>
        <Link className="mt-4 inline-block text-indigo-600" to="/">
          Return to dashboard
        </Link>
      </div>
    </div>
  );
}
