import React, { useState, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const Export = ({ clips }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const ffmpegRef = useRef(new FFmpeg());

  const load = async () => {
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on('log', ({ message }) => {
      console.log(message);
    });
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    setLoaded(true);
  };

  const exportVideo = async () => {
    setIsExporting(true);
    const ffmpeg = ffmpegRef.current;

    if (!loaded) {
      await load();
    }

    const outputName = 'output.mp4';
    let filterComplex = '';
    let inputs = '';

    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      const inputName = `input${i}.mp4`;
      await ffmpeg.writeFile(inputName, await fetchFile(clip.file));
      inputs += `-i ${inputName} `;
      filterComplex += `[${i}:v]trim=start=${clip.startTime}:end=${clip.endTime},setpts=PTS-STARTPTS[v${i}]; `;
      filterComplex += `[${i}:a]atrim=start=${clip.startTime}:end=${clip.endTime},asetpts=PTS-STARTPTS[a${i}]; `;
    }

    for (let i = 0; i < clips.length; i++) {
      filterComplex += `[v${i}][a${i}]`;
    }

    filterComplex += `concat=n=${clips.length}:v=1:a=1[outv][outa]`;

    await ffmpeg.exec([
      ...inputs.trim().split(' '),
      '-filter_complex',
      filterComplex,
      '-map', '[outv]',
      '-map', '[outa]',
      outputName
    ]);

    const data = await ffmpeg.readFile(outputName);
    const videoBlob = new Blob([data.buffer], { type: 'video/mp4' });
    const videoUrl = URL.createObjectURL(videoBlob);

    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = 'exported_video.mp4';
    a.click();

    setIsExporting(false);
  };

  return (
    <div>
      <button onClick={exportVideo} disabled={isExporting}>
        {isExporting ? 'Exporting...' : 'Export Video'}
      </button>
    </div>
  );
};

export default Export;