import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AuthScreen from '../../components/AuthScreen';
import { useAuth } from '../../contexts/AuthContext';
import { Transaction, useSupabaseData } from '../../hooks/useSupabaseData';

export default function HomeScreen() {
    const { user, loading: authLoading } = useAuth();
    const { 
        transactions, 
        monthlyIncome, 
        loading, 
        addTransaction, 
        updateTransaction, 
        deleteTransaction 
    } = useSupabaseData();
    
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [expenseTitle, setExpenseTitle] = useState('');
    const [expenseAmount, setExpenseAmount] = useState('');
    const [expenseCategory, setExpenseCategory] = useState('Food');
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

    const categories = ['Food', 'Transport', 'Entertainment', 'Health', 'Shopping', 'Bills', 'Others'];

    // Show auth screen if user is not authenticated
    if (authLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text>Loading...</Text>
            </View>
        );
    }

    if (!user) {
        return <AuthScreen />;
    }
    const handleAddExpense = async () => {
        const amount = parseFloat(expenseAmount);
        if (!expenseTitle.trim() || isNaN(amount) || amount <= 0) {
            Alert.alert('Invalid Input', 'Please enter valid expense details');
            return;
        }

        if (editingTransaction) {
            // Edit existing transaction
            const { error } = await updateTransaction(editingTransaction.id, {
                title: expenseTitle.trim(),
                amount: amount,
                category: expenseCategory
            });
            
            if (error) {
                Alert.alert('Error', 'Failed to update expense');
                return;
            }
            Alert.alert('Success', 'Expense updated successfully!');
        } else {
            // Add new transaction
            const newTransaction = {
                title: expenseTitle.trim(),
                amount: amount,
                date: new Date().toISOString().split('T')[0],
                category: expenseCategory,
                type: 'expense'
            };

            const { error } = await addTransaction(newTransaction);
            
            if (error) {
                Alert.alert('Error', 'Failed to add expense');
                return;
            }
            Alert.alert('Success', 'Expense added successfully!');
        }

        setShowExpenseModal(false);
        setExpenseTitle('');
        setExpenseAmount('');
        setExpenseCategory('Food');
        setEditingTransaction(null);
    };

    const handleEditExpense = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setExpenseTitle(transaction.title);
        setExpenseAmount(transaction.amount.toString());
        setExpenseCategory(transaction.category);
        setShowExpenseModal(true);
    };

    const handleDeleteExpense = async (transactionId: string) => {
        Alert.alert(
            'Delete Expense',
            'Are you sure you want to delete this expense?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const { error } = await deleteTransaction(transactionId);
                        if (error) {
                            Alert.alert('Error', 'Failed to delete expense');
                        } else {
                            Alert.alert('Success', 'Expense deleted successfully!');
                        }
                    }
                }
            ]
        );
    };

    const formatCurrency = (amount: number) => {
        return `रु ${amount.toLocaleString('en-NP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const calculateBalance = () => {
        const totalExpenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        return monthlyIncome - totalExpenses;
    };

    const getTodayExpenses = () => {
        const today = new Date().toISOString().split('T')[0];
        return transactions
            .filter(t => t.type === 'expense' && t.date === today)
            .reduce((sum, t) => sum + t.amount, 0);
    };

    const getThisMonthExpenses = () => {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        return transactions
            .filter(t => {
                const transactionDate = new Date(t.date);
                return t.type === 'expense' &&
                    transactionDate.getMonth() === currentMonth &&
                    transactionDate.getFullYear() === currentYear;
            })
            .reduce((sum, t) => sum + t.amount, 0);
    };

    const recentTransactions = transactions.slice(0, 4);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Hello</Text>
                    <Text style={styles.subGreeting}>Welcome back</Text>
                </View>
                <TouchableOpacity style={styles.notificationButton}>
                    <Ionicons name="notifications-outline" size={22} color="#1C1C1E" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Balance Overview */}
                <View style={styles.balanceSection}>
                    <Text style={styles.balanceLabel}>Available Balance</Text>
                    <Text style={styles.balanceAmount}>{formatCurrency(calculateBalance())}</Text>
                </View>

                {/* Quick Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Today</Text>
                        <Text style={styles.statAmount}>{formatCurrency(getTodayExpenses())}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>This Month</Text>
                        <Text style={styles.statAmount}>{formatCurrency(getThisMonthExpenses())}</Text>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={styles.primaryAction}
                        onPress={() => setShowExpenseModal(true)}
                    >
                        <Ionicons name="add" size={20} color="#FFFFFF" />
                        <Text style={styles.primaryActionText}>Add Expense</Text>
                    </TouchableOpacity>
                </View>

                {/* Recent Transactions */}
                <View style={styles.transactionsSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Activity</Text>
                        {transactions.length > 4 && (
                            <TouchableOpacity>
                                <Text style={styles.seeAllText}>See All</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {recentTransactions.length === 0 ? (
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIcon}>
                                <Ionicons name="receipt-outline" size={32} color="#8E8E93" />
                            </View>
                            <Text style={styles.emptyText}>No transactions yet</Text>
                            <Text style={styles.emptySubtext}>Start tracking your expenses</Text>
                        </View>
                    ) : (
                        <View style={styles.transactionsList}>
                            {recentTransactions.map((transaction, index) => (
                                <TouchableOpacity
                                    key={transaction.id}
                                    style={[
                                        styles.transactionItem,
                                        index === recentTransactions.length - 1 && styles.lastTransactionItem
                                    ]}
                                    onLongPress={() => handleEditExpense(transaction)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.transactionIcon}>
                                        <Ionicons
                                            name={getCategoryIcon(transaction.category)}
                                            size={18}
                                            color="#007AFF"
                                        />
                                    </View>
                                    <View style={styles.transactionDetails}>
                                        <Text style={styles.transactionTitle}>{transaction.title}</Text>
                                        <Text style={styles.transactionCategory}>{transaction.category}</Text>
                                    </View>
                                    <View style={styles.transactionRight}>
                                        <View style={styles.transactionAmountContainer}>
                                            <Text style={styles.transactionAmount}>
                                                -{formatCurrency(transaction.amount)}
                                            </Text>
                                            <Text style={styles.transactionDate}>
                                                {formatDate(transaction.date)}
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.deleteButton}
                                            onPress={() => handleDeleteExpense(transaction.id)}
                                        >
                                            <Ionicons name="trash" size={16} color="#FF3B30" />
                                        </TouchableOpacity>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Add Expense Modal */}
            <Modal
                visible={showExpenseModal}
                transparent={true}
                animationType="slide"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editingTransaction ? 'Edit Expense' : 'Add Expense'}
                            </Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowExpenseModal(false);
                                    setExpenseTitle('');
                                    setExpenseAmount('');
                                    setExpenseCategory('Food');
                                    setEditingTransaction(null);
                                }}
                            >
                                <Ionicons name="close" size={24} color="#8E8E93" />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="What did you spend on?"
                            value={expenseTitle}
                            onChangeText={setExpenseTitle}
                            placeholderTextColor="#8E8E93"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Amount"
                            value={expenseAmount}
                            onChangeText={setExpenseAmount}
                            keyboardType="numeric"
                            placeholderTextColor="#8E8E93"
                        />

                        <View style={styles.categorySelector}>
                            <Text style={styles.categoryLabel}>Category</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                                {categories.map((category) => (
                                    <TouchableOpacity
                                        key={category}
                                        style={[
                                            styles.categoryChip,
                                            expenseCategory === category && styles.selectedCategoryChip
                                        ]}
                                        onPress={() => setExpenseCategory(category)}
                                    >
                                        <Text style={[
                                            styles.categoryChipText,
                                            expenseCategory === category && styles.selectedCategoryChipText
                                        ]}>
                                            {category}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={handleAddExpense}
                        >
                            <Text style={styles.addButtonText}>
                                {editingTransaction ? 'Update Expense' : 'Add Expense'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

function getCategoryIcon(category: string): keyof typeof Ionicons.glyphMap {
    const icons: { [key: string]: keyof typeof Ionicons.glyphMap } = {
        Food: 'restaurant-outline',
        Transport: 'car-outline',
        Entertainment: 'game-controller-outline',
        Health: 'fitness-outline',
        Shopping: 'bag-outline',
        Bills: 'receipt-outline',
        Others: 'ellipse-outline',
    };
    return icons[category] || 'ellipse-outline';
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 32,
    },
    greeting: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1C1C1E',
        letterSpacing: -0.5,
    },
    subGreeting: {
        fontSize: 16,
        color: '#8E8E93',
        marginTop: 2,
    },
    notificationButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F2F2F7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    balanceSection: {
        paddingHorizontal: 24,
        marginBottom: 32,
    },
    balanceLabel: {
        fontSize: 16,
        color: '#8E8E93',
        marginBottom: 8,
    },
    balanceAmount: {
        fontSize: 36,
        fontWeight: '700',
        color: '#1C1C1E',
        letterSpacing: -1,
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        marginBottom: 32,
        gap: 16,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        padding: 20,
        borderRadius: 16,
    },
    statLabel: {
        fontSize: 14,
        color: '#8E8E93',
        marginBottom: 8,
    },
    statAmount: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    actionsContainer: {
        paddingHorizontal: 24,
        marginBottom: 32,
    },
    primaryAction: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#007AFF',
        paddingVertical: 16,
        borderRadius: 16,
        gap: 8,
    },
    primaryActionText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    transactionsSection: {
        paddingHorizontal: 24,
        paddingBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    seeAllText: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '500',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 48,
    },
    emptyIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#F2F2F7',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1C1C1E',
        marginBottom: 4,
    },
    emptySubtext: {
        fontSize: 16,
        color: '#8E8E93',
    },
    transactionsList: {
        backgroundColor: '#F8F9FA',
        borderRadius: 16,
        padding: 4,
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFFFFF',
        marginBottom: 2,
        borderRadius: 12,
    },
    lastTransactionItem: {
        marginBottom: 0,
    },
    transactionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F2F2F7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    transactionDetails: {
        flex: 1,
    },
    transactionTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1C1C1E',
        marginBottom: 2,
    },
    transactionCategory: {
        fontSize: 14,
        color: '#8E8E93',
    },
    transactionRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    transactionAmountContainer: {
        alignItems: 'flex-end',
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FF3B30',
        marginBottom: 2,
    },
    transactionDate: {
        fontSize: 14,
        color: '#8E8E93',
    },

    deleteButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F2F2F7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    input: {
        borderWidth: 1,
        borderColor: '#E5E5EA',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        marginBottom: 16,
        color: '#1C1C1E',
    },
    categorySelector: {
        marginBottom: 24,
    },
    categoryLabel: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 12,
        color: '#1C1C1E',
    },
    categoryScroll: {
        marginHorizontal: -4,
    },
    categoryChip: {
        backgroundColor: '#F2F2F7',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginHorizontal: 4,
    },
    selectedCategoryChip: {
        backgroundColor: '#007AFF',
    },
    categoryChipText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1C1C1E',
    },
    selectedCategoryChipText: {
        color: '#FFFFFF',
    },
    addButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});