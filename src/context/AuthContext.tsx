import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Profile } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DEMO_PROFILE } from '../data/demo';

interface AuthContextType {
  user: Profile | null;
  isLoading: boolean;
  isDemo: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (data: SignUpData) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error: string | null }>;
  enterDemoMode: () => void;
}

interface SignUpData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  blood_group?: string;
  region?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const hasSignedOut = localStorage.getItem('donor_signed_out');
    const demoMode = localStorage.getItem('donor_demo_mode');

    // Supabase sozlanmagan bo'lsa yoki demo rejimi tanlangan bo'lsa, avtomatik demo profilni yuklash
    if (demoMode === 'true' || (!isSupabaseConfigured && hasSignedOut !== 'true')) {
      setUser(DEMO_PROFILE);
      setIsDemo(true);
      setIsLoading(false);
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setIsLoading(false);
      return;
    }

    // Supabase session ni tekshirish
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await loadProfile(session.user.id);
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await loadProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    if (!supabase) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) setUser(data as Profile);
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured || !supabase) {
      // Demo rejimda avtomatik kirish imkonini berish
      localStorage.removeItem('donor_signed_out');
      localStorage.setItem('donor_demo_mode', 'true');
      setUser({
        ...DEMO_PROFILE,
        email: email || DEMO_PROFILE.email,
        full_name: email ? email.split('@')[0].toUpperCase() : DEMO_PROFILE.full_name,
      });
      setIsDemo(true);
      return { error: null };
    }
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsLoading(false);
    return { error: error?.message || null };
  };

  const signUp = async (data: SignUpData) => {
    if (!isSupabaseConfigured || !supabase) {
      // Demo rejimda ro'yxatdan o'tishni muvaffaqiyatli qilish
      localStorage.removeItem('donor_signed_out');
      localStorage.setItem('donor_demo_mode', 'true');
      setUser({
        ...DEMO_PROFILE,
        email: data.email,
        full_name: data.full_name,
        phone: data.phone || DEMO_PROFILE.phone,
        blood_group: (data.blood_group as any) || DEMO_PROFILE.blood_group,
        region: data.region || DEMO_PROFILE.region,
      });
      setIsDemo(true);
      return { error: null };
    }
    setIsLoading(true);
    const { error, data: authData } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
          phone: data.phone,
          blood_group: data.blood_group,
          region: data.region,
        },
      },
    });
    if (!error && authData.user) {
      await supabase.from('profiles').insert({
        id: authData.user.id,
        email: data.email,
        full_name: data.full_name,
        phone: data.phone,
        blood_group: data.blood_group,
        region: data.region,
        donor_status: 'available',
        is_donor: false,
        is_admin: false,
        is_blocked: false,
        donations_count: 0,
        helped_count: 0,
      });
    }
    setIsLoading(false);
    return { error: error?.message || null };
  };

  const signOut = async () => {
    localStorage.setItem('donor_signed_out', 'true');
    localStorage.removeItem('donor_demo_mode');
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setIsDemo(false);
  };

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured || !supabase) {
      return { error: 'Google OAuth uchun Supabase konfiguratsiyasi kerak. Avval .env faylni sozlang.' };
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    return { error: error?.message || null };
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (isDemo) {
      setUser(prev => prev ? { ...prev, ...data } : null);
      return { error: null };
    }
    if (!supabase || !user) return { error: 'Foydalanuvchi topilmadi' };
    const { error } = await supabase
      .from('profiles')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    if (!error) setUser(prev => prev ? { ...prev, ...data } : null);
    return { error: error?.message || null };
  };

  const enterDemoMode = () => {
    localStorage.setItem('donor_demo_mode', 'true');
    setUser(DEMO_PROFILE);
    setIsDemo(true);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isDemo,
      signIn,
      signUp,
      signOut,
      signInWithGoogle,
      updateProfile,
      enterDemoMode,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
