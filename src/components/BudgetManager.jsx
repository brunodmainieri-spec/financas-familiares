import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { CATEGORIES } from './TransactionManager';
import { Target, Edit2, Check, X, AlertTriangle } from 'lucide-react';

export default function BudgetManager() {
  const { budgets, transactions, updateBudget, loading } = useFinance();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7)); // 'YYYY-MM'
  
  // Estado para controle de edição inline
  const [editingCategory, setEditingCategory] = useState(null);
  const [editLimit, setEditLimit] = useState('');
  const [error, setError] = useState('');

  // Apenas as categorias de despesas são elegíveis para orçamento (removendo salário e investimentos)
  const expenseCategories = CATEGORIES.filter(cat => cat !== 'Salário' && cat !== 'Investimentos');

  const getBudgetLimit = (category) => {
    const budget = budgets.find(b => b.category === category && b.month_year === selectedMonth);
    return budget ? budget.limit_amount : 0;
  };

  const getCategorySpent = (category) => {
    return transactions
      .filter(t => {
        const matchesCategory = t.category === category;
        const matchesType = t.type === 'expense';
        const matchesMonth = t.date.substring(0, 7) === selectedMonth;
        return matchesCategory && matchesType && matchesMonth;
      })
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  };

  const handleStartEdit = (category) => {
    const currentLimit = getBudgetLimit(category);
    setEditingCategory(category);
    setEditLimit(currentLimit > 0 ? currentLimit.toString() : '');
    setError('');
  };

  const handleSave = async (category) => {
    setError('');
    const limitNum = parseFloat(editLimit);
    
    if (isNaN(limitNum) || limitNum < 0) {
      setError('O limite deve ser um número válido igual ou maior que zero.');
      return;
    }

    try {
      await updateBudget(category, limitNum, selectedMonth);
      setEditingCategory(null);
    } catch (err) {
      setError(err.message || 'Erro ao atualizar orçamento.');
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '800', background: 'linear-gradient(to right, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Metas & Orçamentos
        </h2>

        {/* Seletor de Mês */}
        <div className="form-group" style={{ margin: 0 }}>
          <input
            type="month"
            className="form-input"
            style={{ padding: '0.5rem 1rem' }}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', color: '#f43f5e', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {expenseCategories.map(cat => {
          const limit = getBudgetLimit(cat);
          const spent = getCategorySpent(cat);
          const isEditing = editingCategory === cat;
          
          const percent = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
          const isOver = spent > limit && limit > 0;

          return (
            <div key={cat} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: limit > 0 ? `4px solid ${isOver ? 'var(--expense-color)' : 'var(--primary-color)'}` : '1px solid var(--card-border)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--text-title)' }}>{cat}</span>
                
                {isEditing ? (
                  <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: '80px', padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                      value={editLimit}
                      onChange={(e) => setEditLimit(e.target.value)}
                      placeholder="Meta"
                      autoFocus
                    />
                    <button className="btn" style={{ padding: '0.25rem', background: 'var(--income-gradient)', borderRadius: '6px' }} onClick={() => handleSave(cat)}>
                      <Check size={14} style={{ color: 'white' }} />
                    </button>
                    <button className="btn" style={{ padding: '0.25rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', borderRadius: '6px' }} onClick={() => setEditingCategory(null)}>
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn btn-outline"
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', gap: '0.25rem', alignItems: 'center', borderRadius: '6px' }}
                    onClick={() => handleStartEdit(cat)}
                  >
                    <Edit2 size={12} />
                    {limit > 0 ? 'Alterar' : 'Definir Meta'}
                  </button>
                )}
              </div>

              {/* Detalhes Financeiros */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <div>
                  <p>Gasto</p>
                  <p style={{ fontWeight: '700', fontSize: '1rem', color: isOver ? 'var(--expense-color)' : 'var(--text-title)', marginTop: '0.15rem' }}>
                    {formatCurrency(spent)}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p>Meta cadastrada</p>
                  <p style={{ fontWeight: '700', fontSize: '1rem', color: limit > 0 ? 'var(--text-title)' : 'var(--text-muted)', marginTop: '0.15rem' }}>
                    {limit > 0 ? formatCurrency(limit) : 'Nenhuma'}
                  </p>
                </div>
              </div>

              {/* Barra de Progresso */}
              {limit > 0 && (
                <div>
                  <div className="budget-progress-bar">
                    <div
                      className={`budget-progress-fill ${isOver ? 'over-limit' : ''}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    <span style={{ color: isOver ? 'var(--expense-color)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      {isOver && <AlertTriangle size={12} />}
                      {percent}% consumido
                    </span>
                    {spent > limit ? (
                      <span style={{ color: 'var(--expense-color)', fontWeight: '600' }}>Excedido em {formatCurrency(spent - limit)}</span>
                    ) : (
                      <span>Restam {formatCurrency(limit - spent)}</span>
                    )}
                  </div>
                </div>
              )}
              
              {limit === 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '8px', border: '1px dotted var(--card-border)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <Target size={14} />
                  <span>Nenhum limite definido para esta categoria no mês.</span>
                </div>
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
}
