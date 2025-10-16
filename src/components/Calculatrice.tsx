import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import Colors from './../constants/Colors';

interface CalculatriceProps {
  visible: boolean;
  onClose: () => void;
  onUseValue?: (value: number) => void;
}

export function Calculatrice({ visible, onClose, onUseValue }: CalculatriceProps) {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [newNumber, setNewNumber] = useState(true);

  const handleNumber = (num: string) => {
    if (newNumber) {
      setDisplay(num);
      setNewNumber(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleDecimal = () => {
    if (!display.includes('.')) {
      setDisplay(display + '.');
      setNewNumber(false);
    }
  };

  const handleOperation = (op: string) => {
    const current = parseFloat(display);
    
    if (previousValue !== null && operation && !newNumber) {
      const result = calculate(previousValue, current, operation);
      setDisplay(result.toString());
      setPreviousValue(result);
    } else {
      setPreviousValue(current);
    }
    
    setOperation(op);
    setNewNumber(true);
  };

  const calculate = (prev: number, current: number, op: string): number => {
    switch (op) {
      case '+':
        return prev + current;
      case '-':
        return prev - current;
      case '×':
        return prev * current;
      case '÷':
        return current !== 0 ? prev / current : 0;
      default:
        return current;
    }
  };

  const handleEquals = () => {
    if (previousValue !== null && operation) {
      const current = parseFloat(display);
      const result = calculate(previousValue, current, operation);
      setDisplay(result.toString());
      setPreviousValue(null);
      setOperation(null);
      setNewNumber(true);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setNewNumber(true);
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
      setNewNumber(true);
    }
  };

  const handleUseValue = () => {
    if (onUseValue) {
      onUseValue(parseFloat(display));
    }
    onClose();
  };

  const buttons = [
    { label: 'C', action: handleClear, style: styles.buttonClear },
    { label: '÷', action: () => handleOperation('÷'), style: styles.buttonOperator },
    { label: '×', action: () => handleOperation('×'), style: styles.buttonOperator },
    { label: '⌫', action: handleBackspace, style: styles.buttonDelete },
    
    { label: '7', action: () => handleNumber('7') },
    { label: '8', action: () => handleNumber('8') },
    { label: '9', action: () => handleNumber('9') },
    { label: '-', action: () => handleOperation('-'), style: styles.buttonOperator },
    
    { label: '4', action: () => handleNumber('4') },
    { label: '5', action: () => handleNumber('5') },
    { label: '6', action: () => handleNumber('6') },
    { label: '+', action: () => handleOperation('+'), style: styles.buttonOperator },
    
    { label: '1', action: () => handleNumber('1') },
    { label: '2', action: () => handleNumber('2') },
    { label: '3', action: () => handleNumber('3') },
    { label: '=', action: handleEquals, style: styles.buttonEquals, span: true },
    
    { label: '0', action: () => handleNumber('0'), span: true },
    { label: '.', action: handleDecimal },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconContainer}>
                <Text style={styles.iconEmoji}>🔢</Text>
              </View>
              <Text style={styles.headerTitle}>Calculatrice</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Display */}
          <View style={styles.displayContainer}>
            {previousValue !== null && operation && (
              <Text style={styles.displaySecondary}>
                {previousValue} {operation}
              </Text>
            )}
            <Text style={styles.display} numberOfLines={1} adjustsFontSizeToFit>
              {display}
            </Text>
          </View>

          {/* Buttons Grid */}
          <View style={styles.buttonsContainer}>
            {buttons.map((btn, index) => {
              // Gérer le bouton "=" qui prend 2 lignes
              if (btn.label === '=' && index === 15) {
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={btn.action}
                    style={[styles.button, btn.style, styles.buttonSpanVertical]}
                  >
                    <Text style={[styles.buttonText, styles.buttonEqualsText]}>
                      {btn.label}
                    </Text>
                  </TouchableOpacity>
                );
              }
              
              // Gérer le bouton "0" qui prend 2 colonnes
              if (btn.label === '0') {
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={btn.action}
                    style={[styles.button, styles.buttonSpanHorizontal]}
                  >
                    <Text style={styles.buttonText}>{btn.label}</Text>
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity
                  key={index}
                  onPress={btn.action}
                  style={[styles.button, btn.style]}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      btn.style === styles.buttonOperator && styles.buttonOperatorText,
                      btn.style === styles.buttonClear && styles.buttonClearText,
                    ]}
                  >
                    {btn.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Use Value Button */}
          {onUseValue && (
            <Button
              title="Utiliser cette valeur"
              onPress={handleUseValue}
              variant="primary"
              fullWidth
              style={styles.useButton}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconEmoji: {
    fontSize: 18,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  closeButton: {
    padding: 4,
  },
  displayContainer: {
    backgroundColor: Colors.backgroundSecondary,
    padding: 24,
    minHeight: 100,
    justifyContent: 'flex-end',
  },
  displaySecondary: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  display: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.secondary,
    textAlign: 'right',
  },
  buttonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  button: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonSpanHorizontal: {
    width: '47%',
  },
  buttonSpanVertical: {
    height: 'auto',
    aspectRatio: 0.48,
  },
  buttonText: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
  },
  buttonOperator: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
  },
  buttonOperatorText: {
    color: Colors.primary,
    fontWeight: '700',
  },
  buttonClear: {
    backgroundColor: Colors.error + '20',
    borderColor: Colors.error,
  },
  buttonClearText: {
    color: Colors.error,
    fontWeight: '700',
  },
  buttonDelete: {
    backgroundColor: Colors.backgroundSecondary,
  },
  buttonEquals: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  buttonEqualsText: {
    color: Colors.white,
    fontWeight: '700',
  },
  useButton: {
    margin: 16,
    marginTop: 0,
  },
});
