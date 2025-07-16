import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ReceiptScanner from '../../components/ReceiptScanner';

interface Transaction {
    id: string;
    title: string;
    amount: number;
    date: string;
    category: string;
    type: 'income' | 'expense';
}

export default function ExpensesScreen() {
    const [selectedPeriod, setSelectedPeriod] = useState('This Month');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [expenseTitle, setExpenseTitle] = useState('');
    const [expenseAmount, setExpenseAmount] = useState('');
    const [expenseCategory, setExpenseCategory] = useState('Food');
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [showReceiptScanner, setShowReceiptScanner] = useState(false);

    const categories = ['Food', 'Transport', 'Entertainment', 'Health', 'Shopping', 'Bills', 'Others'];

    useFocusEffect(() => {
        loadTransactions();
    });

    const loadTransactions = async () => {
        try {
            const storedTransactions = await AsyncStorage.getItem('transactions');
            if (storedTransactions) {
                setTransactions(JSON.parse(storedTransactions));
            }
        } catch (error) {
            console.error('Error loading transactions:', error);
        }
    };

    const saveTransactions = async (newTransactions: Transaction[]) => {
        try {
            await AsyncStorage.setItem('transactions', JSON.stringify(newTransactions));
        } catch (error) {
            console.error('Error saving transactions:', error);
        }
    };

    const handleAddExpense = () => {
        const amount = parseFloat(expenseAmount);
        if (!expenseTitle.trim() || isNaN(amount) || amount <= 0) {
            Alert.alert('Invalid Input', 'Please enter valid expense details');
            return;
        }

        if (editingTransaction) {
            // Edit existing transaction
            const updatedTransactions = transactions.map(t =>
                t.id === editingTransaction.id
                    ? { ...t, title: expenseTitle.trim(), amount: amount, category: expenseCategory }
                    : t
            );
            setTransactions(updatedTransactions);
            saveTransactions(updatedTransactions);
            Alert.alert('Success', 'Expense updated successfully!');
        } else {
            // Add new transaction
            const newTransaction: Transaction = {
                id: Date.now().toString(),
                title: expenseTitle.trim(),
                amount: amount,
                date: new Date().toISOString().split('T')[0],
                category: expenseCategory,
                type: 'expense'
            };

            const updatedTransactions = [newTransaction, ...transactions];
            setTransactions(updatedTransactions);
            saveTransactions(updatedTransactions);
            Alert.alert('Success', 'Expense added successfully!');
        }

        setShowExpenseModal(false);
        setExpenseTitle('');
        setExpenseAmount('');
        setExpenseCategory('Food');
        setEditingTransaction(null);
    };

    const handleReceiptScanned = (data: { title: string; amount: string; category: string }) => {
        setExpenseTitle(data.title);
        setExpenseAmount(data.amount);
        setExpenseCategory(data.category);
        setShowExpenseModal(true);
    };

    const handleEditExpense = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setExpenseTitle(transaction.title);
        setExpenseAmount(transaction.amount.toString());
        setExpenseCategory(transaction.category);
        setShowExpenseModal(true);
    };

    const handleDeleteExpense = (transactionId: string) => {
        Alert.alert(
            'Delete Expense',
            'Are you sure you want to delete this expense?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        const updatedTransactions = transactions.filter(t => t.id !== transactionId);
                        setTransactions(updatedTransactions);
                        saveTransactions(updatedTransactions);
                        Alert.alert('Success', 'Expense deleted successfully!');
                    }
                }
            ]
        );
    };

    const formatCurrency = (amount: number) => {
        return `रु ${amount.toLocaleString('en-NP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const getCategoryTotals = () => {
        const totals: { [key: string]: number } = {};
        transactions
            .filter(t => t.type === 'expense')
            .forEach(transaction => {
                totals[transaction.category] = (totals[transaction.category] || 0) + transaction.amount;
            });
        return totals;
    };

    const getTotalExpenses = () => {
        return transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
    };

    const categoryTotals = getCategoryTotals();
    const totalExpenses = getTotalExpenses();
    const expenseTransactions = transactions.filter(t => t.type === 'expense');

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Expenses</Text>
                    <Text style={styles.subtitle}>Track your spending</Text>
                </View>
                <View style={styles.headerButtons}>
                    <TouchableOpacity
                        style={styles.scanButton}
                        onPress={() => setShowReceiptScanner(true)}
                    >
                        <Ionicons name="scan" size={20} color="#007AFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => setShowExpenseModal(true)}
                    >
                        <Ionicons name="add" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Total Expenses Overview */}
                <View style={styles.overviewSection}>
                    <Text style={styles.overviewLabel}>Total Expenses</Text>
                    <Text style={styles.overviewAmount}>{formatCurrency(totalExpenses)}</Text>
                    <Text style={styles.overviewPeriod}>{selectedPeriod}</Text>
                </View>

                {/* Period Selector */}
                <View style={styles.periodContainer}>
                    <View style={styles.periodSelector}>
                        {['This Week', 'This Month', 'This Year'].map((period) => (
                            <TouchableOpacity
                                key={period}
                                style={[
                                    styles.periodButton,
                                    selectedPeriod === period && styles.selectedPeriodButton
                                ]}
                                onPress={() => setSelectedPeriod(period)}
                            >
                                <Text style={[
                                    styles.periodText,
                                    selectedPeriod === period && styles.selectedPeriodText
                                ]}>
                                    {period}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Categories Section */}
                {Object.keys(categoryTotals).length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Categories</Text>
                        <View style={styles.categoriesList}>
                            {Object.entries(categoryTotals)
                                .sort(([, a], [, b]) => b - a)
                                .map(([category, amount], index) => (
                                    <View key={category} style={[
                                        styles.categoryItem,
                                        index === Object.entries(categoryTotals).length - 1 && styles.lastCategoryItem
                                    ]}>
                                        <View style={styles.categoryLeft}>
                                            <View style={[styles.categoryIcon, { backgroundColor: getCategoryColor(category) }]}>
                                                <Ionicons name={getCategoryIcon(category)} size={18} color="#FFFFFF" />
                                            </View>
                                            <Text style={styles.categoryName}>{category}</Text>
                                        </View>
                                        <View style={styles.categoryRight}>
                                            <Text style={styles.categoryAmount}>{formatCurrency(amount)}</Text>
                                            <Text style={styles.categoryPercentage}>
                                                {((amount / totalExpenses) * 100).toFixed(0)}%
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                        </View>
                    </View>
                )}

                {/* Recent Expenses */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Expenses</Text>
                        {expenseTransactions.length > 8 && (
                            <TouchableOpacity>
                                <Text style={styles.seeAllText}>See All</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {expenseTransactions.length === 0 ? (
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIcon}>
                                <Ionicons name="receipt-outline" size={32} color="#8E8E93" />
                            </View>
                            <Text style={styles.emptyText}>No expenses yet</Text>
                            <Text style={styles.emptySubtext}>Tap the + button to add your first expense</Text>
                        </View>
                    ) : (
                        <View style={styles.expensesList}>
                            {expenseTransactions.slice(0, 8).map((expense, index) => (
                                <TouchableOpacity
                                    key={expense.id}
                                    style={[
                                        styles.expenseItem,
                                        index === Math.min(expenseTransactions.length, 8) - 1 && styles.lastExpenseItem
                                    ]}
                                    onLongPress={() => handleEditExpense(expense)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.expenseIcon}>
                                        <Ionicons name={getCategoryIcon(expense.category)} size={18} color="#007AFF" />
                                    </View>
                                    <View style={styles.expenseDetails}>
                                        <Text style={styles.expenseTitle}>{expense.title}</Text>
                                        <Text style={styles.expenseCategory}>{expense.category}</Text>
                                    </View>
                                    <View style={styles.expenseRight}>
                                        <View style={styles.expenseAmountContainer}>
                                            <Text style={styles.expenseAmount}>{formatCurrency(expense.amount)}</Text>
                                            <Text style={styles.expenseDate}>{formatDate(expense.date)}</Text>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.deleteButton}
                                            onPress={() => handleDeleteExpense(expense.id)}
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
                            style={styles.saveButton}
                            onPress={handleAddExpense}
                        >
                            <Text style={styles.saveButtonText}>Add Expense</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Receipt Scanner Modal */}
            <ReceiptScanner
                visible={showReceiptScanner}
                onClose={() => setShowReceiptScanner(false)}
                onReceiptScanned={handleReceiptScanned}
            />
        </View>
    );
}

function getCategoryColor(category: string): string {
    const colors: { [key: string]: string } = {
        Food: '#FF9500',
        Transport: '#007AFF',
        Entertainment: '#AF52DE',
        Health: '#34C759',
        Shopping: '#FF3B30',
        Bills: '#5856D6',
        Others: '#8E8E93',
    };
    return colors[category] || '#8E8E93';
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
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1C1C1E',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: '#8E8E93',
        marginTop: 2,
    },
    headerButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    scanButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F2F2F7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    overviewSection: {
        paddingHorizontal: 24,
        marginBottom: 32,
    },
    overviewLabel: {
        fontSize: 16,
        color: '#8E8E93',
        marginBottom: 8,
    },
    overviewAmount: {
        fontSize: 36,
        fontWeight: '700',
        color: '#FF3B30',
        letterSpacing: -1,
        marginBottom: 4,
    },
    overviewPeriod: {
        fontSize: 16,
        color: '#8E8E93',
    },
    periodContainer: {
        paddingHorizontal: 24,
        marginBottom: 32,
    },
    periodSelector: {
        flexDirection: 'row',
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 4,
    },
    periodButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
    },
    selectedPeriodButton: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    periodText: {
        fontSize: 14,
        color: '#8E8E93',
        fontWeight: '500',
    },
    selectedPeriodText: {
        color: '#1C1C1E',
        fontWeight: '600',
    },
    section: {
        paddingHorizontal: 24,
        marginBottom: 32,
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
    categoriesList: {
        backgroundColor: '#F8F9FA',
        borderRadius: 16,
        padding: 4,
    },
    categoryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFFFFF',
        marginBottom: 2,
        borderRadius: 12,
    },
    lastCategoryItem: {
        marginBottom: 0,
    },
    categoryLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    categoryIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    categoryName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1C1C1E',
    },
    categoryRight: {
        alignItems: 'flex-end',
    },
    categoryAmount: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1C1C1E',
        marginBottom: 2,
    },
    categoryPercentage: {
        fontSize: 14,
        color: '#8E8E93',
    },
    expensesList: {
        backgroundColor: '#F8F9FA',
        borderRadius: 16,
        padding: 4,
    },
    expenseItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFFFFF',
        marginBottom: 2,
        borderRadius: 12,
    },
    lastExpenseItem: {
        marginBottom: 0,
    },
    expenseIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F2F2F7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    expenseDetails: {
        flex: 1,
    },
    expenseTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1C1C1E',
        marginBottom: 2,
    },
    expenseCategory: {
        fontSize: 14,
        color: '#8E8E93',
    },
    expenseRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    expenseAmountContainer: {
        alignItems: 'flex-end',
    },
    expenseAmount: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FF3B30',
        marginBottom: 2,
    },
    expenseDate: {
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
    saveButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});