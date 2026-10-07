import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, Trash2, Search, Filter, DollarSign, Calendar, Tag, FileText } from 'lucide-react';

const CATEGORIES = [
  'Alimentação',
  'Moradia',
  'Transporte',
  'Lazer',
  'Saúde',
  'Educação',
  'Salário',
  'Investimentos',
  'Outros'
];

export default function TransactionManager() {
  const { transactions, addTransaction, deleteTransaction, loading } = useFinance();
  const { familyMembers, user } = useAuth();

  // Estados do Formulário
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense'); // 'income' | 'expense'
  const [category, setCategory] = useState('Alimentação');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // Estados dos Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'income' | 'expense'
  const [filterCategory, setFilterCategory] = useState('all');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess(false);

    if (!description.trim()) {
      setFormError('A descrição é obrigatória.');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError('O valor precisa ser maior que zero.');
      return;
    }

    try {
      await addTransaction({
        description,
        amount: numAmount,
        type,
        category,
        date
      });
      // Limpa formulário
      setDescription('');
      setAmount('');
      setFormSuccess(true);
      setTimeout(() => setFormSuccess(false), 3000);
    } catch (err) {
      setFormError(err.message || 'Erro ao adicionar transação.');
    }
  };

  const getMemberName = (userId) => {
    const member = familyMembers.find(m => m.id === userId);
    return member ? member.display_name : 'Membro';
  };

  // Filtragem das transações
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' ? true : t.type === filterType;
    const matchesCategory = filterCategory === 'all' ? true : t.category === filterCategory;
    return matchesSearch && matchesType && matchesCategory;
  });

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <h2 style={{ fontSize: '1.75rem', fontWeight: '800', background: 'linear-gradient(to right, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Gerenciador de Transações
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'start' }}>
        
        {/* Formulário de Lançamento */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PlusCircle size={20} className="text-primary" style={{ color: 'var(--primary-color)' }} />
            Novo Lançamento
          </h3>

          {formError && (
            <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', color: '#f43f5e', padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1rem' }}>
              {formError}
            </div>
          )}

          {formSuccess && (
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Transação lançada com sucesso!
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '1rem', background: 'rgba(15, 23, 42, 0.4)', padding: '0.25rem', borderRadius: '10px', border: '1px solid var(--card-border)' }}>
              <button
                type="button"
                className={`btn ${type === 'expense' ? 'btn-danger' : 'btn-outline'}`}
                style={{ flex: 1, padding: '0.5rem', borderRadius: '8px' }}
                onClick={() => setType('expense')}
              >
                Despesa (-
              </button>
              <button
                type="button"
                className={`btn ${type === 'income' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', background: type === 'income' ? 'var(--income-gradient)' : 'transparent' }}
                onClick={() => setType('income')}
              >
                Receita (+
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Descrição</label>
              <div style={{ position: 'relative' }}>
                <FileText size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem', width: '100%' }}
                  placeholder="Ex: Aluguel, Supermercado, Salário"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Valor (R$)</label>
                <div style={{ position: 'relative' }}>
                  <DollarSign size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    style={{ paddingLeft: '2.5rem', width: '100%' }}
                    placeholder="0,00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Data</label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="date"
                    className="form-input"
                    style={{ paddingLeft: '2.5rem', width: '100%' }}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Categoria</label>
              <div style={{ position: 'relative' }}>
                <Tag size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <select
                  className="form-input"
                  style={{ paddingLeft: '2.5rem', width: '100%', appearance: 'none', background: 'rgba(15, 23, 42, 0.6)' }}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat} style={{ background: '#0d1527' }}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', background: type === 'expense' ? 'var(--expense-gradient)' : 'var(--income-gradient)' }}>
              Confirmar Lançamento
            </button>
          </form>
        </div>

        {/* Lista de Transações */}
        <div className="glass-card" style={{ flex: 2, minHeight: '400px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Histórico</h3>
            
            {/* Campo de Busca */}
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.2rem', paddingRight: '0.5rem', paddingTop: '0.4rem', paddingBottom: '0.4rem', fontSize: '0.85rem', width: '100%' }}
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Filtros */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem', background: 'rgba(0, 0, 0, 0.15)', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '0.5rem' }}>
              <Filter size={14} />
              <span>Filtros:</span>
            </div>

            {/* Tipo */}
            <select
              className="form-input"
              style={{ paddingTop: '0.3rem', paddingBottom: '0.3rem', fontSize: '0.8rem' }}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all" style={{ background: '#0d1527' }}>Todos os tipos</option>
              <option value="income" style={{ background: '#0d1527' }}>Receitas</option>
              <option value="expense" style={{ background: '#0d1527' }}>Despesas</option>
            </select>

            {/* Categoria */}
            <select
              className="form-input"
              style={{ paddingTop: '0.3rem', paddingBottom: '0.3rem', fontSize: '0.8rem' }}
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all" style={{ background: '#0d1527' }}>Todas as categorias</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat} style={{ background: '#0d1527' }}>{cat}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>Carregando transações...</div>
          ) : filteredTransactions.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem', fontSize: '0.95rem' }}>
              Nenhuma transação encontrada para os filtros selecionados.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '500px', overflowY: 'auto', paddingRight: '0.25rem' }}>
              {filteredTransactions.map((t) => (
                <div key={t.id} className="transaction-row">
                  <div className="transaction-left">
                    <span className="category-badge">{t.category}</span>
                    <div className="transaction-meta">
                      <span className="transaction-desc">{t.description}</span>
                      <span className="transaction-sub">
                        <span>{formatDate(t.date)}</span>
                        <span>•</span>
                        <span>Por: {getMemberName(t.user_id)}</span>
                      </span>
                    </div>
                  </div>
                  <div className="transaction-right">
                    <span className={`transaction-amount ${t.type}`}>
                      {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                    </span>
                    <button
                      className="btn"
                      style={{ background: 'transparent', padding: '0.4rem', borderRadius: '8px', color: 'rgba(255,255,255,0.2)' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#f43f5e'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}
                      onClick={() => deleteTransaction(t.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export { CATEGORIES };
