// ===== services/emotionDetectionService.ts (Fixed Version) =====
import * as faceapi from 'face-api.js';

export type EmotionData = {
  primary: string;
  confidence: number;
  timestamp: number;
  allEmotions: {
    happy: number;
    sad: number;
    angry: number;
    fearful: number;
    disgusted: number;
    surprised: number;
    neutral: number;
  };
};

export type EmotionHistory = {
  current: EmotionData | null;
  previous: EmotionData | null;
  smoothed: EmotionData | null;
};

export class EmotionDetectionService {
  private static instance: EmotionDetectionService;
  private modelsLoaded = false;
  private videoElement: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private isDetecting = false;
  private detectionInterval: number | null = null;
  private emotionHistory: EmotionHistory = {
    current: null,
    previous: null,
    smoothed: null,
  };
  private onEmotionCallback: ((emotion: EmotionData | null) => void) | null = null;

  // Performance optimization flags
  private lastDetectionTime = 0;
  private readonly DETECTION_THROTTLE = 800; // Slower detection rate in game
  private readonly SMOOTH_FACTOR = 0.4; // More smoothing
  private readonly STRONG_EMOTION_THRESHOLD = 0.6;
  
  // Video stability flags
  private videoStabilityChecks = 0;
  private readonly MAX_STABILITY_CHECKS = 5;
  
  static getInstance(): EmotionDetectionService {
    if (!EmotionDetectionService.instance) {
      EmotionDetectionService.instance = new EmotionDetectionService();
    }
    return EmotionDetectionService.instance;
  }

  async loadModels(): Promise<void> {
    if (this.modelsLoaded) return;

    try {
      console.log('🔄 Loading face-api.js models...');
      
      // Load models with error handling
      const modelPromises = [
        faceapi.nets.tinyFaceDetector.loadFromUri('/models').catch(e => {
          throw new Error(`TinyFaceDetector load failed: ${e.message}`);
        }),
        faceapi.nets.faceExpressionNet.loadFromUri('/models').catch(e => {
          throw new Error(`FaceExpressionNet load failed: ${e.message}`);
        })
      ];

      await Promise.all(modelPromises);

      this.modelsLoaded = true;
      console.log('✅ Face-api.js models loaded successfully');
    } catch (error) {
      console.error('❌ Model loading failed:', error);
      throw new Error(`Could not load emotion detection models: ${error.message}`);
    }
  }

  async startCamera(): Promise<void> {
    if (this.stream) return;

    try {
      console.log('🎥 Requesting camera access...');
      
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640, max: 640 },
          height: { ideal: 480, max: 480 },
          facingMode: 'user',
          frameRate: { ideal: 15, max: 20 } // Lower frame rate for performance
        }
      });

      console.log('✅ Camera stream obtained');

      // Create video element with optimized settings
      this.videoElement = document.createElement('video');
      this.videoElement.srcObject = this.stream;
      this.videoElement.autoplay = true;
      this.videoElement.muted = true;
      this.videoElement.playsInline = true;
      
      // Optimize video element for better performance
      this.videoElement.style.width = '320px';
      this.videoElement.style.height = '240px';
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Camera initialization timeout'));
        }, 10000);

        this.videoElement!.onloadedmetadata = () => {
          clearTimeout(timeout);
          console.log(`✅ Video ready: ${this.videoElement!.videoWidth}x${this.videoElement!.videoHeight}`);
          
          // Reset stability checks
          this.videoStabilityChecks = 0;
          resolve();
        };
        
        this.videoElement!.onerror = (error) => {
          clearTimeout(timeout);
          console.error('❌ Video element error:', error);
          reject(new Error('Video element failed to load'));
        };
      });
    } catch (error) {
      console.error('❌ Failed to start camera:', error);
      if (error.name === 'NotAllowedError') {
        throw new Error('Camera permission denied');
      } else if (error.name === 'NotFoundError') {
        throw new Error('No camera found');
      } else {
        throw new Error(`Camera error: ${error.message}`);
      }
    }
  }

  async stopCamera(): Promise<void> {
    console.log('🛑 Stopping camera...');
    
    this.stopDetection();
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
        console.log(`Track stopped: ${track.kind}`);
      });
      this.stream = null;
    }
    
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }

    this.resetEmotionHistory();
    console.log('✅ Camera stopped');
  }

  async startDetection(onEmotionUpdate: (emotion: EmotionData | null) => void): Promise<void> {
    if (!this.modelsLoaded) {
      console.log('🔄 Loading models before starting detection...');
      await this.loadModels();
    }

    if (!this.videoElement) {
      console.log('🔄 Starting camera before detection...');
      await this.startCamera();
    }

    if (this.isDetecting) {
      console.log('⚠️ Detection already running');
      return;
    }

    this.onEmotionCallback = onEmotionUpdate;
    this.isDetecting = true;
    this.lastDetectionTime = 0; // Reset throttle

    console.log('🚀 Starting emotion detection with game optimization...');

    // Wait for video to stabilize before starting detection
    await this.waitForVideoStability();

    // Start detection loop with throttling for game performance
    this.detectionInterval = window.setInterval(async () => {
      const now = Date.now();
      
      // Throttle detection calls to reduce CPU usage during gameplay
      if (now - this.lastDetectionTime < this.DETECTION_THROTTLE) {
        return;
      }
      
      this.lastDetectionTime = now;
      await this.detectEmotion();
    }, 200); // Check every 200ms, but throttle actual detection

    console.log('✅ Emotion detection started with game optimization');
  }

  private async waitForVideoStability(): Promise<void> {
    return new Promise((resolve) => {
      const checkStability = () => {
        if (!this.videoElement || 
            this.videoElement.videoWidth === 0 || 
            this.videoElement.videoHeight === 0 ||
            this.videoElement.readyState < 2) {
          
          this.videoStabilityChecks++;
          
          if (this.videoStabilityChecks > this.MAX_STABILITY_CHECKS) {
            console.warn('⚠️ Video stability timeout, proceeding anyway');
            resolve();
            return;
          }
          
          setTimeout(checkStability, 200);
        } else {
          console.log('✅ Video stability confirmed');
          resolve();
        }
      };
      
      checkStability();
    });
  }

  stopDetection(): void {
    console.log('🛑 Stopping emotion detection...');
    
    this.isDetecting = false;
    
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }

    this.onEmotionCallback = null;
    console.log('✅ Emotion detection stopped');
  }

  private async detectEmotion(): Promise<void> {
    if (!this.videoElement || !this.isDetecting) return;

    try {
      // Enhanced video readiness check
      if (this.videoElement.videoWidth === 0 || 
          this.videoElement.videoHeight === 0 ||
          this.videoElement.readyState < 2 ||
          this.videoElement.paused ||
          this.videoElement.ended) {
        console.warn('⚠️ Video not ready for detection');
        this.updateEmotionHistory(null);
        return;
      }

      // Use optimized detection settings for game performance
      const detections = await faceapi
        .detectAllFaces(this.videoElement, new faceapi.TinyFaceDetectorOptions({
          inputSize: 192, // Smaller input size for better performance
          scoreThreshold: 0.4 // Slightly higher threshold for stability
        }))
        .withFaceExpressions();

      if (detections.length === 0) {
        // No face detected
        this.updateEmotionHistory(null);
        return;
      }

      const expressions = detections[0].expressions;
      const emotionData = this.processExpressions(expressions);
      
      // Additional confidence filtering for game stability
      if (emotionData.confidence < 0.3) {
        this.updateEmotionHistory(null);
        return;
      }

      this.updateEmotionHistory(emotionData);
    } catch (error) {
      console.error('❌ Emotion detection error:', error);
      this.updateEmotionHistory(null);
    }
  }

  private processExpressions(expressions: faceapi.FaceExpressions): EmotionData {
    const emotionScores = {
      happy: expressions.happy,
      sad: expressions.sad,
      angry: expressions.angry,
      fearful: expressions.fearful,
      disgusted: expressions.disgusted,
      surprised: expressions.surprised,
      neutral: expressions.neutral,
    };

    // Find primary emotion with enhanced filtering
    const sortedEmotions = Object.entries(emotionScores)
      .sort(([, a], [, b]) => b - a);
    
    const [primaryEmotion, primaryScore] = sortedEmotions[0];
    const [secondaryEmotion, secondaryScore] = sortedEmotions[1];
    
    // If emotions are very close, default to neutral for stability
    if (primaryScore - secondaryScore < 0.1 && primaryScore < 0.6) {
      return {
        primary: 'neutral',
        confidence: emotionScores.neutral,
        timestamp: Date.now(),
        allEmotions: emotionScores,
      };
    }

    return {
      primary: primaryEmotion,
      confidence: primaryScore,
      timestamp: Date.now(),
      allEmotions: emotionScores,
    };
  }

  private updateEmotionHistory(newEmotion: EmotionData | null): void {
    // Update history
    this.emotionHistory.previous = this.emotionHistory.current;
    this.emotionHistory.current = newEmotion;

    // Apply enhanced smoothing for game stability
    if (newEmotion) {
      this.emotionHistory.smoothed = this.applyEnhancedSmoothing(newEmotion);
    } else {
      // Gradually fade out emotion rather than immediately clearing
      if (this.emotionHistory.smoothed) {
        const fadedEmotion = { ...this.emotionHistory.smoothed };
        fadedEmotion.confidence *= 0.8; // Fade confidence
        
        if (fadedEmotion.confidence < 0.2) {
          this.emotionHistory.smoothed = null;
        } else {
          this.emotionHistory.smoothed = fadedEmotion;
        }
      }
    }

    // Notify callback with stability check
    if (this.onEmotionCallback) {
      this.onEmotionCallback(this.emotionHistory.smoothed);
    }
  }

  private applyEnhancedSmoothing(newEmotion: EmotionData): EmotionData {
    const previous = this.emotionHistory.smoothed;
    
    // If no previous emotion, use new emotion but with reduced confidence for stability
    if (!previous) {
      return {
        ...newEmotion,
        confidence: newEmotion.confidence * 0.8 // Reduce initial confidence
      };
    }

    // If strong emotion detected, use it but still apply some smoothing
    if (newEmotion.confidence > this.STRONG_EMOTION_THRESHOLD) {
      const smoothedEmotions: any = {};
      Object.entries(newEmotion.allEmotions).forEach(([emotion, score]) => {
        const prevScore = previous.allEmotions[emotion as keyof typeof previous.allEmotions] || 0;
        smoothedEmotions[emotion] = prevScore * 0.3 + score * 0.7; // Less smoothing for strong emotions
      });

      const primaryEmotion = Object.entries(smoothedEmotions).reduce((max, [emotion, score]) => 
        score > max.score ? { emotion, score } : max,
        { emotion: 'neutral', score: 0 }
      );

      return {
        primary: primaryEmotion.emotion,
        confidence: primaryEmotion.score,
        timestamp: Date.now(),
        allEmotions: smoothedEmotions,
      };
    }

    // Apply heavy smoothing for weak emotions to prevent flickering
    const smoothedEmotions: any = {};
    Object.entries(newEmotion.allEmotions).forEach(([emotion, score]) => {
      const prevScore = previous.allEmotions[emotion as keyof typeof previous.allEmotions] || 0;
      smoothedEmotions[emotion] = prevScore * (1 - this.SMOOTH_FACTOR) + score * this.SMOOTH_FACTOR;
    });

    // Recalculate primary emotion from smoothed scores
    const primaryEmotion = Object.entries(smoothedEmotions).reduce((max, [emotion, score]) => 
      score > max.score ? { emotion, score } : max,
      { emotion: 'neutral', score: 0 }
    );

    // If confidence is too low after smoothing, default to neutral
    if (primaryEmotion.score < 0.35) {
      return {
        primary: 'neutral',
        confidence: smoothedEmotions.neutral || 0.5,
        timestamp: Date.now(),
        allEmotions: smoothedEmotions,
      };
    }

    return {
      primary: primaryEmotion.emotion,
      confidence: primaryEmotion.score,
      timestamp: Date.now(),
      allEmotions: smoothedEmotions,
    };
  }

  private resetEmotionHistory(): void {
    this.emotionHistory = {
      current: null,
      previous: null,
      smoothed: null,
    };
  }

  // Public getters
  getCurrentEmotion(): EmotionData | null {
    return this.emotionHistory.smoothed;
  }

  getVideoElement(): HTMLVideoElement | null {
    return this.videoElement;
  }

  isActive(): boolean {
    return this.isDetecting;
  }

  isReady(): boolean {
    return this.modelsLoaded && this.videoElement !== null;
  }

  // Utility method for generating emotion context for LLM
  getEmotionContext(): string {
    const emotion = this.getCurrentEmotion();
    
    if (!emotion || emotion.confidence < 0.4) {
      return '';
    }

    const confidenceLevel = emotion.confidence > 0.7 ? 'clearly' : 
                           emotion.confidence > 0.5 ? 'somewhat' : 'slightly';

    return `The player appears ${confidenceLevel} ${emotion.primary}`;
  }

  // Emotion mapping for NPC context
  getEmotionDescription(): string {
    const emotion = this.getCurrentEmotion();
    
    if (!emotion || emotion.confidence < 0.4) return 'unknown';

    const descriptions: Record<string, string> = {
      happy: 'cheerful and pleased',
      sad: 'melancholy and downcast', 
      angry: 'frustrated and irritated',
      fearful: 'anxious and worried',
      disgusted: 'displeased and repulsed',
      surprised: 'astonished and taken aback',
      neutral: 'calm and composed'
    };

    return descriptions[emotion.primary] || 'uncertain';
  }

  // Performance monitoring method
  getPerformanceStats(): { 
    isDetecting: boolean; 
    lastDetectionTime: number; 
    detectionRate: number;
    videoReady: boolean;
  } {
    return {
      isDetecting: this.isDetecting,
      lastDetectionTime: this.lastDetectionTime,
      detectionRate: this.DETECTION_THROTTLE,
      videoReady: this.videoElement ? 
        this.videoElement.videoWidth > 0 && 
        this.videoElement.videoHeight > 0 && 
        this.videoElement.readyState >= 2 : false
    };
  }
}