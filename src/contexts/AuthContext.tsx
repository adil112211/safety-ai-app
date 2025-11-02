import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, User } from '../lib/supabase';

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name?: string;
            last_name?: string;
            username?: string;
          };
        };
        ready: () => void;
        expand: () => void;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          show: () => void;
          hide: () => void;
          setText: (text: string) => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        BackButton: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
      };
    };
  }
}

interface AuthContextType {
  user: User | null;
  telegramUser: any;
  loading: boolean;
  updateUserPoints: (points: number) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [telegramUser, setTelegramUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  async function initializeAuth() {
    try {
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();

        const tgUser = tg.initDataUnsafe?.user;

        if (tgUser && tgUser.id) {
          console.log('Telegram user detected:', tgUser.id);
          setTelegramUser(tgUser);
          await fetchOrCreateUser(tgUser);
        } else {
          console.warn('No Telegram user data available');
          setLoading(false);
        }
      } else {
        console.warn('Not running in Telegram WebApp environment');
        setLoading(false);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      setLoading(false);
    }
  }

  async function fetchOrCreateUser(tgUser: any) {
    try {
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', tgUser.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingUser) {
        setUser(existingUser);
      } else {
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            telegram_id: tgUser.id,
            username: tgUser.username,
            first_name: tgUser.first_name,
            last_name: tgUser.last_name,
            points: 0,
            level: 1
          })
          .select()
          .single();

        if (createError) throw createError;
        setUser(newUser);
      }
    } catch (error) {
      console.error('Error fetching/creating user:', error);
    }
  }

  async function refreshUser() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUser(data);
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  }

  function updateUserPoints(points: number) {
    if (user) {
      const newPoints = user.points + points;
      const newLevel = Math.floor(newPoints / 100) + 1;

      setUser({
        ...user,
        points: newPoints,
        level: newLevel
      });

      supabase
        .from('users')
        .update({ points: newPoints, level: newLevel })
        .eq('id', user.id)
        .then();
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        telegramUser,
        loading,
        updateUserPoints,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
