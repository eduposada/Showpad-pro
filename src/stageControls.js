export const STAGE_CONTROLS_STORAGE_KEY = 'stage-controls-profile';

export const StageCommand = {
  SCROLL_UP: 'scroll_up',
  SCROLL_DOWN: 'scroll_down',
  NEXT_SONG: 'next_song',
  PREV_SONG: 'prev_song',
};

export const GestureToken = {
  OPEN_PALM_UP: 'open_palm_up',
  OPEN_PALM_DOWN: 'open_palm_down',
  TWO_FINGERS_UP: 'two_fingers_up',
  TWO_FINGERS_DOWN: 'two_fingers_down',
  ROCK_SIGN: 'rock_sign',
  SWIPE_LEFT: 'swipe_left',
  SWIPE_RIGHT: 'swipe_right',
};

export const GESTURE_TOKEN_OPTIONS = [
  { value: GestureToken.OPEN_PALM_UP, label: 'Palma aberta para cima' },
  { value: GestureToken.OPEN_PALM_DOWN, label: 'Palma aberta para baixo' },
  { value: GestureToken.TWO_FINGERS_UP, label: '2 dedos para cima' },
  { value: GestureToken.TWO_FINGERS_DOWN, label: '2 dedos para baixo' },
  { value: GestureToken.ROCK_SIGN, label: 'Sinal de rock' },
  { value: GestureToken.SWIPE_LEFT, label: 'Swipe para esquerda' },
  { value: GestureToken.SWIPE_RIGHT, label: 'Swipe para direita' },
];

export const GESTURE_PRESETS = {
  default: {
    scroll_up: GestureToken.TWO_FINGERS_UP,
    scroll_down: GestureToken.TWO_FINGERS_DOWN,
    next_song: GestureToken.ROCK_SIGN,
  },
  palm: {
    scroll_up: GestureToken.OPEN_PALM_UP,
    scroll_down: GestureToken.OPEN_PALM_DOWN,
    next_song: GestureToken.SWIPE_RIGHT,
  },
  swipe: {
    scroll_up: GestureToken.SWIPE_LEFT,
    scroll_down: GestureToken.SWIPE_RIGHT,
    next_song: GestureToken.ROCK_SIGN,
  },
};

export const DEFAULT_STAGE_CONTROLS = {
  inputMode: 'touch',
  invertScroll: false,
  gestureSensitivity: 'medium',
  cameraEnabled: true,
  cameraPreviewVisible: true,
  gesturePreset: 'default',
  gestureBindings: { ...GESTURE_PRESETS.default },
};

export function normalizeStageControls(raw) {
  const merged = { ...DEFAULT_STAGE_CONTROLS, ...(raw || {}) };
  const allowedModes = new Set(['touch', 'pedal', 'gestures', 'pedal+gestures']);
  const allowedSensitivity = new Set(['low', 'medium', 'high']);
  const allowedPresets = new Set(Object.keys(GESTURE_PRESETS));
  const allowedTokens = new Set(Object.values(GestureToken));
  if (!allowedModes.has(merged.inputMode)) merged.inputMode = DEFAULT_STAGE_CONTROLS.inputMode;
  if (!allowedSensitivity.has(merged.gestureSensitivity)) {
    merged.gestureSensitivity = DEFAULT_STAGE_CONTROLS.gestureSensitivity;
  }
  if (!allowedPresets.has(merged.gesturePreset)) merged.gesturePreset = DEFAULT_STAGE_CONTROLS.gesturePreset;
  const fromPreset = GESTURE_PRESETS[merged.gesturePreset] || GESTURE_PRESETS.default;
  const candidateBindings = { ...fromPreset, ...(raw?.gestureBindings || {}) };
  merged.gestureBindings = {
    scroll_up: allowedTokens.has(candidateBindings.scroll_up) ? candidateBindings.scroll_up : fromPreset.scroll_up,
    scroll_down: allowedTokens.has(candidateBindings.scroll_down) ? candidateBindings.scroll_down : fromPreset.scroll_down,
    next_song: allowedTokens.has(candidateBindings.next_song) ? candidateBindings.next_song : fromPreset.next_song,
  };
  merged.invertScroll = Boolean(merged.invertScroll);
  merged.cameraEnabled = Boolean(merged.cameraEnabled);
  merged.cameraPreviewVisible = Boolean(merged.cameraPreviewVisible);
  return merged;
}

export function applyGesturePreset(profile, preset) {
  const chosen = GESTURE_PRESETS[preset] || GESTURE_PRESETS.default;
  return normalizeStageControls({
    ...profile,
    gesturePreset: preset,
    gestureBindings: { ...chosen },
  });
}

export function gestureBindingConflicts(bindings) {
  const values = Object.entries(bindings || {});
  const seen = new Map();
  const conflicts = [];
  values.forEach(([action, gesture]) => {
    if (!gesture) return;
    if (seen.has(gesture)) conflicts.push([seen.get(gesture), action, gesture]);
    else seen.set(gesture, action);
  });
  return conflicts;
}

export function stageInputEnabled(profile, mode) {
  if (!profile) return false;
  if (mode === 'pedal') return profile.inputMode === 'pedal' || profile.inputMode === 'pedal+gestures';
  if (mode === 'gestures') return profile.inputMode === 'gestures' || profile.inputMode === 'pedal+gestures';
  return false;
}

export function mapKeyboardToStageCommand(code) {
  if (code === 'ArrowUp' || code === 'PageUp') return StageCommand.SCROLL_UP;
  if (code === 'ArrowDown' || code === 'PageDown' || code === 'Space') return StageCommand.SCROLL_DOWN;
  if (code === 'ArrowLeft') return StageCommand.PREV_SONG;
  if (code === 'ArrowRight') return StageCommand.NEXT_SONG;
  return null;
}
