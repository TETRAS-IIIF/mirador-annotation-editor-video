import {
  deselectAnnotation,
  getCompanionWindowsForContent,
  getSelectedAnnotationId,
  getVisibleCanvases,
  receiveAnnotation,
  removeCompanionWindow,
} from 'mirador';

/** Delete selected annotation on Delete/Backspace */
function deleteSelectedAnnotation({
  state, dispatch, windowId, config,
}) {
  const annotationId = getSelectedAnnotationId(state, { windowId });
  if (!annotationId) return;

  const storageAdapter = config?.annotation?.adapter;
  if (!storageAdapter) return;

  const canvases = getVisibleCanvases(state, { windowId });

  canvases.forEach((canvas) => {
    const adapter = storageAdapter(canvas.id);
    adapter.delete(annotationId).then((annoPage) => {
      dispatch(receiveAnnotation(canvas.id, adapter.annotationPageId, annoPage));
    });
  });

  // Close companion window
  const companionWindows = getCompanionWindowsForContent(state, {
    content: 'annotationCreation',
    windowId,
  });
  Object.values(companionWindows).forEach((cw) => {
    if (cw?.id) {
      dispatch(removeCompanionWindow(windowId, cw.id));
    }
  });

  dispatch(deselectAnnotation(windowId));
}

/**
 * Hotkey registry.
 *
 * Maps a keyboard event to an action
 * The action is only performed on the focused Mirador window
 * The handler receives the full Redux state and a dispatch
 * function so it can read any selector and fire any action.
 *
 * {
 *   keys:        string[] KeyboardEvent.key values that trigger the action
 *   description:          Human-readable description
 *   handler:     (ctx) => void
 *       ctx.state         current Redux state
 *       ctx.dispatch      Redux dispatch
 *       ctx.windowId      focused window ID
 *       ctx.config        Mirador config object
 * }
 */
const HOTKEYS = [
  {
    description: 'Delete selected annotation',
    handler: deleteSelectedAnnotation,
    keys: ['Delete', 'Backspace'],
  },
];

export default HOTKEYS;
