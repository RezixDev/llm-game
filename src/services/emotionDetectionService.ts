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
  private readonly DETECTION_THROTTLE = 800;
  private readonly SMOOTH_FACTOR = 0.4;
  private readonly STRONG_EMOTION_THRESHOLD = 0.6;
  
  // Video stability flags - FIXED
  private videoStabilityChecks = 0;
  private readonly MAX_STABILITY_CHECKS = 10; // Increased from 5
  private readonly STABILITY_CHECK_INTERVAL = 500; // Increased from 200ms
  private videoReadyPromise: Promise<void> | null = null;
  
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
          frameRate: { ideal: 15, max: 20 }
        }
      });

      console.log('✅ Camera stream obtained');

      // Create and configure video element
      this.videoElement = document.createElement('video');
      this.videoElement.srcObject = this.stream;
      this.videoElement.autoplay = true;
      this.videoElement.muted = true;
      this.videoElement.playsInline = true;
      this.videoElement.style.width = '320px';
      this.videoElement.style.height = '240px';
      
      // FIXED: Better video readiness handling
      this.videoReadyPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Camera initialization timeout'));
        }, 15000); // Increased timeout

        // Multiple event handlers for better reliability
        const cleanup = () => {
          clearTimeout(timeout);
          this.videoElement?.removeEventListener('loadedmetadata', onReady);
          this.videoElement?.removeEventListener('canplay', onReady);
          this.videoElement?.removeEventListener('playing', onReady);
          this.videoElement?.removeEventListener('error', onError);
        };

        const onReady = () => {
          if (this.videoElement && 
              this.videoElement.videoWidth > 0 && 
              this.videoElement.videoHeight > 0 &&
              this.videoElement.readyState >= 2) {
            console.log(`✅ Video ready: ${this.videoElement.videoWidth}x${this.videoElement.videoHeight}, readyState: ${this.videoElement.readyState}`);
            cleanup();
            resolve();
          }
        };
        
        const onError = (error: Event) => {
          console.error('❌ Video element error:', error);
          cleanup();
          reject(new Error('Video element failed to load'));
        };

        this.videoElement!.addEventListener('loadedmetadata', onReady);
        this.videoElement!.addEventListener('canplay', onReady);
        this.videoElement!.addEventListener('playing', onReady);
        this.videoElement!.addEventListener('error', onError);

        // Force play to trigger events
        this.videoElement!.play().catch(playError => {
          console.warn('Video play failed:', playError);
          // Don't reject here, might still work
        });

        // Check immediately in case video is already ready
        setTimeout(onReady, 100);
      });

      await this.videoReadyPromise;
      this.videoStabilityChecks = 0; // Reset after successful setup
      
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

    this.videoReadyPromise = null;
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
    this.lastDetectionTime = 0;

    console.log('🚀 Starting emotion detection with game optimization...');

    // FIXED: Wait for video to be truly ready
    await this.waitForVideoStability();

    // Start detection loop
    this.detectionInterval = window.setInterval(async () => {
      const now = Date.now();
      
      if (now - this.lastDetectionTime < this.DETECTION_THROTTLE) {
        return;
      }
      
      this.lastDetectionTime = now;
      await this.detectEmotion();
    }, 200);

    console.log('✅ Emotion detection started with game optimization');
  }

  // FIXED: Enhanced video stability checking
  private async waitForVideoStability(): Promise<void> {
    return new Promise((resolve) => {
      this.videoStabilityChecks = 0;
      
      const checkStability = () => {
        if (!this.videoElement) {
          console.warn('⚠️ No video element during stability check');
          resolve();
          return;
        }

        const isReady = 
          this.videoElement.videoWidth > 0 && 
          this.videoElement.videoHeight > 0 &&
          this.videoElement.readyState >= 2 &&
          !this.videoElement.paused &&
          !this.videoElement.ended;

        console.log(`🔍 Video stability check ${this.videoStabilityChecks + 1}:`, {
          width: this.videoElement.videoWidth,
          height: this.videoElement.videoHeight,
          readyState: this.videoElement.readyState,
          paused: this.videoElement.paused,
          ended: this.videoElement.ended,
          isReady
        });

        if (isReady) {
          console.log('✅ Video stability confirmed');
          resolve();
          return;
        }
        
        this.videoStabilityChecks++;
        
        if (this.videoStabilityChecks >= this.MAX_STABILITY_CHECKS) {
          console.warn('⚠️ Video stability timeout, proceeding anyway');
          resolve();
          return;
        }
        
        setTimeout(checkStability, this.STABILITY_CHECK_INTERVAL);
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

  // FIXED: Enhanced video readiness check with better error handling
  private async detectEmotion(): Promise<void> {
    if (!this.videoElement || !this.isDetecting) return;

    try {
      // More comprehensive video readiness check
      const videoReady = 
        this.videoElement.videoWidth > 0 && 
        this.videoElement.videoHeight > 0 &&
        this.videoElement.readyState >= 2 &&
        !this.videoElement.paused &&
        !this.videoElement.ended &&
        !this.videoElement.seeking;

      if (!videoReady) {
        // Log detailed status for debugging
        console.warn('⚠️ Video not ready for detection:', {
          width: this.videoElement.videoWidth,
          height: this.videoElement.videoHeight,
          readyState: this.videoElement.readyState,
          paused: this.videoElement.paused,
          ended: this.videoElement.ended,
          seeking: this.videoElement.seeking,
          currentTime: this.videoElement.currentTime
        });
        
        // Try to resume video if paused
        if (this.videoElement.paused && !this.videoElement.ended) {
          try {
            await this.videoElement.play();
            console.log('🔄 Resumed paused video');
          } catch (playError) {
            console.warn('Failed to resume video:', playError);
          }
        }
        
        this.updateEmotionHistory(null);
        return;
      }

      // Perform face detection
      const detections = await faceapi
        .detectAllFaces(this.videoElement, new faceapi.TinyFaceDetectorOptions({
          inputSize: 192,
          scoreThreshold: 0.4
        }))
        .withFaceExpressions();

      if (detections.length === 0) {
        this.updateEmotionHistory(null);
        return;
      }

      const expressions = detections[0].expressions;
      const emotionData = this.processExpressions(expressions);
      
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

    const sortedEmotions = Object.entries(emotionScores)
      .sort(([, a], [, b]) => b - a);
    
    const [primaryEmotion, primaryScore] = sortedEmotions[0];
    const [secondaryEmotion, secondaryScore] = sortedEmotions[1];
    
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
    this.emotionHistory.previous = this.emotionHistory.current;
    this.emotionHistory.current = newEmotion;

    if (newEmotion) {
      this.emotionHistory.smoothed = this.applyEnhancedSmoothing(newEmotion);
    } else {
      if (this.emotionHistory.smoothed) {
        const fadedEmotion = { ...this.emotionHistory.smoothed };
        fadedEmotion.confidence *= 0.8;
        
        if (fadedEmotion.confidence < 0.2) {
          this.emotionHistory.smoothed = null;
        } else {
          this.emotionHistory.smoothed = fadedEmotion;
        }
      }
    }

    if (this.onEmotionCallback) {
      this.onEmotionCallback(this.emotionHistory.smoothed);
    }
  }

  private applyEnhancedSmoothing(newEmotion: EmotionData): EmotionData {
    const previous = this.emotionHistory.smoothed;
    
    if (!previous) {
      return {
        ...newEmotion,
        confidence: newEmotion.confidence * 0.8
      };
    }

    if (newEmotion.confidence > this.STRONG_EMOTION_THRESHOLD) {
      const smoothedEmotions: any = {};
      Object.entries(newEmotion.allEmotions).forEach(([emotion, score]) => {
        const prevScore = previous.allEmotions[emotion as keyof typeof previous.allEmotions] || 0;
        smoothedEmotions[emotion] = prevScore * 0.3 + score * 0.7;
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

    const smoothedEmotions: any = {};
    Object.entries(newEmotion.allEmotions).forEach(([emotion, score]) => {
      const prevScore = previous.allEmotions[emotion as keyof typeof previous.allEmotions] || 0;
      smoothedEmotions[emotion] = prevScore * (1 - this.SMOOTH_FACTOR) + score * this.SMOOTH_FACTOR;
    });

    const primaryEmotion = Object.entries(smoothedEmotions).reduce((max, [emotion, score]) => 
      score > max.score ? { emotion, score } : max,
      { emotion: 'neutral', score: 0 }
    );

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
    return this.modelsLoaded && this.videoElement !== null && 
           this.videoElement.videoWidth > 0 && this.videoElement.videoHeight > 0;
  }

  getEmotionContext(): string {
    const emotion = this.getCurrentEmotion();
    
    if (!emotion || emotion.confidence < 0.4) {
      return '';
    }

    const confidenceLevel = emotion.confidence > 0.7 ? 'clearly' : 
                           emotion.confidence > 0.5 ? 'somewhat' : 'slightly';

    return `The player appears ${confidenceLevel} ${emotion.primary}`;
  }

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

  // FIXED: Enhanced performance monitoring
  getPerformanceStats(): { 
    isDetecting: boolean; 
    lastDetectionTime: number; 
    detectionRate: number;
    videoReady: boolean;
    videoDetails: any;
  } {
    const videoDetails = this.videoElement ? {
      width: this.videoElement.videoWidth,
      height: this.videoElement.videoHeight,
      readyState: this.videoElement.readyState,
      paused: this.videoElement.paused,
      ended: this.videoElement.ended,
      currentTime: this.videoElement.currentTime,
      duration: this.videoElement.duration
    } : null;

    return {
      isDetecting: this.isDetecting,
      lastDetectionTime: this.lastDetectionTime,
      detectionRate: this.DETECTION_THROTTLE,
      videoReady: this.videoElement ? 
        this.videoElement.videoWidth > 0 && 
        this.videoElement.videoHeight > 0 && 
        this.videoElement.readyState >= 2 &&
        !this.videoElement.paused &&
        !this.videoElement.ended : false,
      videoDetails
    };
  }
}