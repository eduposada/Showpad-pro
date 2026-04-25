export const STAGE_CONTROLS_STORAGE_KEY = 'stage-controls-profile';

export const StageCommand = {
  SCROLL_UP: 'scroll_up',
  SCROLL_DOWN: 'scroll_down',
  NEXT_SONG: 'next_song',
  PREV_SONG: 'prev_song',
};

export const DEFAULT_STAGE_CONTROLS = {
  inputMode: 'touch',
  invertScroll: false,
  gestureSensitivity: 'medium',
};

export function normalizeStageControls(raw) {
  const merged = { ...DEFAULT_STAGE_CONTROLS, ...(raw || {}) };
  const allowedModes = new Set(['touch', 'pedal', 'gestures', 'pedal+gestures']);
  const allowedSensitivity = new Set(['low', 'medium', 'high']);
  if (!allowedModes.has(merged.inputMode)) merged.inputMode = DEFAULT_STAGE_CONTROLS.inputMode;
  if (!allowedSensitivity.has(merged.gestureSensitivity)) {
    merged.gestureSensitivity = DEFAULT_STAGE_CONTROLS.gestureSensitivity;
  }
  merged.invertScroll = Boolean(merged.invertScroll);
  return merged;
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
