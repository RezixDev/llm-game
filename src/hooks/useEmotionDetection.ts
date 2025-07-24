// ===== hooks/useEmotionDetection.ts (Optimized Version) =====
import { useState, useEffect, useCallback, useRef } from 'react';
import { EmotionDetectionService, type EmotionData } from '@/services/emotionDetectionService';

export interface EmotionDetectionState {
  isEnabled: boolean;
  isLoading: boolean;
  isActive: boolean;
  currentEmotion: EmotionData | null;
  error: string | null;
  hasCamera: boolean;
  hasPermission: boolean | null;
}

export interface EmotionDetectionActions {
  enableDetection: () => Promise<void>;
  disableDetection: () => void;
  toggleDetection: () => Promise<void>;
  clearError: () => void;
}

export const useEmotionDetection = () => {
  const serviceRef = useRef<EmotionDetectionService>(EmotionDetectionService.getInstance());
  const emotionUpdateTimeoutRef = useRef<number>();
  
  const [state, setState] = useState<EmotionDetectionState>({
    isEnabled: false,
    isLoading: false,
    isActive: false,
    currentEmotion: null,
    error: null,
    hasCamera: true,
    hasPermission: null,
  });

  // Debounced state updates to prevent excessive re-renders
  const updateStateDebounced = useCallback((updates: Partial<EmotionDetectionState>) => {
    if (emotionUpdateTimeoutRef.current) {
      clearTimeout(emotionUpdateTimeoutRef.current);
    }
    
    emotionUpdateTimeoutRef.current = window.setTimeout(() => {
      setState(prev => ({ ...prev, ...updates }));
    }, 50); // 50ms debounce
  }, []);

  // Optimized emotion update callback with reduced re-renders
  const handleEmotionUpdate = useCallback((emotion: EmotionData | null) => {
    // Only update if emotion actually changed significantly
    setState(prev => {
      if (!emotion && !prev.currentEmotion) return prev;
      
      if (emotion && prev.currentEmotion && 
          emotion.primary === prev.currentEmotion.primary &&
          Math.abs(emotion.confidence - prev.currentEmotion.confidence) < 0.1) {
        return prev; // Skip minor changes
      }
      
      return { ...prev, currentEmotion: emotion };
    });
  }, []);

  // Check camera availability only once
  useEffect(() => {
    let mounted = true;
    
    const checkCameraAvailability = async () => {
      try {
        if (!navigator.mediaDevices?.enumerateDevices) {
          if (mounted) setState(prev => ({ ...prev, hasCamera: false }));
          return;
        }
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasVideoInput = devices.some(device => device.kind === 'videoinput');
        
        if (mounted) {
          setState(prev => ({ ...prev, hasCamera: hasVideoInput }));
        }
      } catch (error) {
        console.warn('Could not check camera availability:', error);
        if (mounted) {
          setState(prev => ({ ...prev, hasCamera: false }));
        }
      }
    };

    checkCameraAvailability();
    
    return () => {
      mounted = false;
    };
  }, []);

  // Memoized enable detection function
  const enableDetection = useCallback(async () => {
    if (!state.hasCamera) {
      setState(prev => ({ 
        ...prev, 
        error: 'No camera available for emotion detection' 
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const service = serviceRef.current;
      
      console.log('🚀 Starting emotion detection (optimized)...');
      
      await service.startDetection(handleEmotionUpdate);
      
      setState(prev => ({ 
        ...prev, 
        isEnabled: true,
        isActive: true,
        isLoading: false,
        hasPermission: true,
      }));

      console.log('✅ Emotion detection enabled (optimized)');
    } catch (error: any) {
      console.error('❌ Failed to enable emotion detection:', error);
      
      let errorMessage = 'Failed to start emotion detection';
      if (error.message.includes('camera') || error.message.includes('Camera')) {
        errorMessage = 'Camera access denied or unavailable';
        setState(prev => ({ ...prev, hasPermission: false }));
      } else if (error.message.includes('models') || error.message.includes('Model')) {
        errorMessage = 'Failed to load emotion detection models';
      }

      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage,
        isEnabled: false,
        isActive: false,
      }));
    }
  }, [state.hasCamera, handleEmotionUpdate]);

  // Memoized disable detection function
  const disableDetection = useCallback(() => {
    const service = serviceRef.current;
    service.stopDetection();
    
    setState(prev => ({ 
      ...prev, 
      isEnabled: false,
      isActive: false,
      currentEmotion: null,
      error: null,
    }));

    console.log('Emotion detection disabled (optimized)');
  }, []);

  // Memoized toggle function
  const toggleDetection = useCallback(async () => {
    if (state.isEnabled) {
      disableDetection();
    } else {
      await enableDetection();
    }
  }, [state.isEnabled, enableDetection, disableDetection]);

  // Memoized clear error function
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (emotionUpdateTimeoutRef.current) {
        clearTimeout(emotionUpdateTimeoutRef.current);
      }
      
      if (state.isActive) {
        serviceRef.current.stopCamera();
      }
    };
  }, []); // Only run on unmount

  // Memoized utility methods
  const getEmotionContext = useCallback((): string => {
    if (!state.isEnabled || !state.currentEmotion) {
      return '';
    }
    return serviceRef.current.getEmotionContext();
  }, [state.isEnabled, state.currentEmotion]);

  const getEmotionDescription = useCallback((): string => {
    if (!state.isEnabled || !state.currentEmotion) {
      return 'unknown';
    }
    return serviceRef.current.getEmotionDescription();
  }, [state.isEnabled, state.currentEmotion]);

  const getVideoElement = useCallback((): HTMLVideoElement | null => {
    return serviceRef.current.getVideoElement();
  }, []);

  // Performance monitoring (development only)
  const getPerformanceStats = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      return serviceRef.current.getPerformanceStats();
    }
    return null;
  }, []);

  return {
    // State
    ...state,
    
    // Actions
    enableDetection,
    disableDetection,
    toggleDetection,
    clearError,
    
    // Utility methods
    getEmotionContext,
    getEmotionDescription,
    getVideoElement,
    getPerformanceStats,
  };
};