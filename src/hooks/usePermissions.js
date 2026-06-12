import { useSelector } from 'react-redux';

export default function usePermissions() {
  const user = useSelector(state => state.auth.user);
  const family = useSelector(state => state.family.currentFamily);
  if (!user || !family) return { isOwner: false, canCreateTasks: false, canOpenBank: false, member: null, family: null };

  const member = family.members?.find(m => m.id === user.id);
  const isOwner = family.owner_id === user.id;
  return {
    isOwner,
    canCreateTasks: isOwner || member?.role === 'parent' || member?.role === 'grandparent',
    canOpenBank: isOwner || member?.role === 'parent',
    member,
    family,
  };
}