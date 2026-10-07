import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isMockEnabled } from '../supabaseClient';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [family, setFamily] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // MOCK LOGIC FOR LOCAL STORAGE
  const getMockData = (key, defaultVal = []) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultVal;
  };

  const saveMockData = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  // Inicializa a sessão e escuta mudanças
  useEffect(() => {
    if (isMockEnabled) {
      // Mock inicial
      const currentSession = localStorage.getItem('mock_session');
      if (currentSession) {
        const u = JSON.parse(currentSession);
        setUser(u);
        loadMockFamilyAndMembers(u.id);
      } else {
        setUser(null);
      }
      setLoading(false);
    } else {
      // Supabase inicial
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          loadProfile(session.user);
        } else {
          setUser(null);
          setLoading(false);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          loadProfile(session.user);
        } else {
          setUser(null);
          setFamily(null);
          setFamilyMembers([]);
          setLoading(false);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  // Carrega Perfil do Supabase
  const loadProfile = async (authUser) => {
    try {
      let { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Perfil não existe, cria um padrão
        const newProfile = {
          id: authUser.id,
          display_name: authUser.email.split('@')[0],
          avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${authUser.email}`,
          family_id: null
        };
        const { data, error: insertError } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select()
          .single();
        
        if (!insertError) profile = data;
      }

      if (profile) {
        setUser({ ...authUser, ...profile });
        if (profile.family_id) {
          await loadFamilyAndMembers(profile.family_id);
        } else {
          setFamily(null);
          setFamilyMembers([]);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
    } finally {
      setLoading(false);
    }
  };

  // Carrega Família e Membros do Supabase
  const loadFamilyAndMembers = async (familyId) => {
    try {
      const { data: fam } = await supabase
        .from('families')
        .select('*')
        .eq('id', familyId)
        .single();

      if (fam) {
        setFamily(fam);
        const { data: members } = await supabase
          .from('profiles')
          .select('*')
          .eq('family_id', familyId);
        setFamilyMembers(members || []);
      }
    } catch (err) {
      console.error('Erro ao carregar família:', err);
    }
  };

  // Carrega Família e Membros em modo Mock
  const loadMockFamilyAndMembers = (userId) => {
    const profiles = getMockData('mock_profiles');
    const profile = profiles.find(p => p.id === userId);
    if (profile && profile.family_id) {
      const families = getMockData('mock_families');
      const fam = families.find(f => f.id === profile.family_id);
      if (fam) {
        setFamily(fam);
        const members = profiles.filter(p => p.family_id === profile.family_id);
        setFamilyMembers(members);
      }
    } else {
      setFamily(null);
      setFamilyMembers([]);
    }
  };

  // Funções de Autenticação

  const signIn = async (email, password) => {
    if (isMockEnabled) {
      const users = getMockData('mock_users');
      const foundUser = users.find(u => u.email === email && u.password === password);
      if (!foundUser) {
        throw new Error('Credenciais inválidas no modo de simulação.');
      }
      const profiles = getMockData('mock_profiles');
      const profile = profiles.find(p => p.id === foundUser.id) || {
        id: foundUser.id,
        display_name: email.split('@')[0],
        avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${email}`,
        family_id: null
      };
      
      const sessionUser = { id: foundUser.id, email, ...profile };
      localStorage.setItem('mock_session', JSON.stringify(sessionUser));
      setUser(sessionUser);
      loadMockFamilyAndMembers(foundUser.id);
      return { user: sessionUser };
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    }
  };

  const signUp = async (email, password, displayName) => {
    if (isMockEnabled) {
      const users = getMockData('mock_users');
      if (users.find(u => u.email === email)) {
        throw new Error('Este email já está cadastrado.');
      }
      const newUserId = crypto.randomUUID();
      const newUser = { id: newUserId, email, password };
      users.push(newUser);
      saveMockData('mock_users', users);

      const profiles = getMockData('mock_profiles');
      const newProfile = {
        id: newUserId,
        display_name: displayName || email.split('@')[0],
        avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${email}`,
        family_id: null
      };
      profiles.push(newProfile);
      saveMockData('mock_profiles', profiles);

      const sessionUser = { id: newUserId, email, ...newProfile };
      localStorage.setItem('mock_session', JSON.stringify(sessionUser));
      setUser(sessionUser);
      setFamily(null);
      setFamilyMembers([]);
      return { user: sessionUser };
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (data.user) {
        const newProfile = {
          id: data.user.id,
          display_name: displayName || email.split('@')[0],
          avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${email}`,
          family_id: null
        };
        await supabase.from('profiles').insert([newProfile]);
      }
      return data;
    }
  };

  const signOut = async () => {
    if (isMockEnabled) {
      localStorage.removeItem('mock_session');
      setUser(null);
      setFamily(null);
      setFamilyMembers([]);
    } else {
      await supabase.auth.signOut();
    }
  };

  // Funções de Gerenciamento da Família

  const createFamily = async (name) => {
    if (!user) throw new Error('Usuário precisa estar logado.');
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    if (isMockEnabled) {
      const families = getMockData('mock_families');
      const newFamily = {
        id: crypto.randomUUID(),
        name,
        invite_code: inviteCode,
        created_at: new Date().toISOString()
      };
      families.push(newFamily);
      saveMockData('mock_families', families);

      // Atualiza perfil do usuário
      const profiles = getMockData('mock_profiles');
      const updatedProfiles = profiles.map(p => {
        if (p.id === user.id) {
          return { ...p, family_id: newFamily.id };
        }
        return p;
      });
      saveMockData('mock_profiles', updatedProfiles);

      const updatedUser = { ...user, family_id: newFamily.id };
      setUser(updatedUser);
      localStorage.setItem('mock_session', JSON.stringify(updatedUser));
      
      setFamily(newFamily);
      setFamilyMembers([updatedProfiles.find(p => p.id === user.id)]);
      return newFamily;
    } else {
      // Supabase
      const { data: newFam, error: famError } = await supabase
        .from('families')
        .insert([{ name, invite_code: inviteCode }])
        .select()
        .single();

      if (famError) throw famError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ family_id: newFam.id })
        .eq('id', user.id);

      if (profileError) throw profileError;

      setUser(prev => ({ ...prev, family_id: newFam.id }));
      await loadFamilyAndMembers(newFam.id);
      return newFam;
    }
  };

  const joinFamily = async (inviteCode) => {
    if (!user) throw new Error('Usuário precisa estar logado.');
    const cleanCode = inviteCode.trim().toUpperCase();

    if (isMockEnabled) {
      const families = getMockData('mock_families');
      const foundFam = families.find(f => f.invite_code === cleanCode);
      if (!foundFam) throw new Error('Código de convite não encontrado.');

      const profiles = getMockData('mock_profiles');
      const updatedProfiles = profiles.map(p => {
        if (p.id === user.id) {
          return { ...p, family_id: foundFam.id };
        }
        return p;
      });
      saveMockData('mock_profiles', updatedProfiles);

      const updatedUser = { ...user, family_id: foundFam.id };
      setUser(updatedUser);
      localStorage.setItem('mock_session', JSON.stringify(updatedUser));
      
      setFamily(foundFam);
      setFamilyMembers(updatedProfiles.filter(p => p.family_id === foundFam.id));
      return foundFam;
    } else {
      const { data: fam, error: famError } = await supabase
        .from('families')
        .select('*')
        .eq('invite_code', cleanCode)
        .single();

      if (famError || !fam) throw new Error('Código de convite inválido.');

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ family_id: fam.id })
        .eq('id', user.id);

      if (profileError) throw profileError;

      setUser(prev => ({ ...prev, family_id: fam.id }));
      await loadFamilyAndMembers(fam.id);
      return fam;
    }
  };

  const refreshFamilyMembers = async () => {
    if (!family) return;
    if (isMockEnabled) {
      loadMockFamilyAndMembers(user.id);
    } else {
      await loadFamilyAndMembers(family.id);
    }
  };

  const value = {
    user,
    family,
    familyMembers,
    loading,
    signIn,
    signUp,
    signOut,
    createFamily,
    joinFamily,
    refreshFamilyMembers,
    isMock: isMockEnabled
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
