import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./routes/AppRoutes";
import { NotificationProvider } from "./context/NotificationContext";
import { ThemeProvider } from "./context/ThemeContext";
import ThemePreviewBar from "./components/appearance/ThemePreviewBar";
export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider><NotificationProvider><AppRoutes /><ThemePreviewBar /></NotificationProvider></ThemeProvider>
    </AuthProvider>
  );
}
