/**
 * Core reference types for timeline system
 */

/**
 * Source types for timeline references
 */
export type ReferenceSourceType = 'bin' | 'timeline';

/**
 * Base reference interface
 */
export interface TimelineReference {
  id: string;
  type: ReferenceSourceType;
  sourceId: string;
  targetId: string;
  clipId: string;
  timestamp: number;
  metadata: ReferenceMetadata;
}

/**
 * Reference metadata containing additional information
 */
export interface ReferenceMetadata {
  created: number;
  modified: number;
  name?: string;
  description?: string;
  author?: string;
  version?: string;
  tags?: string[];
}

/**
 * Specific reference type for bin sources
 */
export interface BinReference extends TimelineReference {
  type: 'bin';
  binMetadata: {
    originalFileName: string;
    fileSize: number;
    fileType: string;
    duration: number;
  };
}

/**
 * Specific reference type for timeline sources
 */
export interface TimelineSourceReference extends TimelineReference {
  type: 'timeline';
  sourceMetadata: {
    sourceTimelineId: string;
    sourceClipId: string;
    sourceStartTime: number;
    sourceEndTime: number;
    sourceTrack: number;
  };
}

/**
 * Reference creation parameters
 */
export interface CreateReferenceParams {
  sourceType: ReferenceSourceType;
  sourceId: string;
  targetId: string;
  clipId: string;
  metadata?: Partial<ReferenceMetadata>;
  timeRange?: {
    start: number;
    end: number;
  };
}

/**
 * Reference update parameters
 */
export interface UpdateReferenceParams {
  referenceId: string;
  updates: Partial<TimelineReference>;
}

/**
 * Reference validation result
 */
export interface ReferenceValidationResult {
  valid: boolean;
  errors: ReferenceError[];
  warnings: ReferenceWarning[];
}

/**
 * Reference error types
 */
export type ReferenceErrorCode = 
  | 'CIRCULAR_REFERENCE'
  | 'INVALID_SOURCE'
  | 'INVALID_TARGET'
  | 'MISSING_CLIP'
  | 'INVALID_TIME_RANGE'
  | 'BROKEN_REFERENCE'
  | 'DUPLICATE_REFERENCE'
  | 'UNSUPPORTED_OPERATION';

/**
 * Reference warning types
 */
export type ReferenceWarningCode =
  | 'POTENTIAL_CIRCULAR'
  | 'LONG_REFERENCE_CHAIN'
  | 'DUPLICATE_CONTENT'
  | 'PERFORMANCE_IMPACT'
  | 'COMPLEX_DEPENDENCY';

/**
 * Reference error object
 */
export interface ReferenceError {
  code: ReferenceErrorCode;
  message: string;
  details?: any;
  path?: string[];
}

/**
 * Reference warning object
 */
export interface ReferenceWarning {
  code: ReferenceWarningCode;
  message: string;
  details?: any;
  recommendation?: string;
}

/**
 * Reference chain representing dependency path
 */
export interface ReferenceChain {
  path: Array<{
    timelineId: string;
    clipId: string;
    referenceId: string;
  }>;
  depth: number;
  circular: boolean;
}

/**
 * Reference query parameters
 */
export interface ReferenceQueryParams {
  sourceType?: ReferenceSourceType;
  sourceId?: string;
  targetId?: string;
  timeRange?: {
    start: number;
    end: number;
  };
  metadata?: Partial<ReferenceMetadata>;
  limit?: number;
  offset?: number;
}

/**
 * Reference event types for monitoring changes
 */
export type ReferenceEventType =
  | 'reference.created'
  | 'reference.updated'
  | 'reference.deleted'
  | 'reference.validated'
  | 'reference.error';

/**
 * Reference event object
 */
export interface ReferenceEvent {
  type: ReferenceEventType;
  referenceId: string;
  timestamp: number;
  data?: any;
  error?: ReferenceError;
}

/**
 * Reference stats for analytics
 */
export interface ReferenceStats {
  totalReferences: number;
  binReferences: number;
  timelineReferences: number;
  averageChainLength: number;
  maxChainLength: number;
  circularReferences: number;
  brokenReferences: number;
}

/**
 * Reference permission levels
 */
export type ReferencePermission =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'validate'
  | 'manage';

/**
 * Reference access control
 */
export interface ReferenceAccess {
  userId: string;
  referenceId: string;
  permissions: ReferencePermission[];
  granted: number;
  expires?: number;
}

/**
 * Reference operation result
 */
export interface ReferenceOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: ReferenceError;
  warnings?: ReferenceWarning[];
  metadata?: {
    duration: number;
    timestamp: number;
  };
}

/**
 * Reference batch operation parameters
 */
export interface ReferenceBatchOperation {
  operations: Array<{
    type: 'create' | 'update' | 'delete';
    params: CreateReferenceParams | UpdateReferenceParams | string;
  }>;
  options?: {
    atomic: boolean;
    validateAll: boolean;
    rollbackOnError: boolean;
  };
}

/**
 * Reference management interface
 */
export interface ReferenceManager {
  createReference(params: CreateReferenceParams): Promise<ReferenceOperationResult<TimelineReference>>;
  updateReference(params: UpdateReferenceParams): Promise<ReferenceOperationResult<TimelineReference>>;
  deleteReference(id: string): Promise<ReferenceOperationResult<void>>;
  validateReference(id: string): Promise<ReferenceValidationResult>;
  getReferences(params: ReferenceQueryParams): Promise<TimelineReference[]>;
  getReferenceChain(referenceId: string): Promise<ReferenceChain>;
  getReferenceStats(): Promise<ReferenceStats>;
}