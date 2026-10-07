import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Copy, RefreshCw, LogOut, Check, Shield } from 'lucide-react';

export default function FamilySettings() {
  const { user, family, familyMembers, signOut, refreshFamilyMembers } = useAuth();
  const [copied, setCopied] = useState(false);

  const copyInviteCode = () => {
    if (family?.invite_code) {
      navigator.clipboard.writeText(family.invite_code).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  const handleRefreshMembers = async () => {
    await refreshFamilyMembers();
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '700px' }}>
      <h2 style={{ fontSize: '1.75rem', fontWeight: '800', background: 'linear-gradient(to right, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Configurações da Família
      </h2>

      {/* Card: Info do Grupo */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={18} style={{ color: 'var(--primary-color)' }} />
          Grupo Familiar
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
              Nome do Grupo
            </p>
            <p style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-title)' }}>
              {family?.name || '—'}
            </p>
          </div>

          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              Código de Convite
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px dashed rgba(99, 102, 241, 0.3)',
                borderRadius: '10px',
                padding: '0.75rem 1.5rem',
                fontFamily: 'monospace',
                fontSize: '1.75rem',
                fontWeight: '800',
                letterSpacing: '0.4em',
                color: 'var(--primary-color)',
              }}>
                {family?.invite_code || '——'}
              </div>
              <button
                className="btn btn-primary"
                style={{ padding: '0.75rem 1.25rem' }}
                onClick={copyInviteCode}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Compartilhe este código com os membros da família para que eles possam entrar no grupo.
            </p>
          </div>
        </div>
      </div>

      {/* Card: Membros */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} style={{ color: 'var(--income-color)' }} />
            Membros ({familyMembers.length})
          </h3>
          <button
            className="btn btn-outline"
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={handleRefreshMembers}
          >
            <RefreshCw size={14} />
            Atualizar
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {familyMembers.map((member) => (
            <div key={member.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.85rem 1rem',
              background: member.id === user?.id ? 'rgba(99, 102, 241, 0.07)' : 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              border: member.id === user?.id ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid var(--card-border)',
            }}>
              <img
                src={member.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.display_name}`}
                alt={member.display_name}
                style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.08)', background: '#1e293b' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-title)' }}>
                  {member.display_name}
                  {member.id === user?.id && (
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', background: 'rgba(99, 102, 241, 0.2)', color: 'var(--primary-color)', padding: '0.15rem 0.5rem', borderRadius: '20px', fontWeight: '600' }}>
                      Você
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))}

          {familyMembers.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1rem', textAlign: 'center' }}>
              Nenhum membro encontrado.
            </p>
          )}
        </div>
      </div>

      {/* Card: Meu Perfil & Sair */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.25rem' }}>Meu Perfil</h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <img
            src={user?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.email}`}
            alt={user?.display_name}
            style={{ width: '52px', height: '52px', borderRadius: '50%', border: '2px solid rgba(99,102,241,0.3)', background: '#1e293b' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div>
            <p style={{ fontWeight: '700', fontSize: '1.05rem' }}>{user?.display_name}</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{user?.email}</p>
          </div>
        </div>

        <button
          className="btn btn-danger"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          onClick={signOut}
        >
          <LogOut size={16} />
          Sair da Conta
        </button>
      </div>
    </div>
  );
}
