// src/hooks/usePermissions.js
import { useSelector } from 'react-redux';

export default function usePermissions() {
  const user = useSelector(state => state.auth.user);
  const family = useSelector(state => state.family.currentFamily);
  const users = useSelector(state => state.auth.users);

  if (!user || !family) {
    return { isOwner: false, canCreateTasks: false, canManageBank: false, member: null, family: null, members: [] };
  }

  const member = family.members?.find(m => m.id === user.id);
  const isOwner = family.owner_id === user.id;
  const canCreateTasks = isOwner || member?.role === 'parent' || member?.role === 'grandparent';
  const canManageBank = isOwner || member?.role === 'parent';

  return {
    isOwner,
    canCreateTasks,
    canManageBank,
    member,
    family,
    members: family.members || [],
  };
}