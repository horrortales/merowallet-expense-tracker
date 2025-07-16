import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
    const [monthlyIncome, setMonthlyIncome] = useState(0);
    const [showIncomeModal, setShowIncomeModal] = useState(false);
    const [tempIncome, setTempIncome] = useState('');

    const mockUser = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+977 98XXXXXXXX',
        memberSince: 'January 2025',
        avatar: null,
    };

    useEffect(() => {
        loadIncome();
    }, []);

    const loadIncome = async () => {
        try {
            const storedIncome = await AsyncStorage.getItem('monthlyIncome');
            if (storedIncome) {
                setMonthlyIncome(parseFloat(storedIncome));
            }
        } catch (error) {
            console.error('Error loading income:', error);
        }
    };

    const saveIncome = async (income: number) => {
        try {
            await AsyncStorage.setItem('monthlyIncome', income.toString());
        } catch (error) {
            console.error('Error saving income:', error);
        }
    };

    const handleSaveIncome = () => {
        const income = parseFloat(tempIncome);
        if (isNaN(income) || income <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid income amount');
            return;
        }
        setMonthlyIncome(income);
        saveIncome(income);
        setShowIncomeModal(false);
        setTempIncome('');
        Alert.alert('Success', 'Monthly income updated successfully!');
    };

    const formatCurrency = (amount: number) => {
        return `रु ${amount.toLocaleString('en-NP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const menuItems = [
        { id: 1, title: 'Account Settings', icon: 'person-outline', hasArrow: true },
        { id: 2, title: 'Payment Methods', icon: 'card-outline', hasArrow: true },
        { id: 3, title: 'Security', icon: 'shield-outline', hasArrow: true },
        { id: 4, title: 'Notifications', icon: 'notifications-outline', hasArrow: true },
        { id: 5, title: 'Privacy Policy', icon: 'document-text-outline', hasArrow: true },
        { id: 6, title: 'Help & Support', icon: 'help-circle-outline', hasArrow: true },
        { id: 7, title: 'About', icon: 'information-circle-outline', hasArrow: true },
    ];

    const quickStats = [
        { label: 'Total Transactions', value: '247', icon: 'swap-horizontal-outline' },
        { label: 'Active Cards', value: '3', icon: 'card-outline' },
        { label: 'Savings Goals', value: '2', icon: 'trophy-outline' },
    ];

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Profile</Text>
                <TouchableOpacity>
                    <Ionicons name="settings-outline" size={24} color="#007AFF" />
                </TouchableOpacity>
            </View>

            <View style={styles.profileCard}>
                <View style={styles.avatarContainer}>
                    {mockUser.avatar ? (
                        <Image source={{ uri: mockUser.avatar }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Ionicons name="person" size={40} color="#FFFFFF" />
                        </View>
                    )}
                    <TouchableOpacity style={styles.editAvatarButton}>
                        <Ionicons name="camera" size={16} color="#007AFF" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.userName}>{mockUser.name}</Text>
                <Text style={styles.userEmail}>{mockUser.email}</Text>
                <Text style={styles.memberSince}>Member since {mockUser.memberSince}</Text>
            </View>

            {/* Monthly Income Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Financial Settings</Text>
                <TouchableOpacity
                    style={styles.incomeItem}
                    onPress={() => {
                        setTempIncome(monthlyIncome.toString());
                        setShowIncomeModal(true);
                    }}
                >
                    <View style={styles.menuItemLeft}>
                        <View style={styles.menuIcon}>
                            <Ionicons name="wallet-outline" size={20} color="#007AFF" />
                        </View>
                        <View>
                            <Text style={styles.menuTitle}>Monthly Income</Text>
                            <Text style={styles.incomeSubtitle}>
                                {monthlyIncome > 0 ? formatCurrency(monthlyIncome) : 'Not set'}
                            </Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                </TouchableOpacity>
            </View>

            <View style={styles.statsContainer}>
                {quickStats.map((stat, index) => (
                    <View key={index} style={styles.statItem}>
                        <View style={styles.statIcon}>
                            <Ionicons name={stat.icon as keyof typeof Ionicons.glyphMap} size={20} color="#007AFF" />
                        </View>
                        <Text style={styles.statValue}>{stat.value}</Text>
                        <Text style={styles.statLabel}>{stat.label}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account</Text>
                {menuItems.slice(0, 4).map((item) => (
                    <TouchableOpacity key={item.id} style={styles.menuItem}>
                        <View style={styles.menuItemLeft}>
                            <View style={styles.menuIcon}>
                                <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={20} color="#007AFF" />
                            </View>
                            <Text style={styles.menuTitle}>{item.title}</Text>
                        </View>
                        {item.hasArrow && (
                            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Support</Text>
                {menuItems.slice(4).map((item) => (
                    <TouchableOpacity key={item.id} style={styles.menuItem}>
                        <View style={styles.menuItemLeft}>
                            <View style={styles.menuIcon}>
                                <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={20} color="#007AFF" />
                            </View>
                            <Text style={styles.menuTitle}>{item.title}</Text>
                        </View>
                        {item.hasArrow && (
                            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.section}>
                <TouchableOpacity style={styles.logoutButton}>
                    <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
                    <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>MeroWallet v1.0.0</Text>
            </View>

            {/* Income Modal */}
            <Modal
                visible={showIncomeModal}
                transparent={true}
                animationType="slide"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Set Monthly Income</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowIncomeModal(false);
                                    setTempIncome('');
                                }}
                            >
                                <Ionicons name="close" size={24} color="#8E8E93" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.modalDescription}>
                            Set your monthly income to track your budget and expenses effectively.
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter monthly income"
                            value={tempIncome}
                            onChangeText={setTempIncome}
                            keyboardType="numeric"
                            placeholderTextColor="#8E8E93"
                        />
                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={handleSaveIncome}
                        >
                            <Text style={styles.saveButtonText}>Save Income</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 60,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#000',
    },
    profileCard: {
        backgroundColor: '#FFFFFF',
        margin: 20,
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    avatarPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    editAvatarButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#F2F2F7',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 16,
        color: '#8E8E93',
        marginBottom: 8,
    },
    memberSince: {
        fontSize: 14,
        color: '#8E8E93',
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        margin: 20,
        marginTop: 0,
        borderRadius: 16,
        padding: 20,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F2F2F7',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#8E8E93',
        textAlign: 'center',
    },
    section: {
        backgroundColor: '#FFFFFF',
        margin: 20,
        marginTop: 0,
        borderRadius: 16,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#000',
    },
    incomeItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    incomeSubtitle: {
        fontSize: 14,
        color: '#8E8E93',
        marginTop: 2,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F7',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F2F2F7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    menuTitle: {
        fontSize: 16,
        color: '#000',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 8,
    },
    logoutText: {
        fontSize: 16,
        color: '#FF3B30',
        fontWeight: '500',
    },
    footer: {
        alignItems: 'center',
        padding: 20,
    },
    footerText: {
        fontSize: 14,
        color: '#8E8E93',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        width: '90%',
        maxWidth: 400,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
    },
    modalDescription: {
        fontSize: 16,
        color: '#8E8E93',
        marginBottom: 20,
        lineHeight: 22,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E5E5EA',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        marginBottom: 20,
        color: '#000',
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