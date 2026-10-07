import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isMockEnabled } from '../supabaseClient';
import { useAuth } from './AuthContext';

const FinanceContext = createContext();

export function useFinance() {
  return useContext(FinanceContext);
}

export function FinanceProvider({ children }) {
  const { user, family } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  // MOCK LOGIC FOR LOCAL STORAGE
  const getMockData = (key, defaultVal = []) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultVal;
  };

  const saveMockData = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  // Carregar transações e orçamentos sempre que a família mudar
  useEffect(() => {
    if (!family) {
      setTransactions([]);
      setBudgets([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    if (isMockEnabled) {
      loadMockFinanceData();
    } else {
      loadSupabaseFinanceData();

      // Configurar subscrição Realtime no Supabase
      // Escutar mudanças nas transações da família
      const transactionChannel = supabase
        .channel('realtime-transactions')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'transactions',
            filter: `family_id=eq.${family.id}`
          },
          () => {
            loadSupabaseFinanceData();
          }
        )
        .subscribe();

      // Escutar mudanças nos orçamentos
      const budgetChannel = supabase
        .channel('realtime-budgets')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'budgets',
            filter: `family_id=eq.${family.id}`
          },
          () => {
            loadSupabaseFinanceData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(transactionChannel);
        supabase.removeChannel(budgetChannel);
      };
    }
  }, [family]);

  // Carrega dados financeiros em modo MOCK
  const loadMockFinanceData = () => {
    if (!family) return;
    const allTrans = getMockData('mock_transactions');
    const familyTrans = allTrans.filter(t => t.family_id === family.id);
    // Ordena da mais recente para a mais antiga
    familyTrans.sort((a, b) => new Date(b.date) - new Date(a.date));
    setTransactions(familyTrans);

    const allBudgets = getMockData('mock_budgets');
    const familyBudgets = allBudgets.filter(b => b.family_id === family.id);
    setBudgets(familyBudgets);

    setLoading(false);
  };

  // Carrega dados do Supabase
  const loadSupabaseFinanceData = async () => {
    if (!family) return;
    try {
      // 1. Carrega Transações
      const { data: transData, error: transError } = await supabase
        .from('transactions')
        .select('*')
        .eq('family_id', family.id)
        .order('date', { ascending: false });

      if (transError) throw transError;
      setTransactions(transData || []);

      // 2. Carrega Orçamentos
      const { data: budgetsData, error: budgetsError } = await supabase
        .from('budgets')
        .select('*')
        .eq('family_id', family.id);

      if (budgetsError) throw budgetsError;
      setBudgets(budgetsData || []);

    } catch (err) {
      console.error('Erro ao carregar dados financeiros:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mutação: Adicionar Transação
  const addTransaction = async (trans) => {
    if (!family || !user) throw new Error('Não autenticado ou sem grupo familiar.');

    const newTrans = {
      amount: parseFloat(trans.amount),
      type: trans.type,
      category: trans.category,
      description: trans.description,
      date: trans.date || new Date().toISOString().split('T')[0]
    };

    if (isMockEnabled) {
      const allTrans = getMockData('mock_transactions');
      const transactionRecord = {
        id: crypto.randomUUID(),
        family_id: family.id,
        user_id: user.id,
        ...newTrans,
        created_at: new Date().toISOString()
      };
      allTrans.push(transactionRecord);
      saveMockData('mock_transactions', allTrans);
      
      // Força a recarga local do estado
      loadMockFinanceData();
      return transactionRecord;
    } else {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          family_id: family.id,
          user_id: user.id,
          ...newTrans
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  };

  // Mutação: Deletar Transação
  const deleteTransaction = async (id) => {
    if (isMockEnabled) {
      const allTrans = getMockData('mock_transactions');
      const filteredTrans = allTrans.filter(t => t.id !== id);
      saveMockData('mock_transactions', filteredTrans);
      loadMockFinanceData();
    } else {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    }
  };

  // Mutação: Configurar/Atualizar Orçamento
  const updateBudget = async (category, limitAmount, monthYear) => {
    if (!family) throw new Error('Sem grupo familiar configurado.');

    const budgetData = {
      family_id: family.id,
      category,
      limit_amount: parseFloat(limitAmount),
      month_year: monthYear
    };

    if (isMockEnabled) {
      const allBudgets = getMockData('mock_budgets');
      const index = allBudgets.findIndex(
        b => b.family_id === family.id && b.category === category && b.month_year === monthYear
      );

      if (index >= 0) {
        allBudgets[index].limit_amount = parseFloat(limitAmount);
      } else {
        allBudgets.push({
          id: crypto.randomUUID(),
          ...budgetData,
          created_at: new Date().toISOString()
        });
      }
      saveMockData('mock_budgets', allBudgets);
      loadMockFinanceData();
      return budgetData;
    } else {
      // Tenta fazer upsert do orçamento
      // Supabase não tem RLS facilitado para upsert sem índices e privilégios específicos de conflito,
      // então primeiro tentamos verificar se já existe, se sim atualizamos, se não inserimos.
      const { data: existing } = await supabase
        .from('budgets')
        .select('*')
        .eq('family_id', family.id)
        .eq('category', category)
        .eq('month_year', monthYear)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('budgets')
          .update({ limit_amount: parseFloat(limitAmount) })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('budgets')
          .insert([budgetData]);
        if (error) throw error;
      }
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        budgets,
        loading,
        addTransaction,
        deleteTransaction,
        updateBudget
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}
