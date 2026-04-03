import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import { useKeyboardControls } from './useKeyboardControls';

describe('useKeyboardControls', () => {
  const handleMove = vi.fn();
  const handleArmMove = vi.fn();
  const emergencyStop = vi.fn();
  const stopMove = vi.fn();

  const defaultParams = {
    activeTab: 'dashboard' as const,
    handleMove,
    handleArmMove,
    emergencyStop,
    stopMove,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('calls handleMove forward on W key', () => {
    renderHook(() => useKeyboardControls(defaultParams));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w', bubbles: true }));
    expect(handleMove).toHaveBeenCalledWith(0.5, 0, 0);
  });

  it('calls handleMove backward on S key', () => {
    renderHook(() => useKeyboardControls(defaultParams));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', bubbles: true }));
    expect(handleMove).toHaveBeenCalledWith(-0.5, 0, 0);
  });

  it('calls stopMove on W key release', () => {
    renderHook(() => useKeyboardControls(defaultParams));
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'w', bubbles: true }));
    expect(stopMove).toHaveBeenCalled();
  });

  it('calls emergencyStop on Space key', () => {
    renderHook(() => useKeyboardControls(defaultParams));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(emergencyStop).toHaveBeenCalled();
  });

  it('does not call handleMove when tab is not dashboard', () => {
    renderHook(() => useKeyboardControls({ ...defaultParams, activeTab: 'topics' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w', bubbles: true }));
    expect(handleMove).not.toHaveBeenCalled();
  });

  it('removes event listeners on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useKeyboardControls(defaultParams));
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('keyup', expect.any(Function));
  });
});
