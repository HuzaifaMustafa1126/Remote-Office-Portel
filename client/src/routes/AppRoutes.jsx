import { Navigate, Route, Routes } from "react-router-dom";
import DeviceAccessGuard from "../components/auth/DeviceAccessGuard";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import PermissionGuard from "../components/roles/PermissionGuard";
import AppLayout from "../layouts/AppLayout";
import AuditLogsPage from "../pages/AuditLogsPage";
import AttendancePage from "../pages/AttendancePage";
import AttendanceHistoryPage from "../pages/AttendanceHistoryPage";
import CompanyCalendarPage from "../pages/CompanyCalendarPage";
import DashboardPage from "../pages/DashboardPage";
import EmployeeDetailPage from "../pages/EmployeeDetailPage";
import EmployeesPage from "../pages/EmployeesPage";
import LeavePage from "../pages/LeavePage";
import LeaveRequestsPage from "../pages/LeaveRequestsPage";
import LoginPage from "../pages/LoginPage";
import NotFoundPage from "../pages/NotFoundPage";
import PermissionsPage from "../pages/PermissionsPage";
import RolesPage from "../pages/RolesPage";
import NotificationsPage from "../pages/NotificationsPage";
import NotificationSettingsPage from "../pages/NotificationSettingsPage";
import ShiftManagementPage from "../pages/ShiftManagementPage";
import PayrollPage from "../pages/PayrollPage";
import SalaryPage from "../pages/SalaryPage";
import MySalaryPage from "../pages/MySalaryPage";
import ReportsPage from "../pages/ReportsPage";
import AppearancePage from "../pages/AppearancePage";
import AccountSettingsPage from "../pages/AccountSettingsPage";
import { PERMISSIONS as P } from "../utils/permissions";
const Gate = ({ permission, children }) => (
  <PermissionGuard
    permission={permission}
    fallback={<Navigate to="/" replace />}
  >
    {children}
  </PermissionGuard>
);
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <DeviceAccessGuard><AppLayout /></DeviceAccessGuard>
          </ProtectedRoute>
        }
      >
        <Route path="settings/appearance" element={<AppearancePage />} />
        <Route path="account-settings" element={<AccountSettingsPage />} />
        <Route
          index
          element={
            <Gate permission={P.DASHBOARD}>
              <DashboardPage />
            </Gate>
          }
        />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route
          path="notification-settings"
          element={<NotificationSettingsPage />}
        />
        <Route
          path="shifts"
          element={
            <Gate permission={P.SHIFT_VIEW}>
              <ShiftManagementPage />
            </Gate>
          }
        />
        <Route
          path="payroll"
          element={
            <Gate permission={P.PAYROLL_VIEW_ALL}>
              <PayrollPage />
            </Gate>
          }
        />
        <Route
          path="salary"
          element={
            <Gate permission={P.SALARY_VIEW_ALL}>
              <SalaryPage />
            </Gate>
          }
        />
        <Route
          path="my-salary"
          element={
            <Gate permission={P.SALARY_VIEW_OWN}>
              <MySalaryPage />
            </Gate>
          }
        />
        <Route
          path="reports"
          element={
            <Gate permission={P.REPORTS_VIEW}>
              <ReportsPage />
            </Gate>
          }
        />
        <Route
          path="attendance"
          element={
            <Gate permission={P.ATTENDANCE_ALL}>
              <AttendancePage />
            </Gate>
          }
        />
        <Route
          path="attendance/history"
          element={
            <Gate permission={P.ATTENDANCE_OWN}>
              <AttendanceHistoryPage />
            </Gate>
          }
        />
        <Route
          path="leave"
          element={
            <Gate permission={P.LEAVE_OWN}>
              <LeavePage />
            </Gate>
          }
        />
        <Route
          path="leave-requests"
          element={
            <Gate permission={P.LEAVE_ALL}>
              <LeaveRequestsPage />
            </Gate>
          }
        />
        <Route
          path="company-calendar"
          element={
            <Gate permission={P.CALENDAR_VIEW}>
              <CompanyCalendarPage />
            </Gate>
          }
        />
        <Route
          path="employees"
          element={
            <Gate permission={P.EMPLOYEES_ALL}>
              <EmployeesPage />
            </Gate>
          }
        />
        <Route
          path="employees/:id"
          element={
            <Gate permission={P.EMPLOYEES_ALL}>
              <EmployeeDetailPage />
            </Gate>
          }
        />
        <Route
          path="roles"
          element={
            <Gate permission={P.ROLES_VIEW}>
              <RolesPage />
            </Gate>
          }
        />
        <Route
          path="permissions"
          element={
            <Gate permission={P.PERMISSIONS_VIEW}>
              <PermissionsPage />
            </Gate>
          }
        />
        <Route
          path="audit-logs"
          element={
            <Gate permission={P.AUDIT_VIEW}>
              <AuditLogsPage />
            </Gate>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
