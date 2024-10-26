import { TimelineReference } from './reference';

/**
 * Core timeline types
 */

/**
 * Main Timeline interface
 */
export interface Timeline {
  id: string;
  name: string;
  clips: Clip[];
  settings: TimelineSettings;
  references: TimelineReference[];
  metadata: TimelineMetadata;
  state: TimelineState;
}

/**
 * Timeline metadata
 */
export interface TimelineMetadata {
  created: number;
  modified: number;
  author?: string;
  version: string;
  description?: string;
  tags: string[];
  duration: number;
  totalClips: number;
  lastExported?: number;
}

/**
 * Timeline runtime state
 */
export interface TimelineState {
  selectedClipId: string | null;
  playing: boolean;
  currentTime: number;
  zoom: {
    level: number;
    center: number;
  };
  visible: {
    start: number;
    end: number;
  };
}

/**
 * Timeline settings
 */
export interface TimelineSettings {
  scale: number;
  effects: Record<string, Effect>;
  snapping: {
    enabled: boolean;
    threshold: number;
  };
  autoScroll: boolean;
  thumbnails: {
    enabled: boolean;
    quality: 'low' | 'medium' | 'high';
    width: number;
  };
  tracks: {
    height: number;
    minCount: number;
    labels: boolean;
  };
  markers: {
    enabled: boolean;
    snapTo: boolean;
  };
}

/**
 * Clip interface
 */
export interface Clip {
  id: string;
  source: ClipSource;
  timeline: ClipTimelineData;
  effects: ClipEffect[];
  transitions: {
    in?: Transition;
    out?: Transition;
  };
  metadata: ClipMetadata;
}

/**
 * Clip source data
 */
export interface ClipSource {
  type: 'bin' | 'timeline';
  id: string;
  file?: File;
  startTime: number;
  endTime: number;
  duration: number;
  originalDuration: number;
}

/**
 * Clip position data
 */
export interface ClipTimelineData {
  start: number;
  end: number;
  track: number;
  trimmed: {
    start: number;
    end: number;
  };
  speed: number;
  locked: boolean;
}

/**
 * Clip metadata
 */
export interface ClipMetadata {
  name: string;
  created: number;
  modified: number;
  favorite: boolean;
  tags: string[];
  notes: string;
  markers: ClipMarker[];
  thumbnail?: string;
}

/**
 * Clip marker
 */
export interface ClipMarker {
  id: string;
  time: number;
  label: string;
  color: string;
  notes?: string;
}

/**
 * Effect interface
 */
export interface Effect {
  id: string;
  type: EffectType;
  params: Record<string, any>;
  keyframes: Keyframe[];
  enabled: boolean;
  startTime: number;
  endTime: number;
}

/**
 * Effect types
 */
export type EffectType =
  | 'transform'
  | 'color'
  | 'audio'
  | 'filter'
  | 'text'
  | 'overlay'
  | 'transition';

/**
 * Keyframe interface
 */
export interface Keyframe {
  time: number;
  value: any;
  easing: EasingFunction;
}

/**
 * Easing function types
 */
export type EasingFunction =
  | 'linear'
  | 'easeInQuad'
  | 'easeOutQuad'
  | 'easeInOutQuad'
  | 'easeInCubic'
  | 'easeOutCubic'
  | 'easeInOutCubic';

/**
 * Clip effect
 */
export interface ClipEffect extends Effect {
  clipId: string;
  layer: number;
  mask?: {
    type: 'alpha' | 'luma' | 'shape';
    source?: string;
    inverted: boolean;
  };
}

/**
 * Transition interface
 */
export interface Transition {
  id: string;
  type: TransitionType;
  duration: number;
  params: Record<string, any>;
}

/**
 * Transition types
 */
export type TransitionType =
  | 'cut'
  | 'dissolve'
  | 'fade'
  | 'wipe'
  | 'slide'
  | 'custom';

/**
 * Timeline operation types
 */
export type TimelineOperation =
  | 'add'
  | 'remove'
  | 'move'
  | 'trim'
  | 'split'
  | 'merge'
  | 'effect'
  | 'transition';

/**
 * Timeline operation parameters
 */
export interface TimelineOperationParams {
  type: TimelineOperation;
  timelineId: string;
  clipIds: string[];
  data?: any;
  options?: {
    preserveGaps?: boolean;
    rippleEdit?: boolean;
    snapToGrid?: boolean;
  };
}

/**
 * Timeline operation result
 */
export interface TimelineOperationResult {
  success: boolean;
  timeline: Timeline;
  clips?: Clip[];
  error?: TimelineError;
  warnings?: TimelineWarning[];
}

/**
 * Timeline error
 */
export interface TimelineError {
  code: TimelineErrorCode;
  message: string;
  details?: any;
}

/**
 * Timeline error codes
 */
export type TimelineErrorCode =
  | 'INVALID_OPERATION'
  | 'CLIP_NOT_FOUND'
  | 'INVALID_TIME_RANGE'
  | 'TRACK_OVERLAP'
  | 'CIRCULAR_REFERENCE'
  | 'UNSUPPORTED_EFFECT'
  | 'INVALID_TRANSITION';

/**
 * Timeline warning
 */
export interface TimelineWarning {
  code: TimelineWarningCode;
  message: string;
  recommendation?: string;
}

/**
 * Timeline warning codes
 */
export type TimelineWarningCode =
  | 'PERFORMANCE_IMPACT'
  | 'COMPLEX_EFFECT'
  | 'LONG_DURATION'
  | 'TRACK_CONGESTION';

/**
 * Timeline export settings
 */
export interface TimelineExportSettings {
  format: 'mp4' | 'webm' | 'gif';
  quality: 'draft' | 'preview' | 'final';
  resolution: {
    width: number;
    height: number;
  };
  frameRate: number;
  audio: {
    codec: string;
    bitrate: number;
  };
  video: {
    codec: string;
    bitrate: number;
  };
}

/**
 * Timeline event
 */
export interface TimelineEvent {
  type: TimelineEventType;
  timelineId: string;
  clipId?: string;
  data?: any;
  timestamp: number;
}

/**
 * Timeline event types
 */
export type TimelineEventType =
  | 'clip.added'
  | 'clip.removed'
  | 'clip.moved'
  | 'clip.trimmed'
  | 'clip.split'
  | 'clip.merged'
  | 'effect.added'
  | 'effect.removed'
  | 'effect.modified'
  | 'transition.changed'
  | 'timeline.exported';

/**
 * Timeline manager interface
 */
export interface TimelineManager {
  createTimeline(name: string): Timeline;
  deleteTimeline(id: string): boolean;
  performOperation(params: TimelineOperationParams): TimelineOperationResult;
  exportTimeline(id: string, settings: TimelineExportSettings): Promise<Blob>;
  getTimelineState(id: string): TimelineState;
  subscribeToEvents(callback: (event: TimelineEvent) => void): () => void;
}