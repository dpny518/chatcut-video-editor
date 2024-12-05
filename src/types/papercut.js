/**
 * @typedef {Object} PapercutWord
 * @property {string} id - Unique identifier for the word
 * @property {string} text - The word text
 * @property {number} start_time - Original start time if available
 * @property {number} end_time - Original end time if available
 * @property {Object} sourceReference
 * @property {string} sourceReference.fileId - Original file ID
 * @property {string} sourceReference.segmentId - Original segment ID
 * @property {number} sourceReference.wordIndex - Original word index
 */

/**
 * @typedef {Object} PapercutSegment
 * @property {string} id - Unique identifier for the segment
 * @property {string} speaker - Speaker identifier
 * @property {PapercutWord[]} words - Array of words in the segment
 * @property {Object} sourceReference
 * @property {string} sourceReference.fileId - Original file ID
 * @property {string} sourceReference.segmentId - Original segment ID
 */

/**
 * @typedef {Object} Papercut
 * @property {string} id - Unique identifier for the papercut
 * @property {string} name - Display name
 * @property {PapercutSegment[]} segments - Array of segments
 * @property {Object} metadata
 * @property {string[]} sourceFiles - Array of source file IDs
 * @property {Date} created - Creation timestamp
 * @property {Date} modified - Last modified timestamp
 * @property {Object} editHistory - History of modifications
 */