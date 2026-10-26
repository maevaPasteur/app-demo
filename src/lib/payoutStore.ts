import { create } from 'zustand';

/** État de la configuration du payout (démo, en mémoire). */
type PayoutState = {
  active: boolean;
  country: string;
  type: 'individual' | 'company';
  schedule: 'instant' | 'daily' | 'weekly';
  currency: string;
  activate: (p: { country: string; type: 'individual' | 'company'; schedule: 'instant' | 'daily' | 'weekly'; currency: string }) => void;
};

export const usePayout = create<PayoutState>((set) => ({
  active: false,
  country: 'ae',
  type: 'individual',
  schedule: 'instant',
  currency: 'USD',
  activate: (p) => set({ ...p, active: true }),
}));
