import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

/**
 * You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
 */
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: 'var(--color-primary)', // Using the CSS variable
        tabBarInactiveTintColor: 'var(--color-text-muted-light)',
        tabBarStyle: {
          backgroundColor:
            colorScheme === 'dark'
              ? 'var(--color-bg-dark)'
              : 'var(--color-bg-light)',
          borderTopColor: colorScheme === 'dark' ? '#374151' : '#E2E8F0',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: 'var(--color-primary)',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabBarIcon name='home' color={color} />,
          headerTitle: 'DUS Exam App',
        }}
      />

      <Tabs.Screen
        name='courses'
        options={{
          title: 'Courses',
          tabBarIcon: ({ color }) => <TabBarIcon name='book' color={color} />,
        }}
      />

      <Tabs.Screen
        name='tests'
        options={{
          title: 'Tests',
          tabBarIcon: ({ color }) => (
            <TabBarIcon name='question-circle' color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name='duels'
        options={{
          title: 'Duels',
          tabBarIcon: ({ color }) => <TabBarIcon name='trophy' color={color} />,
        }}
      />

      <Tabs.Screen
        name='profile'
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabBarIcon name='user' color={color} />,
        }}
      />
    </Tabs>
  );
}
