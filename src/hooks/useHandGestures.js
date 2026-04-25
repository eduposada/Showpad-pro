import { useEffect, useRef, useState } from 'react';
import '@mediapipe/hands';
import { StageCommand } from '../stageControls';

const THRESHOLD_BY_SENSITIVITY = {
  low: 0.1,
  medium: 0.075,
  high: 0.055,
};

function isOpenPalm(landmarks) {
  if (!landmarks || landmarks.length < 21) return false;
  const tipVsPip = [
    [8, 6],
    [12, 10],
    [16, 14],
    [20, 18],
  ];
  return tipVsPip.every(([tip, pip]) => landmarks[tip].y < landmarks[pip].y);
}

export function useHandGestures({ enabled, sensitivity = 'medium', onCommand }) {
  const videoRef = useRef(null);
  const rafRef = useRef(0);
  const streamRef = useRef(null);
  const handsRef = useRef(null);
  const processingRef = useRef(false);
  const lastPointRef = useRef(null);
  const cooldownRef = useRef(0);
  const [gestureStatus, setGestureStatus] = useState('inativo');
  const [gestureError, setGestureError] = useState('');

  useEffect(() => {
    if (!enabled) {
      setGestureStatus('inativo');
      setGestureError('');
      return;
    }

    let cancelled = false;
    const threshold = THRESHOLD_BY_SENSITIVITY[sensitivity] ?? THRESHOLD_BY_SENSITIVITY.medium;

    const stopAll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (handsRef.current?.close) handsRef.current.close();
      handsRef.current = null;
      processingRef.current = false;
      lastPointRef.current = null;
    };

    const emitIfReady = (command) => {
      const now = Date.now();
      if (now - cooldownRef.current < 600) return;
      cooldownRef.current = now;
      onCommand?.(command, 'gesture');
    };

    const processLoop = async () => {
      if (cancelled) return;
      const video = videoRef.current;
      if (!video || !handsRef.current) return;
      if (!processingRef.current && video.readyState >= 2) {
        processingRef.current = true;
        try {
          await handsRef.current.send({ image: video });
        } finally {
          processingRef.current = false;
        }
      }
      rafRef.current = requestAnimationFrame(processLoop);
    };

    const start = async () => {
      try {
        setGestureStatus('solicitando câmera...');
        setGestureError('');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();

        const HandsCtor = window.Hands;
        if (!HandsCtor) {
          throw new Error('Biblioteca de gestos não carregada.');
        }

        const hands = new HandsCtor({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });
        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 0,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6,
        });
        hands.onResults((results) => {
          const marks = results.multiHandLandmarks?.[0];
          if (!marks || !isOpenPalm(marks)) {
            lastPointRef.current = null;
            setGestureStatus('mão não detectada');
            return;
          }
          setGestureStatus('gestos ativos');
          const wrist = marks[0];
          if (!lastPointRef.current) {
            lastPointRef.current = { x: wrist.x, y: wrist.y };
            return;
          }
          const dx = wrist.x - lastPointRef.current.x;
          const dy = wrist.y - lastPointRef.current.y;
          lastPointRef.current = { x: wrist.x, y: wrist.y };

          if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
            emitIfReady(dx > 0 ? StageCommand.NEXT_SONG : StageCommand.PREV_SONG);
            return;
          }
          if (Math.abs(dy) > threshold) {
            emitIfReady(dy > 0 ? StageCommand.SCROLL_DOWN : StageCommand.SCROLL_UP);
          }
        });
        handsRef.current = hands;
        setGestureStatus('gestos ativos');
        rafRef.current = requestAnimationFrame(processLoop);
      } catch (err) {
        console.error('useHandGestures:', err);
        setGestureError(err?.message || 'Falha ao inicializar gestos.');
        setGestureStatus('erro na câmera');
      }
    };

    start();

    return () => {
      cancelled = true;
      stopAll();
    };
  }, [enabled, onCommand, sensitivity]);

  return {
    videoRef,
    gestureStatus,
    gestureError,
  };
}
