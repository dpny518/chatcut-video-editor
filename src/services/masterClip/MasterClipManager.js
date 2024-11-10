// services/masterClip/MasterClipManager.js
export class MasterClipManager {
  constructor() {
      this.videoFiles = new Map();
      this.transcripts = new Map();
      this.masterTimeline = [];
      this.masterTranscript = [];
      this.totalDuration = 0;
  }

  // Private helper methods
  #getVideoName(transcriptName) {
      return transcriptName.replace('.json', '.mp4');
  }

  #getTranscriptName(videoName) {
      return videoName.replace(/\.[^/.]+$/, '.json');
  }

  #createSingleClip(sourceInfo, endSourceInfo, selectionStart, selectionEnd) {
      return {
          id: `clip-${Date.now()}`,
          file: sourceInfo.file,
          name: sourceInfo.filename,
          startTime: sourceInfo.time,
          endTime: endSourceInfo.time,
          duration: endSourceInfo.time - sourceInfo.time,
          source: {
              startTime: 0,
              endTime: this.videoFiles.get(sourceInfo.filename).duration,
              duration: this.videoFiles.get(sourceInfo.filename).duration
          },
          transcript: this.getTranscriptSegment(selectionStart, selectionEnd)
      };
  }

  #createMergedClip(selectionStart, selectionEnd) {
      const segments = this.#getClipSegments(selectionStart, selectionEnd);
      return {
          id: `merged-${Date.now()}`,
          type: 'merged',
          segments,
          duration: selectionEnd - selectionStart,
          transcript: this.getTranscriptSegment(selectionStart, selectionEnd)
      };
  }

  #processVideoTranscriptPair(videoName) {
    const videoEntry = this.videoFiles.get(videoName);
    const transcriptEntry = this.transcripts.get(this.#getTranscriptName(videoName));
    
    if (!videoEntry || !transcriptEntry) {
        console.log('Cannot process pair, missing:', { 
            videoName,
            hasVideo: !!videoEntry, 
            hasTranscript: !!transcriptEntry 
        });
        return;
    }

    console.log('Processing video-transcript pair:', {
        video: videoName,
        addedAt: videoEntry.addedAt,
        duration: videoEntry.duration
    });

    // Adjust transcript timestamps
    const adjustedTranscript = transcriptEntry.data.transcription.map(segment => ({
        ...segment,
        originalStart: segment.words[0].start,
        words: segment.words.map(word => ({
            ...word,
            originalStart: word.start,
            masterStart: word.start + videoEntry.addedAt,
            masterEnd: word.end + videoEntry.addedAt
        }))
    }));

    console.log('Adjusting transcript timestamps:', {
        videoName,
        offset: videoEntry.addedAt,
        segments: adjustedTranscript.length
    });

    this.masterTranscript.push(...adjustedTranscript);
    transcriptEntry.processed = true;

    console.log('Master timeline status:', {
        totalDuration: this.totalDuration,
        totalSegments: this.masterTranscript.length,
        totalWords: this.masterTranscript.reduce((sum, seg) => sum + seg.words.length, 0),
        videos: Array.from(this.videoFiles.keys())
    });
  }
  #recalculateTimeline() {
      let position = 0;
      for (const [filename, entry] of this.videoFiles.entries()) {
          entry.addedAt = position;
          position += entry.duration;
      }
      this.totalDuration = position;
      this.#rebuildMasterTimeline();
  }

  #rebuildMasterTimeline() {
      this.masterTimeline = [];
      this.masterTranscript = [];
      
      for (const [filename] of this.videoFiles.entries()) {
          if (this.transcripts.has(this.#getTranscriptName(filename))) {
              this.#processVideoTranscriptPair(filename);
          }
      }
  }
  #findGaps(ranges) {
    const gaps = [];
    for (let i = 0; i < ranges.length - 1; i++) {
        const gap = {
            start: ranges[i].end,
            end: ranges[i + 1].start,
            duration: ranges[i + 1].start - ranges[i].end
        };
        if (gap.duration > 0) {
            gaps.push(gap);
        }
    }
    return gaps;
}

  #getClipSegments(start, end) {
      const segments = [];
      let currentTime = start;

      while (currentTime < end) {
          const sourceInfo = this.getSourceFromMasterPosition(currentTime);
          if (!sourceInfo) break;

          const videoEntry = this.videoFiles.get(sourceInfo.filename);
          const segmentEnd = Math.min(
              videoEntry.addedAt + videoEntry.duration,
              end
          );

          segments.push({
              file: sourceInfo.file,
              filename: sourceInfo.filename,
              sourceStart: sourceInfo.time,
              sourceEnd: sourceInfo.time + (segmentEnd - currentTime),
              masterStart: currentTime,
              masterEnd: segmentEnd
          });

          currentTime = segmentEnd;
      }

      return segments;
  }

  // Public methods
  
  hasVideo(filename) {
      return this.videoFiles.has(filename);
  }

  hasTranscript(filename) {
      return this.transcripts.has(filename);
  }

  addVideo(file, videoData) {
    console.log('Adding video:', { file, videoData });
    const filename = file.name;
    
    // Set initial entry first
    const initialEntry = {
        file,
        data: videoData,
        addedAt: this.totalDuration,
        duration: 0,
        transcriptName: filename.replace(/\.[^/.]+$/, '.json')
    };
    this.videoFiles.set(filename, initialEntry);
    
    // Create a video element to get duration
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    
    video.addEventListener('loadedmetadata', () => {
        const duration = video.duration;
        console.log('Video duration loaded:', { filename, duration });
        
        // Update the entry with actual duration
        initialEntry.duration = duration;
        this.totalDuration += duration;

        console.log('Updated master timeline:', {
            filename,
            addedAt: initialEntry.addedAt,
            duration: initialEntry.duration,
            totalDuration: this.totalDuration
        });

        // Process transcript if available
        if (this.transcripts.has(this.#getTranscriptName(filename))) {
            this.#processVideoTranscriptPair(filename);
        }

        URL.revokeObjectURL(video.src);
        this.#recalculateTimeline();
    });

    // Add error handler
    video.addEventListener('error', (error) => {
        console.error('Error loading video duration:', error);
        URL.revokeObjectURL(video.src);
    });

    // Set the source last, after handlers are set up
    video.src = URL.createObjectURL(file);
}

  addTranscript(filename, transcriptData) {
      this.transcripts.set(filename, {
          data: transcriptData,
          videoName: filename.replace('.json', '.mp4'),
          processed: false
      });
  
      if (this.videoFiles.has(this.#getVideoName(filename))) {
          this.#processVideoTranscriptPair(this.#getVideoName(filename));
      }
  }


  getClipMasterPosition(filename, start, end) {
    const videoEntry = this.videoFiles.get(filename);
    if (!videoEntry) {
        console.warn('No video entry found:', { filename });
        return null;
    }

    // If end is not provided, use video duration
    const clipEnd = end || videoEntry.duration;
    const clipStart = start || 0;

    console.log('Getting clip master position:', { 
        filename, 
        start: clipStart, 
        end: clipEnd,
        videoEntry 
    });

    return {
        start: videoEntry.addedAt + clipStart,
        end: videoEntry.addedAt + clipEnd,
        sourceVideo: filename,
        sourceRange: { start: clipStart, end: clipEnd }
    };
}

  getSourceFromMasterPosition(masterTime) {
      for (const [filename, entry] of this.videoFiles.entries()) {
          if (masterTime >= entry.addedAt && masterTime < entry.addedAt + entry.duration) {
              const relativeTime = masterTime - entry.addedAt;
              return {
                  filename,
                  time: relativeTime,
                  file: entry.file,
                  transcript: this.transcripts.get(this.#getTranscriptName(filename))
              };
          }
      }
      return null;
  }

  getSelectedContent(clipIds) {
    console.log('Creating merged view for selected clips:', clipIds);

    // First get the full timeline structure
    const allClips = Array.from(this.videoFiles.entries())
        .map(([filename, entry]) => ({
            filename,
            start: entry.addedAt,
            end: entry.addedAt + entry.duration,
            duration: entry.duration
        }))
        .sort((a, b) => a.start - b.start);

    console.log('Full timeline structure:', allClips);

    // Get selected clips and their positions in master timeline
    const selectedRanges = clipIds.map(id => {
        const videoEntry = this.videoFiles.get(id);
        if (!videoEntry) return null;

        return {
            start: videoEntry.addedAt,
            end: videoEntry.addedAt + videoEntry.duration,
            duration: videoEntry.duration,
            source: {
                file: videoEntry.file,
                filename: id,
                transcript: this.transcripts.get(this.#getTranscriptName(id))
            },
            originalPosition: videoEntry.addedAt // Keep track of original position
        };
    }).filter(Boolean).sort((a, b) => a.start - b.start);

    console.log('Selected ranges with original positions:', selectedRanges);

    // Create continuous timeline for selected clips
    let continuousPosition = 0;
    const continuousRanges = selectedRanges.map(range => {
        const newRange = {
            ...range,
            continuousStart: continuousPosition,
            continuousEnd: continuousPosition + range.duration,
            // Keep original position for transcript mapping
            originalStart: range.start,
            originalEnd: range.end
        };
        continuousPosition += range.duration;
        return newRange;
    });

    console.log('Continuous ranges:', continuousRanges);

    // Get transcripts with adjusted timestamps
    const mergedTranscript = this.getMergedTranscript(continuousRanges);

    const mergedContent = {
        ranges: continuousRanges,
        totalDuration: continuousPosition,
        mergedTranscript,
        originalTotalDuration: this.totalDuration,
        gaps: this.#findGaps(selectedRanges)
    };

    console.log('Final merged content:', {
        continuousDuration: mergedContent.totalDuration,
        originalDuration: mergedContent.originalTotalDuration,
        rangeCount: mergedContent.ranges.length,
        gaps: mergedContent.gaps
    });

    return mergedContent;
}


getMergedTranscript(continuousRanges) {
  return continuousRanges.flatMap(range => {
      // Get transcript segments for this range
      const segments = this.masterTranscript
          .filter(segment => {
              const segmentStart = segment.words[0]?.masterStart || 0;
              const segmentEnd = segment.words[segment.words.length - 1]?.masterEnd || 0;
              return segmentStart >= range.originalStart && segmentEnd <= range.originalEnd;
          })
          .map(segment => ({
              ...segment,
              words: segment.words.map(word => {
                  // Adjust timestamps to continuous timeline
                  const offset = word.masterStart - range.originalStart;
                  return {
                      ...word,
                      masterStart: range.continuousStart + offset,
                      masterEnd: range.continuousStart + (word.masterEnd - word.masterStart),
                      sourceFile: range.source.filename,
                      sourceTime: word.start,
                      originalTime: word.masterStart
                  };
              })
          }));

      console.log(`Adjusted transcript for ${range.source.filename}:`, {
          originalRange: `${range.originalStart}-${range.originalEnd}`,
          continuousRange: `${range.continuousStart}-${range.continuousEnd}`,
          segmentCount: segments.length
      });

      return segments;
  });
}

  getTranscriptSegment(start, end) {
      return this.masterTranscript
          .filter(segment => {
              const segmentStart = segment.words[0]?.masterStart || 0;
              const segmentEnd = segment.words[segment.words.length - 1]?.masterEnd || 0;
              return segmentStart >= start && segmentEnd <= end;
          })
          .map(segment => ({
              ...segment,
              words: segment.words.filter(word => 
                  word.masterStart >= start && word.masterEnd <= end
              )
          }));
  }

  createTimelineClip(clipData) {
    console.log('Creating timeline clip:', clipData);

    // Handle direct time range selection
    if (clipData.startTime !== undefined && clipData.endTime !== undefined) {
        const videoEntry = this.videoFiles.get(clipData.name);
        if (!videoEntry) {
            console.warn('No video entry found for clip:', clipData.name);
            return null;
        }

        const masterStart = videoEntry.addedAt + clipData.startTime;
        const masterEnd = videoEntry.addedAt + clipData.endTime;

        return {
            id: clipData.id || `clip-${Date.now()}`,
            file: clipData.file,
            name: clipData.name,
            startTime: clipData.startTime,
            endTime: clipData.endTime,
            duration: clipData.endTime - clipData.startTime,
            source: {
                startTime: 0,
                endTime: videoEntry.duration,
                duration: videoEntry.duration
            },
            transcript: clipData.transcript || this.getTranscriptSegment(masterStart, masterEnd),
            metadata: {
                timeline: {
                    start: 0,  // Will be adjusted by timeline manager
                    end: clipData.endTime - clipData.startTime,
                    duration: clipData.endTime - clipData.startTime
                },
                playback: {
                    start: clipData.startTime,
                    end: clipData.endTime,
                    duration: clipData.endTime - clipData.startTime
                }
            }
        };
    }

    // Handle master timeline selection
    const sourceInfo = this.getSourceFromMasterPosition(clipData.masterStart);
    if (!sourceInfo) {
        console.warn('No source info found for master position:', clipData.masterStart);
        return null;
    }

    const endSourceInfo = this.getSourceFromMasterPosition(clipData.masterEnd);
    if (sourceInfo.filename === endSourceInfo?.filename) {
        return this.#createSingleClip(sourceInfo, endSourceInfo, clipData.masterStart, clipData.masterEnd);
    }

    return this.#createMergedClip(clipData.masterStart, clipData.masterEnd);
}

  setVideoDuration(filename, duration) {
      const videoEntry = this.videoFiles.get(filename);
      if (videoEntry) {
          videoEntry.duration = duration;
          this.#recalculateTimeline();
      }
  }

  getTranscriptForClip(filename) {
      const transcriptName = this.#getTranscriptName(filename);
      const transcript = this.transcripts.get(transcriptName);
      if (!transcript) return null;

      return transcript.data;
  }

  getClipWords(filename) {
      const transcript = this.getTranscriptForClip(filename);
      if (!transcript) return [];

      return transcript.transcription.flatMap(segment => segment.words);
  }

  getClipTranscriptSegment(filename, start, end) {
      const transcript = this.getTranscriptForClip(filename);
      if (!transcript) return null;

      const videoEntry = this.videoFiles.get(filename);
      if (!videoEntry) return null;

      const masterStart = videoEntry.addedAt + start;
      const masterEnd = videoEntry.addedAt + end;

      return transcript.transcription
          .map(segment => ({
              ...segment,
              words: segment.words.filter(word => {
                  const masterWordStart = word.start + videoEntry.addedAt;
                  const masterWordEnd = word.end + videoEntry.addedAt;
                  return masterWordStart >= masterStart && masterWordEnd <= masterEnd;
              })
          }))
          .filter(segment => segment.words.length > 0);
  }

  getTranscriptState(filename) {
      const transcript = this.getTranscriptForClip(filename);
      const videoEntry = this.videoFiles.get(filename);
      
      if (!transcript || !videoEntry) return null;

      return {
          transcript,
          masterOffset: videoEntry.addedAt,
          duration: videoEntry.duration,
          hasProcessed: this.transcripts.get(this.#getTranscriptName(filename))?.processed || false
      };
  }

  
  // Optional cleanup method
  cleanup() {
      this.videoFiles.clear();
      this.transcripts.clear();
      this.masterTimeline = [];
      this.masterTranscript = [];
      this.totalDuration = 0;
  }
}