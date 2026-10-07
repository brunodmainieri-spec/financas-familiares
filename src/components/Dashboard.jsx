import React, { useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#f97316'];

const formatCurrency = (val) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(13, 21, 39, 0.92)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
        padding: '0.85rem 1.1rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        fontSize: '0.85rem',
      }}>
        {label && <p style={{ color: '#94a3b8', marginBottom: '0.5rem', fontWeight: '600' }}>{label}</p>}
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color, fontWeight: '700' }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(13, 21, 39, 0.92)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
        padding: '0.75rem 1rem',
        fontSize: '0.85rem',
      }}>
        <p style={{ color: payload[0].payload.fill, fontWeight: '700' }}>{payload[0].name}</p>
        <p style={{ color: '#e2e8f0' }}>{formatCurrency(payload[0].value)}</p>
        <p style={{ color: '#94a3b8' }}>{payload[0].payload.percent}% do total</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { transactions, budgets, loading } = useFinance();
  const { family, familyMembers } = useAuth();

  // ────── Cálculos do Mês Atual ──────
  const currentMonthYear = new Date().toISOString().substring(0, 7);

  const { totalIncome, totalExpense, balance } = useMemo(() => {
    const currentMonthTrans = transactions.filter(t => t.date.substring(0, 7) === currentMonthYear);
    const totalIncome = currentMonthTrans.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
    const totalExpense = currentMonthTrans.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);
    return { totalIncome, totalExpense, balance: totalIncome - totalExpense };
  }, [transactions, currentMonthYear]);

  // ────── Gráfico 1: Evolução Mensal (últimos 6 meses) ──────
  const monthlyData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().substring(0, 7);
      const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      const income = transactions.filter(t => t.type === 'income' && t.date.startsWith(key)).reduce((s, t) => s + parseFloat(t.amount), 0);
      const expense = transactions.filter(t => t.type === 'expense' && t.date.startsWith(key)).reduce((s, t) => s + parseFloat(t.amount), 0);
      months.push({ label, income, expense });
    }
    return months;
  }, [transactions]);

  // ────── Gráfico 2: Distribuição por Categoria ──────
  const categoryData = useMemo(() => {
    const currentMonthExpenses = transactions.filter(t => t.type === 'expense' && t.date.startsWith(currentMonthYear));
    const totalExp = currentMonthExpenses.reduce((s, t) => s + parseFloat(t.amount), 0);
    const grouped = {};
    currentMonthExpenses.forEach(t => {
      grouped[t.category] = (grouped[t.category] || 0) + parseFloat(t.amount);
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({
        name,
        value,
        percent: totalExp > 0 ? Math.round((value / totalExp) * 100) : 0
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, currentMonthYear]);

  // ────── Gráfico 3: Histórico de Saldo Acumulado ──────
  const balanceHistory = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    let accumulated = 0;
    const monthMap = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().substring(0, 7);
      monthMap[key] = { label: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }), saldo: 0 };
    }
    sorted.forEach(t => {
      const key = t.date.substring(0, 7);
      if (monthMap[key] !== undefined) {
        accumulated += t.type === 'income' ? parseFloat(t.amount) : -parseFloat(t.amount);
        monthMap[key].saldo = accumulated;
      }
    });
    // Propaga o saldo acumulado entre os meses
    let prev = 0;
    return Object.values(monthMap).map(m => {
      if (m.saldo === 0 && prev !== 0) m.saldo = prev;
      prev = m.saldo;
      return m;
    });
  }, [transactions]);

  // ────── Gráfico 4: Gastos por Membro da Família (6 meses) ──────
  const memberSpendingData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().substring(0, 7);
      const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      const entry = { label };
      familyMembers.forEach(member => {
        entry[member.id] = transactions
          .filter(t => t.type === 'expense' && t.user_id === member.id && t.date.startsWith(key))
          .reduce((s, t) => s + parseFloat(t.amount), 0);
      });
      months.push(entry);
    }
    return months;
  }, [transactions, familyMembers]);

  // ────── Gráfico 5: Progresso de Metas ──────
  const budgetProgress = useMemo(() => {
    const currentBudgets = budgets.filter(b => b.month_year === currentMonthYear);
    return currentBudgets.map(b => {
      const spent = transactions
        .filter(t => t.type === 'expense' && t.category === b.category && t.date.startsWith(currentMonthYear))
        .reduce((s, t) => s + parseFloat(t.amount), 0);
      const percent = b.limit_amount > 0 ? Math.min(100, Math.round((spent / b.limit_amount) * 100)) : 0;
      return { category: b.category, limit: b.limit_amount, spent, percent, isOver: spent > b.limit_amount };
    });
  }, [budgets, transactions, currentMonthYear]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', color: 'var(--text-muted)' }}>
        Carregando dados...
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Cabeçalho */}
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '800', background: 'linear-gradient(to right, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Dashboard
        </h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          {family?.name} · {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Cartões de Resumo */}
      <div className="summary-grid">
        {[
          { label: 'Saldo do Mês', value: balance, gradient: balance >= 0 ? 'var(--income-gradient)' : 'var(--expense-gradient)', Icon: DollarSign, sign: balance >= 0 ? '' : '' },
          { label: 'Receitas', value: totalIncome, gradient: 'var(--income-gradient)', Icon: TrendingUp, sign: '+' },
          { label: 'Despesas', value: totalExpense, gradient: 'var(--expense-gradient)', Icon: TrendingDown, sign: '-' },
          { label: 'Metas Ativas', value: budgetProgress.length, gradient: 'var(--budget-gradient)', Icon: Target, isMeta: true },
        ].map(({ label, value, gradient, Icon, sign, isMeta }) => (
          <div key={label} className="glass-card summary-card">
            <div className="summary-details">
              <h4>{label}</h4>
              <p style={{ color: isMeta ? '#a855f7' : value >= 0 ? '#10b981' : '#f43f5e', fontWeight: '800' }}>
                {isMeta ? `${value} categoria${value !== 1 ? 's' : ''}` : formatCurrency(value)}
              </p>
            </div>
            <div className="summary-icon" style={{ background: gradient }}>
              <Icon size={22} color="white" />
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos: Grid de 2x2 */}
      <div className="charts-grid">

        {/* 1. Barras: Receitas vs Despesas Mensais */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--text-title)' }}>
            Receitas vs Despesas (6 meses)
          </h3>
          {monthlyData.every(m => m.income === 0 && m.expense === 0) ? (
            <EmptyState label="Nenhuma transação nos últimos 6 meses." />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Legend wrapperStyle={{ fontSize: '0.8rem', color: '#94a3b8', paddingTop: '1rem' }} />
                <Bar dataKey="income" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Despesas" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 2. Pizza: Distribuição por Categoria */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--text-title)' }}>
            Despesas por Categoria (Mês Atual)
          </h3>
          {categoryData.length === 0 ? (
            <EmptyState label="Nenhuma despesa lançada este mês." />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '0.78rem', color: '#94a3b8' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 3. Área: Histórico de Saldo Acumulado */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--text-title)' }}>
            Histórico de Saldo Acumulado
          </h3>
          {balanceHistory.every(m => m.saldo === 0) ? (
            <EmptyState label="Nenhum dado de saldo disponível ainda." />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={balanceHistory} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="saldoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="saldo"
                  name="Saldo"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fill="url(#saldoGrad)"
                  dot={{ fill: '#6366f1', r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#a5b4fc', strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 4. Progresso de Metas */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--text-title)' }}>
            Progresso de Metas do Mês
          </h3>
          {budgetProgress.length === 0 ? (
            <EmptyState label="Nenhuma meta definida para este mês." hint="Acesse 'Orçamentos' para configurar metas por categoria." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', maxHeight: '230px', paddingRight: '0.25rem' }}>
              {budgetProgress.map(({ category, limit, spent, percent, isOver }) => (
                <div key={category}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: '600' }}>{category}</span>
                    <span style={{ color: isOver ? '#f43f5e' : '#94a3b8', fontWeight: isOver ? '700' : '400' }}>
                      {formatCurrency(spent)} / {formatCurrency(limit)}
                    </span>
                  </div>
                  <div className="budget-progress-bar">
                    <div
                      className={`budget-progress-fill ${isOver ? 'over-limit' : ''}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p style={{ fontSize: '0.7rem', color: isOver ? '#f43f5e' : '#64748b', marginTop: '0.2rem', textAlign: 'right' }}>
                    {isOver ? `Excedido em ${formatCurrency(spent - limit)}` : `${percent}% utilizado`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5. Barras: Gastos por Membro da Família ao Longo do Tempo */}
        <div className="glass-card" style={{ padding: '1.5rem', gridColumn: '1 / -1' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--text-title)' }}>
            Gastos por Membro da Família (6 meses)
          </h3>
          {familyMembers.length === 0 || memberSpendingData.every(m => familyMembers.every(member => !m[member.id])) ? (
            <EmptyState label="Nenhuma despesa registrada pelos membros da família ainda." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={memberSpendingData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Legend wrapperStyle={{ fontSize: '0.8rem', color: '#94a3b8', paddingTop: '1rem' }} />
                {familyMembers.map((member, index) => (
                  <Bar
                    key={member.id}
                    dataKey={member.id}
                    name={member.display_name}
                    fill={COLORS[index % COLORS.length]}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ label, hint }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '200px', color: 'var(--text-muted)', gap: '0.5rem', fontSize: '0.875rem', textAlign: 'center', padding: '1rem'
    }}>
      <p>{label}</p>
      {hint && <p style={{ fontSize: '0.78rem', opacity: 0.7 }}>{hint}</p>}
    </div>
  );
}
