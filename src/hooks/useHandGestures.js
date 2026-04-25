import { useEffect, useRef, useState } from 'react';
import '@mediapipe/hands/hands';
import { GestureToken, StageCommand } from '../stageControls';

const THRESHOLD_BY_SENSITIVITY = {
  low: 0.1,
  medium: 0.075,
  high: 0.055,
};

function countRaisedFingers(landmarks) {
  const tipVsPip = [
    [8, 6],
    [12, 10],
    [16, 14],
    [20, 18],
  ];
  return tipVsPip.reduce((acc, [tip, pip]) => (landmarks[tip].y < landmarks[pip].y ? acc + 1 : acc), 0);
}

function isThumbRaised(landmarks) {
  return landmarks[4].x > landmarks[3].x;
}

function isRockSign(landmarks) {
  const indexUp = landmarks[8].y < landmarks[6].y;
  const middleDown = landmarks[12].y > landmarks[10].y;
  const ringDown = landmarks[16].y > landmarks[14].y;
  const pinkyUp = landmarks[20].y < landmarks[18].y;
  return indexUp && middleDown && ringDown && pinkyUp;
}

function isOpenPalmStable(landmarks) {
  return countRaisedFingers(landmarks) >= 4;
}

function isClosedFist(landmarks) {
  return countRaisedFingers(landmarks) === 0 && !isThumbRaised(landmarks);
}

function resolveGestureToken(landmarks, dx, dy, threshold) {
  if (!landmarks) return null;
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
    return dx > 0 ? GestureToken.SWIPE_RIGHT : GestureToken.SWIPE_LEFT;
  }
  const raised = countRaisedFingers(landmarks);
  if (isRockSign(landmarks)) return GestureToken.ROCK_SIGN;
  if (raised === 1) {
    if (dy < -threshold) return GestureToken.ONE_FINGER_UP;
    if (dy > threshold) return GestureToken.ONE_FINGER_DOWN;
  }
  if (raised >= 4) {
    if (Math.abs(dy) <= threshold * 0.65) return GestureToken.OPEN_PALM;
    if (dy < -threshold) return GestureToken.OPEN_PALM_UP;
    if (dy > threshold) return GestureToken.OPEN_PALM_DOWN;
  }
  if (isClosedFist(landmarks)) return GestureToken.CLOSED_FIST;
  if (raised === 2) {
    if (dy < -threshold) return GestureToken.TWO_FINGERS_UP;
    if (dy > threshold) return GestureToken.TWO_FINGERS_DOWN;
  }
  return null;
}

function commandFromGestureToken(token, gestureBindings) {
  if (!token || !gestureBindings) return null;
  if (gestureBindings.scroll_up === token) return StageCommand.SCROLL_UP;
  if (gestureBindings.scroll_down === token) return StageCommand.SCROLL_DOWN;
  if (gestureBindings.next_song === token) return StageCommand.NEXT_SONG;
  if (gestureBindings.prev_song === token) return StageCommand.PREV_SONG;
  return null;
}

export function useHandGestures({
  enabled,
  cameraEnabled = true,
  sensitivity = 'medium',
  gestureBindings,
  onCommand,
  onGestureSample,
}) {
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
    if (!enabled || !cameraEnabled) {
      setGestureStatus(enabled ? 'pausado' : 'inativo');
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

        let HandsCtor = window.Hands;
        if (!HandsCtor) {
          await import('@mediapipe/hands/hands');
          HandsCtor = window.Hands;
        }
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
          if (!marks) {
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

          const token = resolveGestureToken(marks, dx, dy, threshold);
          if (!token) return;
          onGestureSample?.(token);
          const command = commandFromGestureToken(token, gestureBindings);
          if (command) emitIfReady(command);
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
  }, [enabled, cameraEnabled, onCommand, onGestureSample, sensitivity, gestureBindings]);

  return {
    videoRef,
    gestureStatus,
    gestureError,
  };
}
