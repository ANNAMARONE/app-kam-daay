import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import VoiceAssistant from './VoiceAssistant';

const Colors = {
  primary: '#FFD700',
  accent: '#FFA000',
  white: '#FFFFFF',
};

export default function FloatingVoiceButton() {
  const [showAssistant, setShowAssistant] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Animation continue du pulse
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <>
      {/* Bouton flottant */}
      <View style={styles.container}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowAssistant(true)}
          style={styles.buttonWrapper}
        >
          {/* Cercle animé de fond */}
          <Animated.View
            style={[
              styles.pulseCircle,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />

          {/* Bouton principal */}
          <Animated.View
            style={[
              styles.button,
              {
                transform: [{ rotate: rotation }],
              },
            ]}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.accent]}
              style={styles.gradient}
            >
              <Ionicons name="mic" size={32} color={Colors.white} />
            </LinearGradient>
          </Animated.View>

          {/* Badge "Wolof" */}
          <View style={styles.badge}>
            <LinearGradient
              colors={['#FF6B6B', '#FF4757']}
              style={styles.badgeGradient}
            >
              <Ionicons name="language" size={12} color={Colors.white} />
            </LinearGradient>
          </View>
        </TouchableOpacity>
      </View>

      {/* Modal de l'assistant vocal */}
      <VoiceAssistant
        visible={showAssistant}
        onClose={() => setShowAssistant(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    zIndex: 1000,
  },
  buttonWrapper: {
    position: 'relative',
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseCircle: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.primary,
    opacity: 0.2,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  gradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  badgeGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
