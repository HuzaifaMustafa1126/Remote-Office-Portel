import useAuth from './useAuth'; export default function usePermission(permission){const {user}=useAuth();return Boolean(user?.permissions?.includes(permission))}
