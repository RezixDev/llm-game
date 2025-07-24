// ===== hooks/useEmotionDetection.ts =====
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
  
  const [state, setState] = useState<EmotionDetectionState>({
    isEnabled: false,
    isLoading: false,
    isActive: false,
    currentEmotion: null,
    error: null,
    hasCamera: true, // Assume true until proven otherwise
    hasPermission: null,
  });

  // Check camera availability on mount
  useEffect(() => {
    const checkCameraAvailability = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasVideoInput = devices.some(device => device.kind === 'videoinput');
        
        setState(prev => ({ ...prev, hasCamera: hasVideoInput }));
      } catch (error) {
        console.warn('Could not check camera availability:', error);
        setState(prev => ({ ...prev, hasCamera: false }));
      }
    };

    checkCameraAvailability();
  }, []);

  // Emotion update callback
  const handleEmotionUpdate = useCallback((emotion: EmotionData | null) => {
    setState(prev => ({ ...prev, currentEmotion: emotion }));
  }, []);

  // Enable emotion detection
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
      
      console.log('🚀 Starting emotion detection from hook...');
      
      // Start detection with proper async handling
      await service.startDetection(handleEmotionUpdate);
      
      setState(prev => ({ 
        ...prev, 
        isEnabled: true,
        isActive: true,
        isLoading: false,
        hasPermission: true,
      }));

      console.log('✅ Emotion detection enabled successfully from hook');
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

  // Disable emotion detection
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

    console.log('Emotion detection disabled');
  }, []);

  // Toggle detection
  const toggleDetection = useCallback(async () => {
    if (state.isEnabled) {
      disableDetection();
    } else {
      await enableDetection();
    }
  }, [state.isEnabled, enableDetection, disableDetection]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.isActive) {
        serviceRef.current.stopCamera();
      }
    };
  }, [state.isActive]);

  // Public methods for getting emotion context
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
    const videoElement = serviceRef.current.getVideoElement();
    console.log('🎥 Video element request:', {
      exists: !!videoElement,
      dimensions: videoElement ? `${videoElement.videoWidth}x${videoElement.videoHeight}` : 'N/A',
      readyState: videoElement?.readyState,
      srcObject: !!videoElement?.srcObject
    });
    return videoElement;
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
  };
};