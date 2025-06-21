// components/AppBackground.tsx
import React from 'react';
import { ImageBackground, StyleSheet, StatusBar, View } from 'react-native';

const backgroundImage = require('../assets/images/background.jpg');

interface AppBackgroundProps {
  children: React.ReactNode;
}

const AppBackground: React.FC<AppBackgroundProps> = ({ children }) => {
  return (
    // This View now correctly fills the entire screen area
    <View style={styles.container}>
      {/* 
        This StatusBar configuration is key:
        - backgroundColor="transparent": Removes the solid color block behind the status bar.
        - translucent: Tells Android the app will draw underneath the status bar.
      */}
      <StatusBar
        barStyle='light-content'
        backgroundColor='transparent'
        translucent
      />

      <ImageBackground
        source={backgroundImage}
        resizeMode='cover'
        style={styles.imageBackground} // No internal padding here anymore
      >
        {children}
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageBackground: {
    flex: 1,
    // NO PADDING HERE. The background must fill the entire space.
    // The content on top will handle its own padding.
  },
});

export default AppBackground;
