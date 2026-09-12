import EmployeeNotificationPreferences from "../components/notifications/EmployeeNotificationPreferences";

// Personal notification choices use one compact experience for every role.
// Organization policy remains on the separately protected management page.
export default function NotificationSettingsPage() {
  return <EmployeeNotificationPreferences />;
}
