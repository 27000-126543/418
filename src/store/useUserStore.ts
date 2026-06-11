import { create } from 'zustand';
import type { User } from '@/types';
import { mockUsers } from '@/data/users';

interface UserStoreState {
  users: User[];
  currentUser: User | null;
  isAuthenticated: boolean;
}

interface UserStoreActions {
  login: (userId: string) => boolean;
  logout: () => void;
  setCurrentUser: (user: User | null) => void;
  getUserById: (userId: string) => User | undefined;
  getUsersByRole: (role: User['role']) => User[];
  getUsersByDepartment: (department: string) => User[];
}

export type UserStore = UserStoreState & UserStoreActions;

export const useUserStore = create<UserStore>((set, get) => ({
  users: mockUsers,
  currentUser: mockUsers[0] ?? null,
  isAuthenticated: !!mockUsers[0],

  login: (userId: string) => {
    const user = get().users.find(u => u.id === userId);
    if (user) {
      set({ currentUser: user, isAuthenticated: true });
      return true;
    }
    return false;
  },

  logout: () => {
    set({ currentUser: null, isAuthenticated: false });
  },

  setCurrentUser: (user: User | null) => {
    set({ currentUser: user, isAuthenticated: !!user });
  },

  getUserById: (userId: string) => {
    return get().users.find(u => u.id === userId);
  },

  getUsersByRole: (role: User['role']) => {
    return get().users.filter(u => u.role === role);
  },

  getUsersByDepartment: (department: string) => {
    return get().users.filter(u => u.department === department);
  },
}));
