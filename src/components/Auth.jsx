import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, Users, PlusCircle, LogIn, AlertCircle } from 'lucide-react';

export default function Auth() {
  const { user, signIn, signUp, createFamily, joinFamily, signOut, isMock } = useAuth();
  
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  // Estados de Família
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  
  // Estado de erro/sucesso
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (activeTab === 'login') {
        await signIn(email, password);
      } else {
        await signUp(email, password, displayName);
      }
    } catch (err) {
      setError(err.message || 'Erro durante a autenticação.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFamily = async (e) => {
    e.preventDefault();
    if (!familyName.trim()) return;
    setError('');
    setLoading(true);

    try {
      await createFamily(familyName);
    } catch (err) {
      setError(err.message || 'Erro ao criar família.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinFamily = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setError('');
    setLoading(true);

    try {
      await joinFamily(inviteCode);
    } catch (err) {
      setError(err.message || 'Código de convite inválido.');
    } finally {
      setLoading(false);
    }
  };

  // Se o usuário não está logado, mostra Login / Cadastro
  if (!user) {
    return (
      <div className="auth-wrapper">
        <div className="glass-card auth-card animate-fade-in">
          <div className="logo-container" style={{ justifyContent: 'center', marginBottom: '2rem' }}>
            <div className="logo-icon">
              <Users size={18} />
            </div>
            <span className="logo-text">FamFinances</span>
          </div>

          {isMock && (
            <div style={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '10px',
              padding: '0.75rem',
              fontSize: '0.8rem',
              color: '#f59e0b',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle size={16} />
              <span>Modo Simulação Ativo. Use qualquer senha.</span>
            </div>
          )}

          <div className="tabs-container">
            <button
              className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => { setActiveTab('login'); setError(''); }}
            >
              Entrar
            </button>
            <button
              className={`tab-btn ${activeTab === 'signup' ? 'active' : ''}`}
              onClick={() => { setActiveTab('signup'); setError(''); }}
            >
              Cadastrar
            </button>
          </div>

          {error && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#f43f5e',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              fontSize: '0.875rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activeTab === 'signup' && (
              <div className="form-group">
                <label className="form-label">Nome Completo</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '2.5rem', width: '100%' }}
                    placeholder="Seu nome"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">E-mail</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem', width: '100%' }}
                  placeholder="exemplo@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Senha</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem', width: '100%' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
              <LogIn size={18} />
              {loading ? 'Acessando...' : activeTab === 'login' ? 'Entrar' : 'Cadastrar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Se o usuário está logado mas NÃO tem uma família associada
  if (user && !user.family_id) {
    return (
      <div className="auth-wrapper">
        <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Olá, {user.display_name}!</h2>
            <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={signOut}>Sair</button>
          </div>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.95rem' }}>
            Você precisa criar um grupo familiar ou ingressar em um grupo existente para acessar o controle de finanças.
          </p>

          {error && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#f43f5e',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              fontSize: '0.875rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Criar Família */}
            <div style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PlusCircle size={18} className="text-primary" style={{ color: 'var(--primary-color)' }} />
                Criar Nova Família / Grupo
              </h3>
              <form onSubmit={handleCreateFamily} style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ flex: 1 }}
                  placeholder="Ex: Família Silva"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  Criar
                </button>
              </form>
            </div>

            {/* Ingressar em Família */}
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={18} style={{ color: 'var(--income-color)' }} />
                Ingressar em Família Existente
              </h3>
              <form onSubmit={handleJoinFamily} style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ flex: 1 }}
                  placeholder="Código de Convite (Ex: K9Z4AP)"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary" style={{ background: 'var(--income-gradient)' }} disabled={loading}>
                  Entrar
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
