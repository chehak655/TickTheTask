import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import LoadingIndicator from '../components/LoadingIndicator';

// Auth Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// Main Screens
import DashboardScreen from '../screens/DashboardScreen';
import TasksScreen from '../screens/TasksScreen';
import CalendarScreen from '../screens/CalendarScreen';
import AddTaskScreen from '../screens/AddTaskScreen';
import EditTaskScreen from '../screens/EditTaskScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: {
          backgroundColor: colors.headerBg,
        },
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 18,
          color: colors.headerText,
        },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: colors.tabBg,
          borderTopColor: colors.tabBorder,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          if (route.name === 'DashboardTab') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'TasksTab') {
            iconName = focused ? 'checkbox' : 'checkbox-outline';
          } else if (route.name === 'CalendarTab') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{ title: 'Dashboard', tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen
        name="TasksTab"
        component={TasksScreen}
        options={{ title: 'Tasks', tabBarLabel: 'Tasks' }}
      />
      <Tab.Screen
        name="CalendarTab"
        component={CalendarScreen}
        options={{ title: 'Calendar', tabBarLabel: 'Calendar' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: 'Profile', tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors } = useTheme();

  if (isLoading) {
    return <LoadingIndicator message="Starting TickTheTask..." />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        // Auth Stack
        <Stack.Group>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Group>
      ) : (
        // Main Stack
        <Stack.Group>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen
            name="AddTask"
            component={AddTaskScreen}
            options={{
              headerShown: true,
              title: 'Add New Task',
              presentation: 'modal',
              headerStyle: { backgroundColor: colors.headerBg },
              headerTintColor: colors.headerText,
              headerTitleStyle: { fontWeight: '700', color: colors.headerText },
            }}
          />
          <Stack.Screen
            name="EditTask"
            component={EditTaskScreen}
            options={{
              headerShown: true,
              title: 'Edit Task',
              presentation: 'modal',
              headerStyle: { backgroundColor: colors.headerBg },
              headerTintColor: colors.headerText,
              headerTitleStyle: { fontWeight: '700', color: colors.headerText },
            }}
          />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}
