import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import { useNavigation } from '@react-navigation/native';
import {
  extractIntent,
  generateResponse,
  detectLanguage,
  translateWolofToFrench,
  audioFeedback,
} from '../lib/wolof-speech';

const { width, height } = Dimensions.get('window');

// Couleurs Kame Daay
const Colors = {
  primary: '#FFD700',
  secondary: '#004D40',
  success: '#8BC34A',
  white: '#FFFFFF',
  accent: '#FFA000',
  dark: '#1a1a1a',
  lightGray: '#f5f5f5',
};

interface VoiceCommand {
  keywords: string[];
  action: string;
  response: string;
  responseWolof?: string;
  navigation?: string;
  params?: any;
}

interface VoiceAssistantProps {
  visible: boolean;
  onClose: () => void;
}

export default function VoiceAssistant({ visible, onClose }: VoiceAssistantProps) {
  const navigation = useNavigation();
  
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [assistantMessage, setAssistantMessage] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  
  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  
  // 🎯 Commandes vocales en Wolof + Français
  const voiceCommands: VoiceCommand[] = [
    // Navigation
    {
      keywords: ['jaay', 'vendre', 'vente', 'nouvelle vente', 'bi jaay', 'dund'],
      action: 'navigate_sales',
      response: 'Dara, daal sa nouvelle vente',
      responseWolof: 'Waaw, bi jaay bi!',
      navigation: 'Ventes',
    },
    {
      keywords: ['client', 'clients', 'kiliyaan', 'kiliyaane yi', 'wone kiliyaan'],
      action: 'navigate_clients',
      response: 'Dara, liggéey ak clients yi',
      responseWolof: 'Kiliyaane yi fi nañu!',
      navigation: 'Clients',
    },
    {
      keywords: ['crédit', 'crédits', 'dette', 'dettes', 'xaalis', 'xaalis bi', 'bu ame kreedi'],
      action: 'navigate_credit',
      response: 'Voici tes crédits',
      responseWolof: 'Li ame kreedi fi nañu ko!',
      navigation: 'Credits',
    },
    {
      keywords: ['statistique', 'statistiques', 'rapports', 'chiffres', 'bi ci njëkkante', 'stats'],
      action: 'navigate_stats',
      response: 'Statistiques bi',
      responseWolof: 'Statistiques yi fi nañu ko!',
      navigation: 'Dashboard',
    },
    {
      keywords: ['assistant', 'aide', 'conseil', 'wallou', 'ndimbal', 'yallah ma', 'assistant ia'],
      action: 'navigate_ai',
      response: 'Assistant IA bi',
      responseWolof: 'Man ngi fi ci ndimbal!',
      navigation: 'Dashboard',
    },
    
    // Actions rapides
    {
      keywords: ['relance', 'relancer', 'appeler', 'téléphoner', 'woote'],
      action: 'show_reminders',
      response: 'Voici les clients à relancer',
      responseWolof: 'Kiliyaane yi nga wara woote!',
    },
    {
      keywords: ['total', 'combien', 'montant', 'ñaata', 'ñaata la'],
      action: 'show_total',
      response: 'Calcul du total',
      responseWolof: 'Dinaa ko xayma!',
    },
    {
      keywords: ['aujourd\'hui', 'tay', 'léegi', 'bi mu jot'],
      action: 'show_today',
      response: 'Ventes du jour',
      responseWolof: 'Bi mu jot bi jaay!',
    },
    
    // Aide et informations
    {
      keywords: ['aide', 'ndimbal', 'yallah', 'dimbalima', 'waxx ma'],
      action: 'show_help',
      response: 'Je peux t\'aider avec : vendre, clients, crédits, statistiques, relances',
      responseWolof: 'Mën naa la dimbal ci: jaay, kiliyaane, kreedi, statistiques, woote!',
    },
    {
      keywords: ['fermer', 'arrêter', 'stop', 'taxaw', 'dindi'],
      action: 'close',
      response: 'Yalla naa fi',
      responseWolof: 'Yalla naa fi! Alhamdulilah!',
    },
  ];
  
  // Animation du pulse
  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
      
      // Animation des ondes
      Animated.loop(
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      pulseAnim.setValue(1);
      waveAnim.setValue(0);
    }
  }, [isListening]);
  
  // 🎤 Démarrer l'écoute
  const startListening = async () => {
    try {
      setIsListening(true);
      setRecognizedText('Dama dégg... 👂');
      setAssistantMessage('');
      
      // Note: Pour la version complète avec reconnaissance vocale réelle,
      // installer @react-native-voice/voice
      
      // Simulation pour la démo
      setTimeout(() => {
        simulateSpeechRecognition();
      }, 2000);
      
    } catch (error) {
      console.error('Erreur démarrage écoute:', error);
      setIsListening(false);
      speak('Damay jàmm, problem bu am');
    }
  };
  
  // 🛑 Arrêter l'écoute
  const stopListening = () => {
    setIsListening(false);
    setRecognizedText('');
  };
  
  // 🗣️ Parler (Text-to-Speech)
  const speak = async (text: string, language: string = 'fr-FR') => {
    try {
      setIsSpeaking(true);
      await Speech.speak(text, {
        language,
        pitch: 1.0,
        rate: 0.9,
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch (error) {
      console.error('Erreur TTS:', error);
      setIsSpeaking(false);
    }
  };
  
  // 🧠 Simuler la reconnaissance vocale (à remplacer par @react-native-voice/voice)
  const simulateSpeechRecognition = () => {
    // Dans une vraie app, ceci serait remplacé par la vraie reconnaissance vocale
    // Pour la démo, on affiche un message pour que l'utilisateur tape
    setRecognizedText('');
    setIsListening(false);
    setAssistantMessage('🎤 Dans la version complète, je comprendrais ta voix en wolof et français !');
  };
  
  // 🎯 Traiter la commande
  const processCommand = (text: string) => {
    const lowerText = text.toLowerCase().trim();
    setRecognizedText(lowerText);
    
    // Ajouter à l'historique
    setCommandHistory(prev => [lowerText, ...prev.slice(0, 4)]);
    
    // Chercher la commande correspondante
    let matchedCommand: VoiceCommand | null = null;
    
    for (const command of voiceCommands) {
      for (const keyword of command.keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          matchedCommand = command;
          break;
        }
      }
      if (matchedCommand) break;
    }
    
    if (matchedCommand) {
      executeCommand(matchedCommand);
    } else {
      // Commande non reconnue
      const response = 'Xam naa ko wax, waaye damay jéem. Wax "aide" pour voir les commandes.';
      setAssistantMessage(response);
      speak(response);
    }
    
    setIsListening(false);
  };
  
  // ⚡ Exécuter la commande
  const executeCommand = async (command: VoiceCommand) => {
    const response = command.responseWolof || command.response;
    setAssistantMessage(response);
    
    // Parler la réponse
    await speak(response);
    
    // Exécuter l'action
    switch (command.action) {
      case 'close':
        setTimeout(() => {
          onClose();
        }, 1500);
        break;
        
      case 'navigate_sales':
      case 'navigate_clients':
      case 'navigate_credit':
      case 'navigate_stats':
      case 'navigate_ai':
        if (command.navigation) {
          setTimeout(() => {
            navigation.navigate(command.navigation as never);
            onClose();
          }, 1500);
        }
        break;
        
      case 'show_help':
        // L'aide est déjà affichée dans la réponse
        break;
        
      default:
        setAssistantMessage('Commande reçue ! 🎉');
    }
  };
  
  // 🎨 Commandes rapides prédéfinies
  const quickCommands = [
    { icon: 'cart', label: 'Jaay', command: 'nouvelle vente' },
    { icon: 'people', label: 'Kiliyaan', command: 'clients' },
    { icon: 'cash', label: 'Kreedi', command: 'crédits' },
    { icon: 'stats-chart', label: 'Stats', command: 'statistiques' },
    { icon: 'call', label: 'Woote', command: 'relance' },
    { icon: 'help-circle', label: 'Ndimbal', command: 'aide' },
  ];
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.container}>
          {/* Header */}
          <LinearGradient
            colors={[Colors.secondary, Colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <Ionicons name="mic" size={28} color={Colors.white} />
                <View style={styles.headerTextContainer}>
                  <Text style={styles.headerTitle}>Assistant Vocal</Text>
                  <Text style={styles.headerSubtitle}>Wolof & Français 🇸🇳</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={28} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </LinearGradient>
          
          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Microphone Button */}
            <View style={styles.micSection}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={isListening ? stopListening : startListening}
                disabled={isSpeaking}
              >
                <View style={styles.micButtonContainer}>
                  {/* Ondes animées */}
                  {isListening && (
                    <>
                      <Animated.View
                        style={[
                          styles.wave,
                          styles.wave1,
                          {
                            opacity: waveAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.6, 0],
                            }),
                            transform: [{
                              scale: waveAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [1, 2.5],
                              }),
                            }],
                          },
                        ]}
                      />
                      <Animated.View
                        style={[
                          styles.wave,
                          styles.wave2,
                          {
                            opacity: waveAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.4, 0],
                            }),
                            transform: [{
                              scale: waveAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [1, 2],
                              }),
                            }],
                          },
                        ]}
                      />
                    </>
                  )}
                  
                  {/* Bouton micro */}
                  <Animated.View
                    style={[
                      styles.micButton,
                      {
                        transform: [{ scale: isListening ? pulseAnim : 1 }],
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={isListening ? ['#FF6B6B', '#FF4757'] : [Colors.primary, Colors.accent]}
                      style={styles.micGradient}
                    >
                      {isSpeaking ? (
                        <ActivityIndicator size="large" color={Colors.white} />
                      ) : (
                        <Ionicons
                          name={isListening ? 'stop' : 'mic'}
                          size={64}
                          color={Colors.white}
                        />
                      )}
                    </LinearGradient>
                  </Animated.View>
                </View>
              </TouchableOpacity>
              
              <Text style={styles.micLabel}>
                {isListening ? '🎤 Dama dégg...' : isSpeaking ? '🗣️ Dama wax...' : '🎤 Tap pour parler'}
              </Text>
            </View>
            
            {/* Input texte pour tester - DÉPLACÉ EN HAUT */}
            <View style={styles.textInputSection}>
              <Text style={styles.textInputLabel}>✍️ Ou tape ta commande :</Text>
              <View style={styles.textInputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ex: jaay, kiliyaan, kreedi..."
                  placeholderTextColor="#999"
                  onSubmitEditing={(e) => {
                    if (e.nativeEvent.text.trim()) {
                      processCommand(e.nativeEvent.text);
                    }
                  }}
                  returnKeyType="send"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
            
            {/* Texte reconnu */}
            {recognizedText !== '' && (
              <View style={styles.recognizedBox}>
                <Text style={styles.recognizedLabel}>Lu nga wax:</Text>
                <Text style={styles.recognizedText}>{recognizedText}</Text>
              </View>
            )}
            
            {/* Réponse de l'assistant */}
            {assistantMessage !== '' && (
              <View style={styles.responseBox}>
                <LinearGradient
                  colors={[Colors.success, '#7CB342']}
                  style={styles.responseGradient}
                >
                  <Ionicons name="chatbubble-ellipses" size={24} color={Colors.white} />
                  <Text style={styles.responseText}>{assistantMessage}</Text>
                </LinearGradient>
              </View>
            )}
            
            {/* Commandes rapides */}
            <View style={styles.quickCommandsSection}>
              <Text style={styles.sectionTitle}>⚡ Commandes Rapides</Text>
              <View style={styles.quickCommandsGrid}>
                {quickCommands.map((cmd, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.quickCommandButton}
                    onPress={() => processCommand(cmd.command)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={['#f8f9fa', '#e9ecef']}
                      style={styles.quickCommandGradient}
                    >
                      <Ionicons name={cmd.icon as any} size={28} color={Colors.secondary} />
                      <Text style={styles.quickCommandLabel}>{cmd.label}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Historique */}
            {commandHistory.length > 0 && (
              <View style={styles.historySection}>
                <Text style={styles.sectionTitle}>📜 Historique</Text>
                {commandHistory.map((cmd, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.historyItem}
                    onPress={() => processCommand(cmd)}
                  >
                    <Ionicons name="time-outline" size={18} color={Colors.secondary} />
                    <Text style={styles.historyText}>{cmd}</Text>
                    <Ionicons name="chevron-forward" size={18} color="#ccc" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            {/* Guide des commandes */}
            <View style={styles.guideSection}>
              <Text style={styles.sectionTitle}>💡 Exemples de Commandes</Text>
              <View style={styles.guideList}>
                <GuideItem icon="cart" text="Jaay / Vendre - Nouvelle vente" />
                <GuideItem icon="people" text="Kiliyaan / Clients - Liste clients" />
                <GuideItem icon="cash" text="Kreedi / Crédits - Voir les crédits" />
                <GuideItem icon="call" text="Woote / Relancer - Relances clients" />
                <GuideItem icon="stats-chart" text="Statistiques - Voir les stats" />
                <GuideItem icon="help-circle" text="Ndimbal / Aide - Voir l'aide" />
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// Composant pour les items du guide
function GuideItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.guideItem}>
      <Ionicons name={icon as any} size={20} color={Colors.primary} />
      <Text style={styles.guideText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center', // Centré au lieu de flex-end
    alignItems: 'center',
  },
  container: {
    backgroundColor: Colors.white,
    borderRadius: 30,
    width: width * 0.95,
    height: height * 0.9,
    overflow: 'hidden',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTextContainer: {
    gap: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.white,
    opacity: 0.9,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  micSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  micButtonContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wave: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  wave1: {
    borderColor: Colors.primary,
  },
  wave2: {
    borderColor: Colors.accent,
  },
  micButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  micGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micLabel: {
    marginTop: 20,
    fontSize: 16,
    color: Colors.secondary,
    textAlign: 'center',
  },
  recognizedBox: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary,
  },
  recognizedLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
    fontWeight: '600',
  },
  recognizedText: {
    fontSize: 16,
    color: Colors.dark,
    fontWeight: '600',
  },
  responseBox: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  responseGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  responseText: {
    flex: 1,
    fontSize: 15,
    color: Colors.white,
    fontWeight: '600',
    lineHeight: 22,
  },
  quickCommandsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: 12,
  },
  quickCommandsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickCommandButton: {
    width: (width - 64) / 3,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickCommandGradient: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  quickCommandLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.secondary,
    textAlign: 'center',
  },
  historySection: {
    marginBottom: 24,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f8f9fa',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  historyText: {
    flex: 1,
    fontSize: 14,
    color: Colors.dark,
  },
  guideSection: {
    marginBottom: 24,
  },
  guideList: {
    gap: 10,
  },
  guideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
  },
  guideText: {
    flex: 1,
    fontSize: 13,
    color: Colors.dark,
  },
  textInputSection: {
    marginTop: 20,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  textInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 12,
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '90%',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.dark,
    fontWeight: '500',
  },
});