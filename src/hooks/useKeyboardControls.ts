import { useEffect } from 'react';

interface UseKeyboardControlsParams {
  activeTab: 'dashboard' | 'topics' | 'instructions';
  handleMove: (lx: number, ly: number, az: number) => void;
  handleArmMove: (arm: 'left' | 'right', joint: string, direction: number) => void;
  emergencyStop: () => void;
  stopMove: () => void;
}

/**
 * Attaches keyboard event listeners for robot teleoperation.
 * Active only when the dashboard tab is shown.
 */
export function useKeyboardControls({
  activeTab,
  handleMove,
  handleArmMove,
  emergencyStop,
  stopMove,
}: UseKeyboardControlsParams): void {
  useEffect(() => {
    const shouldIgnoreKeyboardShortcut = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      const tagName = target.tagName;
      return (
        tagName === 'INPUT' ||
        tagName === 'TEXTAREA' ||
        tagName === 'SELECT' ||
        tagName === 'BUTTON' ||
        target.isContentEditable
      );
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (shouldIgnoreKeyboardShortcut(e.target)) return;
      if (activeTab !== 'dashboard') return;

      const controlKeys = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', 'q', 'e', ' ', 'i', 'k', 'j', 'l', 'u', 'o'];
      if (controlKeys.includes(e.key.toLowerCase())) {
        e.preventDefault();
      }

      switch (e.key.toLowerCase()) {
        case 'arrowup': case 'w': handleMove(0.5, 0, 0); break;
        case 'arrowdown': case 's': handleMove(-0.5, 0, 0); break;
        case 'arrowleft': case 'a': handleMove(0, 0.5, 0); break;
        case 'arrowright': case 'd': handleMove(0, -0.5, 0); break;
        case 'q': handleMove(0, 0, 0.5); break;
        case 'e': handleMove(0, 0, -0.5); break;
        case 'i': handleArmMove('left', 'pitch', 1); break;
        case 'k': handleArmMove('left', 'pitch', -1); break;
        case 'j': handleArmMove('left', 'roll', 1); break;
        case 'l': handleArmMove('left', 'roll', -1); break;
        case 'u': handleArmMove('right', 'pitch', 1); break;
        case 'o': handleArmMove('right', 'pitch', -1); break;
        case ' ': emergencyStop(); break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (shouldIgnoreKeyboardShortcut(e.target)) return;
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', 'q', 'e'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        stopMove();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeTab, handleMove, handleArmMove, emergencyStop, stopMove]);
}
