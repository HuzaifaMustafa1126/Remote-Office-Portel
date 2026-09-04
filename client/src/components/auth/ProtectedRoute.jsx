import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import Loader from "../common/Loader";
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth(),
    loc = useLocation();
  if (loading) return <Loader full />;
  if (user?.mustChangePassword && loc.pathname !== "/account-settings") return <Navigate to="/account-settings" replace />;
  return user ? (
    children
  ) : (
    <Navigate to="/login" replace state={{ from: loc }} />
  );
}
