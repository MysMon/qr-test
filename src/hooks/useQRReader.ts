import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

type UseQRReaderResult = {
  result: string | null;
  error: string | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
};

export const useQRReader = (): UseQRReaderResult => {
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const setErrorWithMessage = useCallback((msg: string) => {
      setError(msg);
    }, []);

    useEffect(() => {
      let animationFrameId: number | null = null;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) {
        setErrorWithMessage('ビデオまたはキャンバスエレメントが利用できません。');
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setErrorWithMessage('キャンバスコンテキストが取得できません。');
        return;
      }

      const trackEnded = () => {
        setErrorWithMessage('カメラへの接続が途中で切断されました。');
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
        }
      };

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorWithMessage('カメラがサポートされていません。');
        return;
      }

      const scanQR = () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        try {
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            setResult(code.data);
          }
        } catch (err) {
          setErrorWithMessage(`QRコードの読み取り中にエラーが発生しました: ${err.message}`);
        }
        animationFrameId = requestAnimationFrame(scanQR);
      };

      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          video.srcObject = stream;
          const track = stream.getTracks()[0];

          track.addEventListener('ended', trackEnded);

          animationFrameId = requestAnimationFrame(scanQR);
        })
        .catch((err) => {
          setErrorWithMessage(`カメラへのアクセスが拒否されました。エラー: ${err.message}. カメラのアクセスを許可してください。`);
        });

      return () => {
        if (video.srcObject) {
          (video.srcObject as MediaStream).getTracks().forEach((track: MediaStreamTrack) => {
            track.stop();
            track.removeEventListener('ended', trackEnded);
          });
        }
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
        }
      };
    }, [setErrorWithMessage]);

    return { result, error, videoRef, canvasRef };
};
