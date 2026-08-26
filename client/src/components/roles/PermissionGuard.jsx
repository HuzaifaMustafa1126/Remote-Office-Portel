import usePermission from '../../hooks/usePermission';export default function PermissionGuard({permission,children,fallback=null}){return usePermission(permission)?children:fallback}
