import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./routes/AppRoutes";
import { NotificationProvider } from "./context/NotificationContext";
export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider><AppRoutes /></NotificationProvider>
    </AuthProvider>
  );
}
