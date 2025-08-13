import React, { useRef, useEffect } from 'react';

interface AudioVisualizerProps {
  analyserNode: AnalyserNode | null;
  isProcessing: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ analyserNode, isProcessing }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isProcessing || !analyserNode || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let animationFrameId: number;

    const draw = () => {
      animationFrameId = requestAnimationFrame(draw);
      analyserNode.getByteTimeDomainData(dataArray);

      canvasCtx.fillStyle = 'rgb(17 24 39)'; // bg-gray-900
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
      canvasCtx.lineWidth = 3;
      canvasCtx.strokeStyle = 'rgb(59 130 246)'; // bg-blue-500
      canvasCtx.beginPath();

      const sliceWidth = canvas.width * 1.0 / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * canvas.height / 2;

        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      // Clear canvas on stop
      canvasCtx.fillStyle = 'rgb(17 24 39)';
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProcessing, analyserNode]);

  return <canvas ref={canvasRef} width="600" height="150" className="w-full h-36 rounded-lg bg-gray-900"></canvas>;
};

export default AudioVisualizer;