import { useEffect, useRef, useState } from 'react';
import '@mediapipe/hands/hands';
import { GestureToken, StageCommand } from '../stageControls';

const THRESHOLD_BY_SENSITIVITY = {
  low: 0.1,
  medium: 0.075,
  high: 0.055,
};
const START_TIMEOUT_MS = 10000;
const CAMERA_PERMISSION_TIMEOUT_MS = 30000;
const RETRY_DELAY_MS = 450;
const LOCAL_MEDIAPIPE_BASE = '/mediapipe/hands';
const CDN_MEDIAPIPE_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands';

let cachedHandsCtor = null;
let preferredRuntimeBase = LOCAL_MEDIAPIPE_BASE;

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

function withTimeout(promise, timeoutMs, timeoutMessage) {
  let timerId = 0;
  const timeout = new Promise((_, reject) => {
    timerId = window.setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => {
    window.clearTimeout(timerId);
  });
}

function isTransientGestureInitError(err) {
  const name = String(err?.name || '');
  const msg = String(err?.message || '').toLowerCase();
  return (
    name === 'AbortError' ||
    name === 'NotReadableError' ||
    name === 'SecurityError' ||
    msg.includes('network') ||
    msg.includes('timeout')
  );
}

function friendlyGestureError(err) {
  const name = String(err?.name || '');
  const msg = String(err?.message || '').toLowerCase();
  if (name === 'NotAllowedError') return 'Permissão da câmera negada. Autorize o acesso e tente novamente.';
  if (name === 'NotFoundError') return 'Nenhuma câmera encontrada neste dispositivo.';
  if (name === 'NotReadableError' || msg.includes('in use') || msg.includes('ocupad')) {
    return 'Câmera indisponível ou em uso por outro app/aba.';
  }
  if (msg.includes('gesture runtime') || msg.includes('biblioteca de gestos') || msg.includes('hands')) {
    return 'Falha ao carregar o motor de gestos.';
  }
  if (msg.includes('tempo esgotado') || msg.includes('timeout')) {
    return 'Tempo esgotado ao iniciar a câmera/gestos. Tente novamente.';
  }
  return err?.message || 'Falha ao inicializar gestos.';
}

async function resolveHandsCtor() {
  if (cachedHandsCtor) return cachedHandsCtor;
  let HandsCtor = window.Hands;
  if (!HandsCtor) {
    await import('@mediapipe/hands/hands');
    HandsCtor = window.Hands;
  }
  if (!HandsCtor) throw new Error('Biblioteca de gestos não carregada.');
  cachedHandsCtor = HandsCtor;
  return HandsCtor;
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
  const retryCountRef = useRef(0);
  const [gestureStatus, setGestureStatus] = useState('inativo');
  const [gestureError, setGestureError] = useState('');
  const [gesturePhase, setGesturePhase] = useState('idle');
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    if (!enabled || !cameraEnabled) {
      setGestureStatus(enabled ? 'pausado' : 'inativo');
      setGestureError('');
      setGesturePhase(enabled ? 'paused' : 'idle');
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

    const start = async (runtimeBase) => {
      try {
        setGesturePhase('requesting_permission');
        setGestureStatus('solicitando permissão da câmera...');
        setGestureError('');
        // Em iPad/Safari o prompt de permissão pode demorar mais para o utilizador aceitar.
        // Usamos timeout maior aqui para não abortar cedo um fluxo válido.
        const stream = await withTimeout(
          navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
            audio: false,
          }),
          CAMERA_PERMISSION_TIMEOUT_MS,
          'Tempo esgotado ao solicitar câmera.'
        );
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await withTimeout(video.play(), START_TIMEOUT_MS, 'Tempo esgotado ao iniciar preview da câmera.');

        setGesturePhase('loading_engine');
        setGestureStatus('carregando motor de gestos...');
        const HandsCtor = await withTimeout(resolveHandsCtor(), START_TIMEOUT_MS, 'Tempo esgotado ao carregar motor de gestos.');

        const hands = new HandsCtor({
          locateFile: (file) => `${runtimeBase}/${file}`,
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
            setGesturePhase('active');
            return;
          }
          setGestureStatus('câmera ativa');
          setGesturePhase('active');
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
        setGestureStatus('câmera ativa');
        setGesturePhase('active');
        rafRef.current = requestAnimationFrame(processLoop);
        preferredRuntimeBase = runtimeBase;
      } catch (err) {
        console.error('useHandGestures:', { err, retry: retryCountRef.current, runtimeBase });
        stopAll();
        const canRetry = retryCountRef.current === 0 && isTransientGestureInitError(err);
        if (canRetry) {
          retryCountRef.current = 1;
          setGesturePhase('retrying');
          setGestureStatus('tentando novamente...');
          window.setTimeout(async () => {
            if (cancelled) return;
            const fallbackBase = runtimeBase === LOCAL_MEDIAPIPE_BASE ? CDN_MEDIAPIPE_BASE : LOCAL_MEDIAPIPE_BASE;
            await start(fallbackBase);
          }, RETRY_DELAY_MS);
          return;
        }
        setGestureError(friendlyGestureError(err));
        setGestureStatus('erro na câmera');
        setGesturePhase('error');
      }
    };

    retryCountRef.current = 0;
    start(preferredRuntimeBase);

    return () => {
      cancelled = true;
      stopAll();
    };
  }, [enabled, cameraEnabled, onCommand, onGestureSample, sensitivity, gestureBindings, retryToken]);

  return {
    videoRef,
    gestureStatus,
    gestureError,
    gesturePhase,
    retry: () => setRetryToken((v) => v + 1),
  };
}
