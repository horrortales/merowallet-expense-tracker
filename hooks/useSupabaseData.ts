import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  date: string;
  category: string;
  type: 'income' | 'expense';
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  monthly_income: number;
  created_at: string;
  updated_at: string;
}

export function useSupabaseData() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setTransactions([]);
      setMonthlyIncome(0);
      setLoading(false);
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error loading profile:', profileError);
      } else if (profile) {
        setMonthlyIncome(profile.monthly_income || 0);
      }

      // Load transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (transactionsError) {
        console.error('Error loading transactions:', transactionsError);
      } else {
        setTransactions(transactionsData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveMonthlyIncome = async (income: number) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          monthly_income: income,
        });

      if (error) {
        console.error('Error saving income:', error);
        return { error };
      }

      setMonthlyIncome(income);
      return { error: null };
    } catch (error) {
      console.error('Error saving income:', error);
      return { error };
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          ...transaction,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding transaction:', error);
        return { error };
      }

      setTransactions(prev => [data, ...prev]);
      return { error: null, data };
    } catch (error) {
      console.error('Error adding transaction:', error);
      return { error };
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating transaction:', error);
        return { error };
      }

      setTransactions(prev => 
        prev.map(t => t.id === id ? data : t)
      );
      return { error: null, data };
    } catch (error) {
      console.error('Error updating transaction:', error);
      return { error };
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting transaction:', error);
        return { error };
      }

      setTransactions(prev => prev.filter(t => t.id !== id));
      return { error: null };
    } catch (error) {
      console.error('Error deleting transaction:', error);
      return { error };
    }
  };

  return {
    transactions,
    monthlyIncome,
    loading,
    saveMonthlyIncome,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refreshData: loadData,
  };
}