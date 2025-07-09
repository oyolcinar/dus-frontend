import React from 'react';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

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
        tabBarActiveTintColor: colorScheme === 'dark' ? '#d9c5e9' : '#FF7675',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#111827' : '#FFFFFF',
          borderTopColor: colorScheme === 'dark' ? '#374151' : '#E5E7EB',
        },
      }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color }) => <TabBarIcon name='home' color={color} />,
        }}
      />

      <Tabs.Screen
        name='courses/index'
        options={{
          title: 'Kurslar',
          tabBarIcon: ({ color }) => <TabBarIcon name='book' color={color} />,
        }}
      />

      <Tabs.Screen
        name='tests'
        options={{
          title: 'Testler',
          tabBarIcon: ({ color }) => (
            <TabBarIcon name='check-circle' color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name='duels/index'
        options={{
          title: 'Düellolar',
          tabBarIcon: ({ color }) => <TabBarIcon name='trophy' color={color} />,
        }}
      />

      <Tabs.Screen
        name='profile'
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <TabBarIcon name='user' color={color} />,
        }}
      />
      <Tabs.Screen
        name='duels/[id]'
        options={{
          // This screen is part of the tabs navigator but has no tab button
          href: null,
        }}
      />
      <Tabs.Screen
        name='duels/new'
        options={{
          // This screen is part of the tabs navigator but has no tab button
          href: null,
        }}
      />
      <Tabs.Screen
        name='courses/[id]'
        options={{
          // This screen is part of the tabs navigator but has no tab button
          href: null,
        }}
      />
    </Tabs>
  );
}
