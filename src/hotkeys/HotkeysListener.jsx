import { useEffect } from 'react';
import { useStore } from 'react-redux';
import { getFocusedWindowId, getConfig } from 'mirador';
import HOTKEYS from './hotkeysDefinitions';

/** Elements where keystrokes should NOT trigger hotkeys */
const IGNORED_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);
/** Check if target is editable */
const isEditableTarget = (el) => IGNORED_TAGS.has(el?.tagName) || el?.isContentEditable;

let listenerActive = false;

/**
 * Registers a global keydown listener
 * Uses the Redux store directly so the listener reads current state
 * without React re-renders
 */
export default function HotkeysListener() {
  const store = useStore();

  useEffect(() => {
    if (listenerActive) {
      return undefined;
    }
    listenerActive = true;

    /** Handler for keydown events */
    const handler = (e) => {
      // console.log(e.key);

      if (isEditableTarget(e.target)) return;
      const match = HOTKEYS.find((h) => h.keys.includes(e.key));
      if (!match) return;

      const state = store.getState();
      const windowId = getFocusedWindowId(state);
      if (!windowId) return;

      const config = getConfig(state);
      if (config?.annotation?.readonly) return;

      e.preventDefault();
      match.handler({
        config,
        dispatch: store.dispatch,
        state,
        windowId,
      });
    };

    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
      listenerActive = false;
    };
  }, [store]);

  return null;
}
