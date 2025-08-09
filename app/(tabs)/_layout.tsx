import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { Tabs } from 'expo-router';
import { useColorScheme, View, Text, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Video, ResizeMode } from 'expo-av';
// ✅ UPDATED: Use new appStore instead of context
import { usePreferredCourse } from '../../stores/appStore';

// Memoized TabBarIcon component
const TabBarIcon = React.memo(
  (props: {
    name: React.ComponentProps<typeof FontAwesome>['name'];
    color: string;
  }) => {
    return <FontAwesome size={24} style={styles.tabBarIcon} {...props} />;
  },
);

// Custom Video Tab Icon Component - Floating/Overlay Style
const VideoTabIcon = React.memo(
  ({ color, focused }: { color: string; focused: boolean }) => {
    const videoRef = useRef<Video>(null);

    // Video cleanup
    useEffect(() => {
      return () => {
        if (videoRef.current) {
          videoRef.current.pauseAsync();
        }
      };
    }, []);

    return (
      <View style={styles.videoTabContainer}>
        {/* The actual floating video button */}
        <View style={[styles.videoButton, { backgroundColor: color }]}>
          {/* Inner glow ring when focused - NO SHADOWS */}
          {focused && (
            <View style={[styles.focusedRing, { borderColor: color }]} />
          )}

          <Video
            ref={videoRef}
            source={require('../../assets/videos/ziplayan.mp4')} // Adjust path as needed
            style={styles.video}
            shouldPlay={true}
            isLooping={true}
            isMuted={true}
            resizeMode={ResizeMode.COVER}
            useNativeControls={false}
            usePoster={false}
          />
        </View>

        {/* Invisible spacer to maintain tab touch area */}
        <View style={styles.invisibleSpacer} />
      </View>
    );
  },
);

export default function TabLayout() {
  const colorScheme = useColorScheme();
  // ✅ UPDATED: Use new appStore hook - get getCourseCategory too
  const { preferredCourse, getCourseColor, getCourseCategory, isLoading } =
    usePreferredCourse();
  const [activeColor, setActiveColor] = useState<string>('#FF7675'); // Default color

  // ✅ UPDATED: Simplified since appStore handles AsyncStorage automatically
  // Update color when preferred course changes
  useEffect(() => {
    if (!isLoading && preferredCourse?.title) {
      // Try to get category from preferredCourse object (if it exists from store)
      let category = (preferredCourse as any)?.category;

      // If not available, derive it from the title using getCourseCategory
      if (!category) {
        category = getCourseCategory(preferredCourse.title);
      }

      if (category) {
        const courseColor = getCourseColor(category);
        console.log('Tab color from appStore:', courseColor);
        setActiveColor(courseColor);
      } else {
        // Fallback to default color if category can't be determined
        console.log('No course category, using default color');
        setActiveColor('#FF7675');
      }
    } else if (!isLoading && !preferredCourse) {
      // Use default color if no course is selected
      console.log('No preferred course, using default color');
      setActiveColor('#FF7675');
    }
  }, [preferredCourse, isLoading, getCourseColor, getCourseCategory]);

  // ✅ REMOVED: Manual AsyncStorage checking since appStore handles this automatically
  // The appStore already loads preferred course from AsyncStorage during initialization
  // and updates the state appropriately

  // Memoize screen options to prevent recreation
  const screenOptions = useMemo(
    () => ({
      tabBarActiveTintColor: activeColor, // Use the dynamic active color
      headerShown: false,
      tabBarStyle: {
        backgroundColor: '#FFFFFF',
        borderTopColor: '#FFFFFF',
      },
    }),
    [activeColor],
  );

  // Memoize tab screen configurations
  const homeScreenOptions = useMemo(
    () => ({
      title: 'Ana Sayfa',
      tabBarIcon: ({ color }: { color: string }) => (
        <TabBarIcon name='home' color={color} />
      ),
    }),
    [],
  );

  const duelsScreenOptions = useMemo(
    () => ({
      title: '', // Hide default title since we have custom title above
      tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
        <VideoTabIcon color={color} focused={focused} />
      ),
    }),
    [],
  );

  const profileScreenOptions = useMemo(
    () => ({
      title: 'Profil',
      tabBarIcon: ({ color }: { color: string }) => (
        <TabBarIcon name='user' color={color} />
      ),
    }),
    [],
  );

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen name='index' options={homeScreenOptions} />

      <Tabs.Screen name='duels/index' options={duelsScreenOptions} />

      <Tabs.Screen name='profile/index' options={profileScreenOptions} />

      <Tabs.Screen name='duels/[id]' options={hiddenScreenOptions} />
      <Tabs.Screen name='duels/new' options={hiddenScreenOptions} />
      <Tabs.Screen name='courses/[id]' options={hiddenScreenOptions} />
      <Tabs.Screen name='profile/achievements' options={hiddenScreenOptions} />
      <Tabs.Screen name='profile/friends' options={hiddenScreenOptions} />
      <Tabs.Screen name='profile/settings' options={hiddenScreenOptions} />
      <Tabs.Screen
        name='notifications/settings'
        options={hiddenScreenOptions}
      />
      <Tabs.Screen name='duels/history' options={hiddenScreenOptions} />
      <Tabs.Screen name='courses/index' options={hiddenScreenOptions} />
      <Tabs.Screen name='tests' options={hiddenScreenOptions} />
      <Tabs.Screen name='notifications/index' options={hiddenScreenOptions} />
    </Tabs>
  );
}

// Static configuration for hidden screens to prevent recreation
const hiddenScreenOptions = {
  href: null,
};

// ✅ KEEPING: All styles exactly the same
const styles = StyleSheet.create({
  tabBarIcon: {
    marginBottom: -3,
  },
  videoTabContainer: {
    position: 'relative',
    width: 60,
    height: 30, // Keep normal tab height
    justifyContent: 'flex-end', // Align to bottom
    alignItems: 'center',
  },
  videoButton: {
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
    alignItems: 'center',
    justifyContent: 'center',
    alignContent: 'center',
    zIndex: 1000, // Ensure it's on top
  },
  focusedRing: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 42,
    borderWidth: 2,
    elevation: 0,
  },
  video: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  invisibleSpacer: {
    width: 24,
    height: 24,
    opacity: 0,
  },
});
