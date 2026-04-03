import create from 'zustand';

export const useAppStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (value) => set({ loading: value }),
  setError: (error) => set({ error }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
