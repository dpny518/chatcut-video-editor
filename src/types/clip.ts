// types/clip.ts
export type Clip = {
    id: string;
    file: File;
    name: string;
    startTime: number;
    endTime: number;
    duration: number;
    rowIndex?: number; // Track which row the clip is on
  };
  
  export type TimelineAction = {
    id: string;
    start: number;
    end: number;
    data: Clip;
  };
  
  export type TimelineRow = {
    id: string;
    actions: TimelineAction[];
  };