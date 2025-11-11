/**
 * 🧪 Tests pour la bibliothèque de reconnaissance vocale wolof
 */

import {
    normalizeText,
    translateWolofToFrench,
    detectLanguage,
    extractIntent,
    generateResponse,
  } from '../wolof-speech';
  
  describe('Wolof Speech Recognition', () => {
    describe('normalizeText', () => {
      it('should normalize text to lowercase', () => {
        expect(normalizeText('JAAY')).toBe('jaay');
      });
  
      it('should remove accents', () => {
        expect(normalizeText('crédit')).toBe('credit');
      });
  
      it('should remove special characters', () => {
        expect(normalizeText('jaay!')).toBe('jaay');
      });
    });
  
    describe('translateWolofToFrench', () => {
      it('should translate wolof word to french', () => {
        const result = translateWolofToFrench('jaay');
        expect(result).toContain('vendre');
      });
  
      it('should translate multiple wolof words', () => {
        const result = translateWolofToFrench('jaay kiliyaan');
        expect(result).toContain('vendre');
        expect(result).toContain('client');
      });
  
      it('should keep french words unchanged', () => {
        const result = translateWolofToFrench('bonjour');
        expect(result).toBe('bonjour');
      });
    });
  
    describe('detectLanguage', () => {
      it('should detect wolof language', () => {
        expect(detectLanguage('jaay kiliyaan')).toBe('wolof');
      });
  
      it('should detect french language', () => {
        expect(detectLanguage('vendre clients')).toBe('french');
      });
  
      it('should detect mixed language', () => {
        expect(detectLanguage('jaay clients')).toBe('mixed');
      });
    });
  
    describe('extractIntent', () => {
      it('should extract intent from wolof command', () => {
        const result = extractIntent('jaay');
        expect(result.intent).toBe('nouvelle_vente');
        expect(result.confidence).toBeGreaterThan(0);
      });
  
      it('should extract intent from french command', () => {
        const result = extractIntent('clients');
        expect(result.intent).toBe('liste_clients');
        expect(result.confidence).toBeGreaterThan(0);
      });
  
      it('should extract intent from mixed command', () => {
        const result = extractIntent('jaay clients');
        expect(result.intent).not.toBeNull();
      });
  
      it('should return null for unknown command', () => {
        const result = extractIntent('xyzabc123');
        expect(result.intent).toBeNull();
        expect(result.confidence).toBe(0);
      });
  
      it('should handle wolof phrases', () => {
        const result = extractIntent('dama bëgg jaay');
        expect(result.intent).toBe('nouvelle_vente');
        expect(result.confidence).toBeGreaterThan(0.8);
      });
    });
  
    describe('generateResponse', () => {
      it('should generate wolof response', () => {
        const result = generateResponse('nouvelle_vente', 'wolof');
        expect(result.text).toContain('Waaw');
      });
  
      it('should generate french response', () => {
        const result = generateResponse('nouvelle_vente', 'french');
        expect(result.text).toContain('accord');
      });
  
      it('should generate mixed response', () => {
        const result = generateResponse('nouvelle_vente', 'mixed');
        expect(result.text.length).toBeGreaterThan(0);
      });
  
      it('should use fr-FR language for TTS', () => {
        const result = generateResponse('nouvelle_vente', 'wolof');
        expect(result.ttsLanguage).toBe('fr-FR');
      });
    });
  
    describe('Real-world scenarios', () => {
      it('should handle "jaay" command', () => {
        const result = extractIntent('jaay');
        expect(result.intent).toBe('nouvelle_vente');
        const response = generateResponse(result.intent!, 'wolof');
        expect(response.text).toBeTruthy();
      });
  
      it('should handle "kiliyaan" command', () => {
        const result = extractIntent('kiliyaan');
        expect(result.intent).toBe('liste_clients');
      });
  
      it('should handle "kreedi" command', () => {
        const result = extractIntent('kreedi');
        expect(result.intent).toBe('liste_credits');
      });
  
      it('should handle "woote" command', () => {
        const result = extractIntent('woote');
        expect(result.intent).toBe('relances');
      });
  
      it('should handle "ndimbal" command', () => {
        const result = extractIntent('ndimbal');
        expect(result.intent).toBe('aide');
      });
  
      it('should handle mixed "dama bëgg gis kiliyaane yi"', () => {
        const result = extractIntent('dama bëgg gis kiliyaane yi');
        expect(result.intent).toBe('liste_clients');
      });
    });
  });
  