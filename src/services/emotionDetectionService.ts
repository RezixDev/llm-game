// ===== services/emotionDetectionService.ts =====
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

  // Smoothing parameters
  private readonly SMOOTH_FACTOR = 0.3; // Lower = more smoothing
  private readonly STRONG_EMOTION_THRESHOLD = 0.7; // Above this, use raw emotion
  
  static getInstance(): EmotionDetectionService {
    if (!EmotionDetectionService.instance) {
      EmotionDetectionService.instance = new EmotionDetectionService();
    }
    return EmotionDetectionService.instance;
  }

  async loadModels(): Promise<void> {
    if (this.modelsLoaded) return;

    try {
      console.log('Loading face-api.js models...');
      
      // Check if models exist
      const modelPaths = [
        '/models/tiny_face_detector_model-weights_manifest.json',
        '/models/face_expression_model-weights_manifest.json'
      ];

      for (const path of modelPaths) {
        try {
          const response = await fetch(path);
          if (!response.ok) {
            throw new Error(`Model not found: ${path} (${response.status})`);
          }
          console.log(`✓ Found model: ${path}`);
        } catch (error) {
          console.error(`✗ Missing model: ${path}`);
          throw error;
        }
      }
      
      // Load only the models we need for performance
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceExpressionNet.loadFromUri('/models'),
      ]);

      this.modelsLoaded = true;
      console.log('✓ Face-api.js models loaded successfully');
    } catch (error) {
      console.error('✗ Failed to load face-api.js models:', error);
      throw new Error(`Could not load emotion detection models: ${error.message}`);
    }
  }

  async startCamera(): Promise<void> {
    if (this.stream) return;

    try {
      console.log('🎥 Requesting camera access...');
      
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });

      console.log('✓ Camera access granted');

      // Create video element
      this.videoElement = document.createElement('video');
      this.videoElement.srcObject = this.stream;
      this.videoElement.autoplay = true;
      this.videoElement.muted = true;
      this.videoElement.playsInline = true;

      return new Promise((resolve, reject) => {
        this.videoElement!.onloadedmetadata = () => {
          console.log(`✓ Video ready: ${this.videoElement!.videoWidth}x${this.videoElement!.videoHeight}`);
          resolve();
        };
        
        this.videoElement!.onerror = (error) => {
          console.error('✗ Video element error:', error);
          reject(new Error('Video element failed to load'));
        };
        
        // Timeout after 10 seconds
        setTimeout(() => {
          reject(new Error('Camera initialization timeout'));
        }, 10000);
      });
    } catch (error) {
      console.error('✗ Failed to start camera:', error);
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
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }

    this.stopDetection();
    this.resetEmotionHistory();
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

    // Wait a bit for video to stabilize
    setTimeout(() => {
      // Start detection loop (every 500ms for smooth real-time feel)
      this.detectionInterval = window.setInterval(async () => {
        await this.detectEmotion();
      }, 500);

      console.log('✅ Emotion detection started');
    }, 1000); // 1 second delay to let video stabilize
  }

  stopDetection(): void {
    this.isDetecting = false;
    
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }

    this.onEmotionCallback = null;
    console.log('Emotion detection stopped');
  }

  private async detectEmotion(): Promise<void> {
    if (!this.videoElement || !this.isDetecting) return;

    try {
      // Check if video is ready
      if (this.videoElement.videoWidth === 0 || this.videoElement.videoHeight === 0) {
        console.warn('⚠️ Video not ready for emotion detection');
        return;
      }

      // Use the same detection parameters as the working debug test
      const detections = await faceapi
        .detectAllFaces(this.videoElement, new faceapi.TinyFaceDetectorOptions({
          inputSize: 224,
          scoreThreshold: 0.3 // Lower threshold like in debug test
        }))
        .withFaceExpressions();

      if (detections.length === 0) {
        // No face detected - disable emotion context
        console.log('👤 No face detected in main detection');
        this.updateEmotionHistory(null);
        return;
      }

      const expressions = detections[0].expressions;
      const emotionData = this.processExpressions(expressions);
      
      console.log('😊 Main detection - emotion:', emotionData.primary, `(${Math.round(emotionData.confidence * 100)}%)`);
      this.updateEmotionHistory(emotionData);
    } catch (error) {
      console.error('❌ Main emotion detection error:', error);
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

    // Find primary emotion
    const primaryEmotion = Object.entries(emotionScores).reduce((max, [emotion, score]) => 
      score > max.score ? { emotion, score } : max,
      { emotion: 'neutral', score: 0 }
    );

    return {
      primary: primaryEmotion.emotion,
      confidence: primaryEmotion.score,
      timestamp: Date.now(),
      allEmotions: emotionScores,
    };
  }

  private updateEmotionHistory(newEmotion: EmotionData | null): void {
    // Update history
    this.emotionHistory.previous = this.emotionHistory.current;
    this.emotionHistory.current = newEmotion;

    // Apply smoothing logic
    if (newEmotion) {
      this.emotionHistory.smoothed = this.applySmoothing(newEmotion);
    } else {
      this.emotionHistory.smoothed = null;
    }

    // Notify callback
    if (this.onEmotionCallback) {
      this.onEmotionCallback(this.emotionHistory.smoothed);
    }
  }

  private applySmoothing(newEmotion: EmotionData): EmotionData {
    const previous = this.emotionHistory.smoothed;
    
    // If no previous emotion or strong emotion detected, use raw emotion
    if (!previous || newEmotion.confidence > this.STRONG_EMOTION_THRESHOLD) {
      return newEmotion;
    }

    // Apply smoothing to emotion scores
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
    
    if (!emotion) {
      return '';
    }

    const confidenceLevel = emotion.confidence > 0.7 ? 'clearly' : 
                           emotion.confidence > 0.4 ? 'somewhat' : 'slightly';

    return `The player appears ${confidenceLevel} ${emotion.primary}`;
  }

  // Emotion mapping for NPC context
  getEmotionDescription(): string {
    const emotion = this.getCurrentEmotion();
    
    if (!emotion) return 'unknown';

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
}