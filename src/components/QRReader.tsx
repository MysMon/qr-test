import React from 'react';
import { useQRReader } from '@/hooks/useQRReader';

const QRReader = () => {
  const { result, error, videoRef, canvasRef } = useQRReader();

  return (
    <>
      <video ref={videoRef} width="300" height="200" autoPlay muted/>
      <canvas ref={canvasRef} hidden width="300" height="200" />
      <div>Result: {result}</div>
      {error && <div>Error: {error}</div>}
    </>
  );
}

export default QRReader;