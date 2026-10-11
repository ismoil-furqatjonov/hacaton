import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Profile, UserTrack } from '../types';
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
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  enterDemoMode: () => void;
}

interface SignUpData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  blood_group?: string;
  region?: string;
  user_track?: UserTrack;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const savedSession = localStorage.getItem('donor_user_session');
    const demoMode = localStorage.getItem('donor_demo_mode');
    const hasSignedOut = localStorage.getItem('donor_signed_out');

    // 1. Saqlangan faol sessiya bo'lsa tiklash
    if (savedSession && hasSignedOut !== 'true') {
      try {
        const parsed = JSON.parse(savedSession);
        if (parsed && parsed.id) {
          setUser(parsed);
          setIsDemo(demoMode === 'true' || !isSupabaseConfigured);
          setIsLoading(false);
          return;
        }
      } catch { /* ignore */ }
    }

    // 2. Foydalanuvchi auth sahifasida "Demo kirish"ni tanlagan bo'lsa
    if (demoMode === 'true' && hasSignedOut !== 'true') {
      setUser(DEMO_PROFILE);
      setIsDemo(true);
      setIsLoading(false);
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      // Ro'yxatdan o'tmagan yoki kirmagan bo'lsa, tizimga ruxsat berilmaydi
      setUser(null);
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
      // Offline / Demo rejimda kirish
      localStorage.removeItem('donor_signed_out');
      localStorage.setItem('donor_demo_mode', 'true');
      const profile: Profile = {
        ...DEMO_PROFILE,
        email: email || DEMO_PROFILE.email,
        full_name: email ? email.split('@')[0].toUpperCase() : DEMO_PROFILE.full_name,
        user_track: DEMO_PROFILE.user_track || 'donor',
      };
      localStorage.setItem('donor_user_session', JSON.stringify(profile));
      setUser(profile);
      setIsDemo(true);
      return { error: null };
    }
    setIsLoading(true);
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.user) {
      localStorage.removeItem('donor_signed_out');
      await loadProfile(data.user.id);
    }
    setIsLoading(false);
    return { error: error?.message || null };
  };

  const signUp = async (data: SignUpData) => {
    const isDonor = data.user_track === 'donor';

    if (!isSupabaseConfigured || !supabase) {
      // Offline / Demo rejimda ro'yxatdan o'tish
      localStorage.removeItem('donor_signed_out');
      localStorage.setItem('donor_demo_mode', 'true');
      const newProfile: Profile = {
        ...DEMO_PROFILE,
        id: `user-${Date.now()}`,
        email: data.email,
        full_name: data.full_name,
        phone: data.phone || '',
        blood_group: (data.blood_group as any) || undefined,
        region: data.region || '',
        user_track: data.user_track || 'donor',
        is_donor: isDonor,
        is_admin: false,
      };
      localStorage.setItem('donor_user_session', JSON.stringify(newProfile));
      setUser(newProfile);
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
          user_track: data.user_track || 'donor',
        },
      },
    });

    if (!error && authData.user) {
      localStorage.removeItem('donor_signed_out');
      const profileData: Partial<Profile> = {
        id: authData.user.id,
        email: data.email,
        full_name: data.full_name,
        phone: data.phone,
        blood_group: (data.blood_group as any) || undefined,
        region: data.region,
        user_track: data.user_track || 'donor',
        donor_status: 'available',
        is_donor: isDonor,
        is_admin: false,
        is_blocked: false,
        donations_count: 0,
        helped_count: 0,
      };

      await supabase.from('profiles').insert(profileData);
      const fullProfile = { ...DEMO_PROFILE, ...profileData } as Profile;
      localStorage.setItem('donor_user_session', JSON.stringify(fullProfile));
      setUser(fullProfile);
    }
    setIsLoading(false);
    return { error: error?.message || null };
  };

  const signOut = async () => {
    localStorage.removeItem('donor_user_session');
    localStorage.removeItem('donor_demo_mode');
    localStorage.setItem('donor_signed_out', 'true');
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
    if (isDemo || !isSupabaseConfigured) {
      setUser(prev => {
        if (!prev) return null;
        const updated = { ...prev, ...data, updated_at: new Date().toISOString() };
        localStorage.setItem('donor_user_session', JSON.stringify(updated));
        return updated;
      });
      return { error: null };
    }
    if (!supabase || !user) return { error: 'Foydalanuvchi topilmadi' };
    const { error } = await supabase
      .from('profiles')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    if (!error) {
      setUser(prev => {
        if (!prev) return null;
        const updated = { ...prev, ...data, updated_at: new Date().toISOString() };
        localStorage.setItem('donor_user_session', JSON.stringify(updated));
        return updated;
      });
    }
    return { error: error?.message || null };
  };

  const resetPassword = async (email: string) => {
    if (!email) return { error: 'Iltimos, emailingizni kiriting' };
    if (!isSupabaseConfigured || !supabase) {
      return { error: null };
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    return { error: error?.message || null };
  };

  const enterDemoMode = () => {
    localStorage.removeItem('donor_signed_out');
    localStorage.setItem('donor_demo_mode', 'true');
    localStorage.setItem('donor_user_session', JSON.stringify(DEMO_PROFILE));
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
      resetPassword,
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
