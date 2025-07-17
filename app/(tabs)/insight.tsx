import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';

import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AuthScreen from '../../components/AuthScreen';
import { useAuth } from '../../contexts/AuthContext';
import { Transaction, useSupabaseData } from '../../hooks/useSupabaseData';

const { width } = Dimensions.get('window');


export default function InsightScreen() {
    const { user, loading: authLoading } = useAuth();
    const { transactions, monthlyIncome, loading } = useSupabaseData();
    
    const [selectedPeriod, setSelectedPeriod] = useState('This Month');

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
    const formatCurrency = (amount: number) => {
        return `रु ${amount.toLocaleString('en-NP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const getTotalExpenses = () => {
        return transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
    };

    const getCurrentBalance = () => {
        return monthlyIncome - getTotalExpenses();
    };

    const getSavingsRate = () => {
        if (monthlyIncome === 0) return 0;
        return ((getCurrentBalance() / monthlyIncome) * 100);
    };

    const getCategoryBreakdown = () => {
        const breakdown: { [key: string]: { amount: number; percentage: number; color: string } } = {};
        const totalExpenses = getTotalExpenses();

        transactions
            .filter(t => t.type === 'expense')
            .forEach(transaction => {
                if (!breakdown[transaction.category]) {
                    breakdown[transaction.category] = {
                        amount: 0,
                        percentage: 0,
                        color: getCategoryColor(transaction.category)
                    };
                }
                breakdown[transaction.category].amount += transaction.amount;
            });

        // Calculate percentages
        Object.keys(breakdown).forEach(category => {
            breakdown[category].percentage = totalExpenses > 0
                ? (breakdown[category].amount / totalExpenses) * 100
                : 0;
        });

        return Object.entries(breakdown)
            .sort(([, a], [, b]) => b.amount - a.amount)
            .slice(0, 6);
    };

    const getMonthlyTrend = () => {
        const monthlyData: { [key: string]: { income: number; expenses: number } } = {};

        // Get last 4 months
        for (let i = 3; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
            const monthName = date.toLocaleDateString('en-US', { month: 'short' });

            monthlyData[monthName] = {
                income: monthlyIncome,
                expenses: 0
            };

            // Calculate expenses for this month
            transactions
                .filter(t => t.type === 'expense' && t.date.startsWith(monthKey))
                .forEach(t => {
                    monthlyData[monthName].expenses += t.amount;
                });
        }

        return Object.entries(monthlyData);
    };

    const totalExpenses = getTotalExpenses();
    const currentBalance = getCurrentBalance();
    const savingsRate = getSavingsRate();
    const categoryBreakdown = getCategoryBreakdown();
    const monthlyTrend = getMonthlyTrend();

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Insights</Text>
                    <Text style={styles.subtitle}>Your financial overview</Text>
                </View>
                <TouchableOpacity style={styles.calendarButton}>
                    <Ionicons name="calendar-outline" size={20} color="#007AFF" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
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

                {/* Financial Overview Cards */}
                <View style={styles.overviewCards}>
                    <View style={[styles.overviewCard, { backgroundColor: '#34C759' }]}>
                        <Text style={styles.cardLabel}>Income</Text>
                        <Text style={styles.cardAmount}>{formatCurrency(monthlyIncome)}</Text>
                    </View>
                    <View style={[styles.overviewCard, { backgroundColor: '#FF3B30' }]}>
                        <Text style={styles.cardLabel}>Expenses</Text>
                        <Text style={styles.cardAmount}>{formatCurrency(totalExpenses)}</Text>
                    </View>
                </View>

                {/* Savings Overview */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Savings Overview</Text>
                    <View style={styles.savingsCard}>
                        <View style={styles.savingsHeader}>
                            <Text style={styles.savingsAmount}>{formatCurrency(currentBalance)}</Text>
                            <Text style={styles.savingsLabel}>Available Balance</Text>
                        </View>
                        <View style={styles.savingsRate}>
                            <Text style={styles.savingsRateText}>
                                {savingsRate.toFixed(1)}% savings rate
                            </Text>
                            <View style={styles.progressBar}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        { width: `${Math.min(Math.max(savingsRate, 0), 100)}%` }
                                    ]}
                                />
                            </View>
                        </View>
                    </View>
                </View>

                {/* Spending Breakdown */}
                {categoryBreakdown.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Spending Breakdown</Text>
                        <View style={styles.breakdownList}>
                            {categoryBreakdown.map(([category, data], index) => (
                                <View key={category} style={[
                                    styles.breakdownItem,
                                    index === categoryBreakdown.length - 1 && styles.lastBreakdownItem
                                ]}>
                                    <View style={styles.breakdownLeft}>
                                        <View style={[styles.categoryDot, { backgroundColor: data.color }]} />
                                        <Text style={styles.breakdownCategory}>{category}</Text>
                                    </View>
                                    <View style={styles.breakdownRight}>
                                        <Text style={styles.breakdownAmount}>{formatCurrency(data.amount)}</Text>
                                        <Text style={styles.breakdownPercentage}>{data.percentage.toFixed(0)}%</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Monthly Trend */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Monthly Trend</Text>
                    <View style={styles.chartContainer}>
                        <View style={styles.chart}>
                            {monthlyTrend.map(([month, data], index) => {
                                const maxAmount = Math.max(monthlyIncome, ...monthlyTrend.map(([, d]) => d.expenses));
                                const incomeHeight = maxAmount > 0 ? (data.income / maxAmount) * 120 : 0;
                                const expenseHeight = maxAmount > 0 ? (data.expenses / maxAmount) * 120 : 0;

                                return (
                                    <View key={month} style={styles.chartBar}>
                                        <View style={styles.barContainer}>
                                            <View
                                                style={[
                                                    styles.incomeBar,
                                                    { height: incomeHeight }
                                                ]}
                                            />
                                            <View
                                                style={[
                                                    styles.expenseBar,
                                                    { height: expenseHeight }
                                                ]}
                                            />
                                        </View>
                                        <Text style={styles.monthLabel}>{month}</Text>
                                    </View>
                                );
                            })}
                        </View>
                        <View style={styles.legend}>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: '#34C759' }]} />
                                <Text style={styles.legendText}>Income</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: '#FF3B30' }]} />
                                <Text style={styles.legendText}>Expenses</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Quick Stats */}
                {transactions.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Quick Stats</Text>
                        <View style={styles.statsGrid}>
                            <View style={styles.statCard}>
                                <Text style={styles.statValue}>{transactions.filter(t => t.type === 'expense').length}</Text>
                                <Text style={styles.statLabel}>Total Transactions</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Text style={styles.statValue}>
                                    {formatCurrency(totalExpenses / Math.max(transactions.filter(t => t.type === 'expense').length, 1))}
                                </Text>
                                <Text style={styles.statLabel}>Avg. per Transaction</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Empty State */}
                {transactions.length === 0 && (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIcon}>
                            <Ionicons name="analytics-outline" size={32} color="#8E8E93" />
                        </View>
                        <Text style={styles.emptyText}>No data to analyze</Text>
                        <Text style={styles.emptySubtext}>Start adding expenses to see insights</Text>
                    </View>
                )}
            </ScrollView>
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
    calendarButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F2F2F7',
        justifyContent: 'center',
        alignItems: 'center',
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
    overviewCards: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        marginBottom: 32,
        gap: 16,
    },
    overviewCard: {
        flex: 1,
        padding: 20,
        borderRadius: 16,
    },
    cardLabel: {
        color: '#FFFFFF',
        fontSize: 14,
        opacity: 0.9,
        marginBottom: 4,
    },
    cardAmount: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
    },
    section: {
        paddingHorizontal: 24,
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1C1C1E',
        marginBottom: 20,
    },
    savingsCard: {
        backgroundColor: '#F8F9FA',
        borderRadius: 16,
        padding: 20,
    },
    savingsHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    savingsAmount: {
        fontSize: 32,
        fontWeight: '700',
        color: '#007AFF',
        letterSpacing: -1,
        marginBottom: 4,
    },
    savingsLabel: {
        fontSize: 16,
        color: '#8E8E93',
    },
    savingsRate: {
        alignItems: 'center',
    },
    savingsRateText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1C1C1E',
        marginBottom: 12,
    },
    progressBar: {
        width: '100%',
        height: 8,
        backgroundColor: '#E5E5EA',
        borderRadius: 4,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#007AFF',
        borderRadius: 4,
    },
    breakdownList: {
        backgroundColor: '#F8F9FA',
        borderRadius: 16,
        padding: 4,
    },
    breakdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFFFFF',
        marginBottom: 2,
        borderRadius: 12,
    },
    lastBreakdownItem: {
        marginBottom: 0,
    },
    breakdownLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    categoryDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 12,
    },
    breakdownCategory: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1C1C1E',
    },
    breakdownRight: {
        alignItems: 'flex-end',
    },
    breakdownAmount: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1C1C1E',
        marginBottom: 2,
    },
    breakdownPercentage: {
        fontSize: 14,
        color: '#8E8E93',
    },
    chartContainer: {
        backgroundColor: '#F8F9FA',
        borderRadius: 16,
        padding: 20,
    },
    chart: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        height: 140,
        marginBottom: 20,
    },
    chartBar: {
        alignItems: 'center',
    },
    barContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 4,
        marginBottom: 8,
    },
    incomeBar: {
        width: 12,
        backgroundColor: '#34C759',
        borderRadius: 6,
        minHeight: 4,
    },
    expenseBar: {
        width: 12,
        backgroundColor: '#FF3B30',
        borderRadius: 6,
        minHeight: 4,
    },
    monthLabel: {
        fontSize: 12,
        color: '#8E8E93',
        fontWeight: '500',
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        fontSize: 14,
        color: '#8E8E93',
        fontWeight: '500',
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 16,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1C1C1E',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
        color: '#8E8E93',
        textAlign: 'center',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 48,
        paddingHorizontal: 24,
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
        textAlign: 'center',
    },
});