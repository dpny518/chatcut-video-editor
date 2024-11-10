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
      
      if (!videoEntry || !transcriptEntry) return;
  
      this.masterTimeline.push({
          start: this.totalDuration,
          video: videoName,
          transcript: this.#getTranscriptName(videoName)
      });
  
      const adjustedTranscript = transcriptEntry.data.transcription.map(segment => ({
          ...segment,
          words: segment.words.map(word => ({
              ...word,
              masterStart: word.start + this.totalDuration,
              masterEnd: word.end + this.totalDuration
          }))
      }));
  
      this.masterTranscript.push(...adjustedTranscript);
      transcriptEntry.processed = true;
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
    
    // Create a video element to get duration
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    
    video.addEventListener('loadedmetadata', () => {
        const duration = video.duration;
        console.log('Video duration loaded:', { filename, duration });
        
        this.videoFiles.set(filename, {
            file,
            data: videoData,
            addedAt: this.totalDuration,
            duration: duration,
            transcriptName: filename.replace(/\.[^/.]+$/, '.json')
        });

        if (this.transcripts.has(this.#getTranscriptName(filename))) {
            this.#processVideoTranscriptPair(filename);
        }

        URL.revokeObjectURL(video.src);
    });

    // Set initial entry with zero duration
    this.videoFiles.set(filename, {
        file,
        data: videoData,
        addedAt: this.totalDuration,
        duration: 0,
        transcriptName: filename.replace(/\.[^/.]+$/, '.json')
    });
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
      const selectedRanges = clipIds.map(id => {
          const videoEntry = this.videoFiles.get(id);
          if (!videoEntry) return null;
          
          return {
              start: videoEntry.addedAt,
              end: videoEntry.addedAt + videoEntry.duration,
              source: {
                  file: videoEntry.file,
                  filename: id,
                  transcript: this.transcripts.get(this.#getTranscriptName(id))
              }
          };
      }).filter(Boolean);

      return {
          ranges: selectedRanges,
          totalDuration: selectedRanges.reduce((sum, range) => 
              sum + (range.end - range.start), 0),
          mergedTranscript: this.getMergedTranscript(selectedRanges)
      };
  }

  getMergedTranscript(ranges) {
      return ranges.flatMap(range => {
          return this.masterTranscript
              .filter(segment => {
                  const segmentStart = segment.words[0]?.masterStart || 0;
                  const segmentEnd = segment.words[segment.words.length - 1]?.masterEnd || 0;
                  return segmentStart >= range.start && segmentEnd <= range.end;
              })
              .map(segment => ({
                  ...segment,
                  words: segment.words.map(word => ({
                      ...word,
                      sourceFile: range.source.filename,
                      sourceTime: word.start
                  }))
              }));
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