import { getClient } from './client';

export interface Branch {
  id: string;
  name: string;
  country: string;
  city: string;
  address: string;
  phone: string;
  opening_hours: string;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
}

export async function getActiveBranches(): Promise<Branch[]> {
  const { data } = await getClient()
    .from('branches')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  return (data ?? []) as Branch[];
}

export function isBranchOpen(branch: Branch): boolean {
  if (!branch.opening_hours) return false;
  try {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentMinutes = hours * 60 + minutes;
    const parts = branch.opening_hours.split('-');
    if (parts.length !== 2) return false;
    const [openH, openM] = parts[0].trim().split(':').map(Number);
    const [closeH, closeM] = parts[1].trim().split(':').map(Number);
    const openMinutes = openH * 60 + (openM || 0);
    const closeMinutes = closeH * 60 + (closeM || 0);
    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  } catch {
    return false;
  }
}

export function getClosingTime(branch: Branch): string {
  if (!branch.opening_hours) return '';
  const parts = branch.opening_hours.split('-');
  return parts.length === 2 ? parts[1].trim() : '';
}
