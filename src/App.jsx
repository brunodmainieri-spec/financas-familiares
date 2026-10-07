import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import TransactionManager from './components/TransactionManager';
import BudgetManager from './components/BudgetManager';
import FamilySettings from './components/FamilySettings';
import { LayoutDashboard, ArrowRightLeft, Target, Settings, Users } from 'lucide-react';
import './index.css';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'transactions', label: 'Transações', Icon: ArrowRightLeft },
  { id: 'budgets', label: 'Orçamentos', Icon: Target },
  { id: 'settings', label: 'Configurações', Icon: Settings },
];

function AppContent() {
  const { user, family, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{
          width: '48px', height: '48px',
          border: '3px solid rgba(99, 102, 241, 0.15)',
          borderTop: '3px solid #6366f1',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Carregando...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Se não está logado, ou se está logado mas sem família → mostra a tela de Auth
  if (!user || !user.family_id) {
    return <Auth />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'transactions': return <TransactionManager />;
      case 'budgets': return <BudgetManager />;
      case 'settings': return <FamilySettings />;
      default: return <Dashboard />;
    }
  };

  return (
    <FinanceProvider>
      <div className="app-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="logo-container">
            <div className="logo-icon">
              <Users size={18} />
            </div>
            <span className="logo-text">FamFinances</span>
          </div>

          <nav className="nav-links">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                id={`nav-${id}`}
                className={`nav-button ${activeTab === id ? 'active' : ''}`}
                onClick={() => setActiveTab(id)}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </nav>

          {/* Rodapé da Sidebar: info do usuário */}
          <div style={{ marginTop: 'auto', borderTop: '1px solid var(--card-border)', paddingTop: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <img
                src={user?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.email}`}
                alt={user?.display_name}
                style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.08)', background: '#1e293b', flexShrink: 0 }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div style={{ overflow: 'hidden' }}>
                <p style={{ fontWeight: '600', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.display_name}
                </p>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {family?.name}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {renderContent()}
        </main>
      </div>
    </FinanceProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
