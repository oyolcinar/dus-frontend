import React from 'react';
import { Tabs } from 'expo-router';
import { useColorScheme, View, Text } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Video, ResizeMode } from 'expo-av';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

// Custom Video Tab Icon Component - Floating/Overlay Style
function VideoTabIcon({ color, focused }: { color: string; focused: boolean }) {
  return (
    <View
      style={{
        position: 'relative',
        width: 60,
        height: 30, // Keep normal tab height
        justifyContent: 'flex-end', // Align to bottom
        alignItems: 'center',
      }}
    >
      {/* Custom title above the video button */}
      {/* <View
        style={{
          position: 'absolute',
          bottom: -22, // Position above the video button
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001,
        }}
      >
        <Text
          style={{
            fontSize: 10,
            fontWeight: '600',
            color: focused ? '#FF7675' : color,
            textAlign: 'center',
            paddingHorizontal: 4,
            paddingVertical: 8,
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          Düellolar
        </Text>
      </View> */}

      {/* The actual floating video button */}
      <View
        style={{
          position: 'absolute',
          bottom: -10, // Float above the tab bar
          width: 80,
          height: 80,
          borderRadius: 40,
          overflow: 'hidden',
          // Outer border/ring
          borderWidth: 4,
          borderColor: '#FFFFFF',
          // Remove all shadow properties
          elevation: 0,
          // Background in case video doesn't load
          backgroundColor: color,
          alignItems: 'center',
          justifyContent: 'center',
          alignContent: 'center',
          zIndex: 1000, // Ensure it's on top
        }}
      >
        {/* Inner glow ring when focused - NO SHADOWS */}
        {focused && (
          <View
            style={{
              position: 'absolute',
              top: -2,
              left: -2,
              right: -2,
              bottom: -2,
              borderRadius: 42,
              borderWidth: 2,
              borderColor: color,
              elevation: 0,
            }}
          />
        )}

        <Video
          source={require('../../assets/videos/ziplayan.mp4')} // Adjust path as needed
          style={{
            width: 140,
            height: 140,
            borderRadius: 70,
          }}
          shouldPlay={true}
          isLooping={true}
          isMuted={true}
          resizeMode={ResizeMode.COVER}
          useNativeControls={false}
          usePoster={false}
        />
      </View>

      {/* Invisible spacer to maintain tab touch area */}
      <View style={{ width: 24, height: 24, opacity: 0 }} />
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colorScheme === 'dark' ? '#FF7675' : '#FF7675',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#FFFFFF' : '#FFFFFF',
          borderTopColor: colorScheme === 'dark' ? '#FFFFFF' : '#FFFFFF',
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
        name='duels/index'
        options={{
          title: '', // Hide default title since we have custom title above
          tabBarIcon: ({ color, focused }) => (
            <VideoTabIcon color={color} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name='profile/index'
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
      <Tabs.Screen
        name='profile/achievements'
        options={{
          // This screen is part of the tabs navigator but has no tab button
          href: null,
        }}
      />
      <Tabs.Screen
        name='profile/friends'
        options={{
          // This screen is part of the tabs navigator but has no tab button
          href: null,
        }}
      />
      <Tabs.Screen
        name='profile/settings'
        options={{
          // This screen is part of the tabs navigator but has no tab button
          href: null,
        }}
      />
      <Tabs.Screen
        name='notifications/settings'
        options={{
          // This screen is part of the tabs navigator but has no tab button
          href: null,
        }}
      />
      <Tabs.Screen
        name='duels/history'
        options={{
          // This screen is part of the tabs navigator but has no tab button
          href: null,
        }}
      />
      <Tabs.Screen
        name='courses/index'
        options={{
          // This screen is part of the tabs navigator but has no tab button
          href: null,
        }}
      />
      <Tabs.Screen
        name='tests'
        options={{
          // This screen is part of the tabs navigator but has no tab button
          href: null,
        }}
      />
      <Tabs.Screen
        name='notifications/index'
        options={{
          // This screen is part of the tabs navigator but has no tab button
          href: null,
        }}
      />
    </Tabs>
  );
}
