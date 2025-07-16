import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#007AFF',
                tabBarInactiveTintColor: '#9CA3AF',
                tabBarStyle: {
                    backgroundColor: '#FFFFFF',
                    borderTopWidth: 0,
                    elevation: 0,
                    shadowColor: '#000000',
                    shadowOffset: {
                        width: 0,
                        height: -2,
                    },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    height: Platform.OS === 'ios' ? 88 : 100,
                    paddingTop: 8,
                    paddingBottom: Platform.OS === 'ios' ? 28 : 40,
                    paddingHorizontal: 16,
                    marginBottom: Platform.OS === 'android' ? 8 : 0,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    marginTop: 4,
                    letterSpacing: 0.2,
                },
                tabBarIconStyle: {
                    marginTop: 2,
                },
                headerStyle: {
                    backgroundColor: '#FFFFFF',
                },
                headerTintColor: '#000000',
                headerShown: false,
                tabBarHideOnKeyboard: true,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={focused ? 'home' : 'home-outline'}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="expenses"
                options={{
                    title: 'Expenses',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={focused ? 'wallet' : 'wallet-outline'}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="insight"
                options={{
                    title: 'Insights',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={focused ? 'analytics' : 'analytics-outline'}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={focused ? 'person' : 'person-outline'}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}