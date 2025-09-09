import React, {
  useCallback,
  useEffect, useMemo, useRef, useState,
} from 'react';
import PropTypes from 'prop-types';
import { getVisibleCanvases } from 'mirador/dist/es/src/state/selectors/canvases';
import * as actions from 'mirador/dist/es/src/state/actions';
import { getWindowViewType } from 'mirador/dist/es/src/state/selectors';
import { getCompanionWindowsForContent } from 'mirador/dist/es/src/state/selectors/companionWindows';
import ns from 'mirador/dist/es/src/config/css-ns';
import CanvasListItem from '../CanvasListItem';
import AnnotationActionsContext from '../AnnotationActionsContext';
import SingleCanvasDialog from '../SingleCanvasDialog';
import translations from '../locales/locales';

/**
 * Utilities
 */
const isScrollable = (el) => {
  if (!el) return false;
  const cs = getComputedStyle(el);
  const oy = cs.overflowY || cs.overflow || '';
  return /(auto|scroll|overlay)/.test(oy) && el.scrollHeight > el.clientHeight;
};
/**
 * Find the closest scrollable ancestor of a given DOM node.
 *
 * - Walks up the DOM tree from the node's parent using `parentElement`.
 * - Returns the first ancestor element that is considered scrollable,
 *   meaning:
 *   - Its `overflowY` (or `overflow`) style is `auto`, `scroll`, or `overlay`,
 *   - And its `scrollHeight` is greater than its `clientHeight`.
 * - Returns `null` if no scrollable ancestor is found before reaching the root.
 *
 * @param {HTMLElement|null} node - The starting DOM node.
 * @returns {HTMLElement|null} The nearest scrollable ancestor, or null if none exist.
 */
const closestScrollableAncestor = (node) => {
  let cur = node?.parentElement || null;
  while (cur) {
    if (isScrollable(cur)) return cur;
    cur = cur.parentElement;
  }
  return null;
};
/**
 * Find the first scrollable descendant of a given root element.
 *
 * - Checks the immediate children of `root` first.
 * - If none are scrollable, scans all descendants (via `querySelectorAll('*')`).
 * - A scrollable element is one where `overflowY` (or `overflow`) is set
 *   to `auto`, `scroll`, or `overlay` **and** the element's `scrollHeight`
 *   exceeds its `clientHeight`.
 * - Returns `null` if no scrollable descendant is found.
 *
 * @param {HTMLElement|null} root - The root element to search within.
 * @returns {HTMLElement|null} The first scrollable descendant element, or null if none exist.
 */
const firstScrollableDescendant = (root) => {
  if (!root) return null;
  for (const el of Array.from(root.children)) if (isScrollable(el)) return el;
  for (const el of Array.from(root.querySelectorAll('*'))) if (isScrollable(el)) return el;
  return null;
};
/**
 * Get the primary scrollable element for the browser window.
 *
 * - Modern browsers expose `document.scrollingElement` (usually the `<html>` element).
 * - As a fallback, returns `document.documentElement` (the `<html>` element).
 * - This element's `scrollTop` and `scrollHeight` represent the window's scroll state.
 *
 * @function
 * @returns {HTMLElement} The DOM element representing the window's scrolling container.
 */
const getWindowScroller = () => document.scrollingElement || document.documentElement;
/**
 * Compute the vertical scroll position needed to bring a node into view
 * within a given scrollable container element.
 *
 * - Uses bounding boxes of the node and container to calculate the node's
 *   position relative to the container's scroll area.
 * - Considers the container's `scrollTop`, `clientHeight`, and a custom
 *   `offsetTop` (for sticky headers/toolbars inside the container).
 * - If the node is already fully visible inside the container, returns `null`.
 * - If the node is above the visible area, returns the scrollTop needed
 *   to align its top just below the offset.
 * - If the node is below the visible area, returns the scrollTop needed
 *   to bring its bottom into view (but not less than aligning its top).
 *
 * @param {HTMLElement} container - The scrollable container element.
 * @param {HTMLElement} node - The DOM element to bring into view.
 * @param {number} offsetTop - Extra vertical offset in pixels to keep free at the top.
 * @returns {number|null} The target scrollTop value for the container, or null if already visible.
 */
function computeTargetContainer(container, node, offsetTop) {
  const cRect = container.getBoundingClientRect();
  const nRect = node.getBoundingClientRect();
  const nodeTopInContainer = (nRect.top - cRect.top) + container.scrollTop;
  const nodeBottomInContainer = (nRect.bottom - cRect.top) + container.scrollTop;
  const visibleTop = container.scrollTop + offsetTop;
  const visibleBottom = container.scrollTop + container.clientHeight;
  const above = nodeTopInContainer < visibleTop;
  const below = nodeBottomInContainer > visibleBottom;
  if (!above && !below) return null;
  return above
    ? nodeTopInContainer - offsetTop
    : Math.max(nodeBottomInContainer - container.clientHeight, nodeTopInContainer - offsetTop);
}

/**
 * Compute the vertical scroll position needed to bring a node into view
 * within the browser window.
 *
 * - Uses the node's bounding box relative to the viewport.
 * - Considers the current `window.scrollY` and the given `offsetTop`
 *   (to account for sticky headers or toolbars).
 * - If the node is already fully visible, returns `null`.
 * - If the node is above the visible viewport, returns the scrollY needed
 *   to align its top just below the offset.
 * - If the node is below the viewport, returns the scrollY needed to align
 *   its bottom into view (but not less than aligning its top).
 *
 * @param {HTMLElement} node - The DOM element to bring into view.
 * @param {number} offsetTop - Extra vertical offset in pixels to keep free at the top.
 * @returns {number|null} The target scrollY for the window, or null if already visible.
 */
function computeTargetWindow(node, offsetTop) {
  const rect = node.getBoundingClientRect();
  const nodeTop = rect.top + window.scrollY;
  const nodeBottom = rect.bottom + window.scrollY;
  const viewTop = window.scrollY + offsetTop;
  const viewBottom = window.scrollY + window.innerHeight;
  const above = nodeTop < viewTop;
  const below = nodeBottom > viewBottom;
  if (!above && !below) return null;
  return above
    ? nodeTop - offsetTop
    : Math.max(nodeBottom - window.innerHeight, nodeTop - offsetTop);
}

/**
 * CanvasAnnotationsWrapper
 *
 * Re-implements "scroll to selected annotation" inside the wrapper:
 * - Observes selectedAnnotationId and scrolls the correct container so the <li> is visible.
 * - Robust container resolution (ancestor/descendant/window).
 * - Retries to survive focus/reflow resetting scrollTop.
 *
 * Props of interest:
 * - targetProps.selectedAnnotationId: the currently selected annotation id.
 * - scrollOffsetTop: px reserved for sticky header inside the scroller (default 96).
 * - scrollRetries / scrollRetryDelay / scrollBehavior: tuning for robustness.
 */
function CanvasAnnotationsWrapper({
  addCompanionWindow,
  annotationsOnCanvases = {},
  canvases = [],
  config,
  receiveAnnotation,
  switchToSingleCanvasView,
  TargetComponent,
  targetProps,
  windowViewType,
  annotationEditCompanionWindowIsOpened,
  t,
  scrollOffsetTop = 96,
  scrollRetries = 3,
  scrollRetryDelay = 24,
  scrollBehavior = 'smooth',
}) {
  const [singleCanvasDialogOpen, setSingleCanvasDialogOpen] = useState(false);

  const wrapperRef = useRef(null);
  const bridgedScrollRef = useRef(null);
  const markerClass = useMemo(() => ns('scrollto-scrollable'), []);

  useEffect(() => {
    const root = wrapperRef.current;
    if (!root) return;
    /** */
    const resolve = () => {
      const chosen = root.querySelector(`.${markerClass}`)
                || firstScrollableDescendant(root)
                || closestScrollableAncestor(root)
                || null;

      if (chosen) {
        chosen.classList.add(markerClass);
        bridgedScrollRef.current = chosen;
      } else {
        bridgedScrollRef.current = null;
      }
    };

    resolve();
    const raf = requestAnimationFrame(resolve);
    const mo = new MutationObserver(resolve);
    mo.observe(root, { childList: true, subtree: true });

    // eslint-disable-next-line consistent-return
    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
    };
  }, [targetProps?.windowId, markerClass]);

  useEffect(() => {
    const selId = targetProps?.selectedAnnotationId;
    if (!selId) return;

    const node = wrapperRef.current?.querySelector(`li[annotationid="${selId}"]`)
            || wrapperRef.current?.querySelector('li.MuiMenuItem-root.Mui-selected');
    if (!node) return;

    /**
       * Attempt a single scroll operation to bring the selected annotation node into view.
       *
       * - Uses double `requestAnimationFrame` to wait until layout and paints have settled.
       * - Resolves the correct scroll container (bridged ref, closest ancestor, or window).
       * - Computes the target scroll position using `computeTargetWindow` or
       * `computeTargetContainer`.
       * - Performs the scroll with the configured `scrollBehavior`.
       * - After a short delay (`scrollRetryDelay`),
       * checks whether the scroll position actually changed.
       *
       * @returns {Promise<boolean>} Promise resolving to `true` if the scroll succeeded
       *                             (element is in view or scrollTop changed),
       *                             or `false` if it was reverted/unchanged.
       *
       * @closure
       * - `node` {HTMLElement} The DOM node to scroll into view.
       * - `selId` {string} The currently selected annotation id (for logging).
       * - `bridgedScrollRef` {React.RefObject<HTMLElement>} Ref holding candidate scroll container.
       * - `scrollOffsetTop` {number} Pixels reserved at the top of the container.
       * - `scrollBehavior` {"auto"|"smooth"} Scrolling animation mode.
       * - `scrollRetryDelay` {number} Milliseconds to wait before verifying the scroll.
       */
    const runOnce = () => new Promise((resolve) => {
      requestAnimationFrame(() => {
        // eslint-disable-next-line consistent-return
        requestAnimationFrame(() => {
          let container = bridgedScrollRef.current;
          if (!isScrollable(container)) container = closestScrollableAncestor(node);
          if (!isScrollable(container)) container = getWindowScroller();

          const isWindow = container === document.body
                        || container === document.documentElement
                        || container === document.scrollingElement;

          if (isWindow) {
            const topWindow = computeTargetWindow(node, scrollOffsetTop);
            if (topWindow == null) return resolve(true);
            const before = window.scrollY;
            window.scrollTo({
              behavior: scrollBehavior,
              top: topWindow,
            });
            setTimeout(() => {
              const after = window.scrollY;
              resolve(Math.abs(after - before) > 0.5);
            }, scrollRetryDelay);
            // eslint-disable-next-line consistent-return
            return;
          }

          const top = computeTargetContainer(container, node, scrollOffsetTop);
          if (top == null) return resolve(true);
          const before = container.scrollTop;
          if (typeof container.scrollTo === 'function') {
            container.scrollTo({
              behavior: scrollBehavior,
              top,
            });
          } else {
            container.scrollTop = t;
          }
          setTimeout(() => {
            const after = container.scrollTop;
            resolve(Math.abs(after - before) > 0.5);
          }, scrollRetryDelay);
        });
      });
    });

    (async () => {
      let attempt = 0;
      let ok = false;
      while (attempt <= scrollRetries && !ok) {
        // eslint-disable-next-line no-await-in-loop
        ok = await runOnce();
        if (!ok) {
          attempt += 1;
          if (attempt <= scrollRetries) {
            // eslint-disable-next-line no-await-in-loop
            await new Promise((r) => { setTimeout(r, scrollRetryDelay); });
          }
        }
      }
    })();
  }, [
    targetProps?.selectedAnnotationId,
    scrollOffsetTop,
    scrollRetries,
    scrollRetryDelay,
    scrollBehavior,
  ]);
  /**
     * Toggle the visibility state of the single canvas dialog.
     *
     * - Flips `singleCanvasDialogOpen` between `true` and `false`.
     * - Used as the `handleClose` callback for the dialog and to open it.
     *
     * @function
     * @returns {void}
     */
  const toggleSingleCanvasDialogOpen = useCallback(
    () => setSingleCanvasDialogOpen((p) => !p),
    [],
  );

  const props = {
    containerRef: bridgedScrollRef,
    ...targetProps,
    listContainerComponent: CanvasListItem,
  };

  const contextValue = useMemo(() => ({
    addCompanionWindow,
    annotationEditCompanionWindowIsOpened,
    annotationsOnCanvases,
    canvases,
    config,
    receiveAnnotation,
    storageAdapter: config.annotation.adapter,
    t,
    toggleSingleCanvasDialogOpen,
    windowId: targetProps.windowId,
    windowViewType,
  }), [
    addCompanionWindow,
    annotationEditCompanionWindowIsOpened,
    annotationsOnCanvases,
    canvases,
    config,
    receiveAnnotation,
    t,
    toggleSingleCanvasDialogOpen,
    targetProps.windowId,
    windowViewType,
  ]);
  return (
    <AnnotationActionsContext.Provider value={contextValue}>
      <div ref={wrapperRef} style={{ height: '100%', position: 'relative' }}>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <TargetComponent {...props} />
      </div>

      {windowViewType !== 'single' && (
        <SingleCanvasDialog
          handleClose={toggleSingleCanvasDialogOpen}
          open={singleCanvasDialogOpen}
          switchToSingleCanvasView={switchToSingleCanvasView}
        />
      )}
    </AnnotationActionsContext.Provider>
  );
}

CanvasAnnotationsWrapper.propTypes = {

  addCompanionWindow: PropTypes.func.isRequired,
  annotationEditCompanionWindowIsOpened: PropTypes.bool.isRequired,
  annotationsOnCanvases: PropTypes.shape({}).isRequired,
  // eslint-disable-next-line max-len
  canvases: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string, index: PropTypes.number })).isRequired,
  config: PropTypes.shape({ annotation: PropTypes.shape({ adapter: PropTypes.func }) }).isRequired,
  receiveAnnotation: PropTypes.func.isRequired,
  scrollBehavior: PropTypes.oneOf(['auto', 'smooth']).isRequired,
  scrollOffsetTop: PropTypes.number.isRequired,
  scrollRetries: PropTypes.number.isRequired,
  scrollRetryDelay: PropTypes.number.isRequired,
  switchToSingleCanvasView: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  TargetComponent: PropTypes.oneOfType([PropTypes.func, PropTypes.node]).isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  targetProps: PropTypes.object.isRequired,
  windowViewType: PropTypes.string.isRequired,
};

/** mapStateToProps / mapDispatchToProps unchanged from your version */
function mapStateToProps(state, { targetProps: { windowId } }) {
  const canvases = getVisibleCanvases(state, { windowId });
  const annotationsOnCanvases = {};
  const creation = getCompanionWindowsForContent(state, { content: 'annotationCreation', windowId });
  const annotationEditCompanionWindowIsOpened = Object.keys(creation).length === 0;

  canvases.forEach((canvas) => {
    const anno = state.annotations[canvas.id];
    if (anno) annotationsOnCanvases[canvas.id] = anno;
  });

  return {
    annotationEditCompanionWindowIsOpened,
    annotationsOnCanvases,
    canvases,
    config: { ...state.config, translations },
    windowViewType: getWindowViewType(state, { windowId }),
  };
}
/**
 * Map Redux dispatch actions to props for the CanvasAnnotationsWrapper.
 *
 * Provides callback props that allow the wrapped component to interact
 * with the Mirador Redux store, including:
 *
 * - `addCompanionWindow`: Open a companion window for the given window ID,
 *   with specified content and optional extra props.
 * - `receiveAnnotation`: Add or update an annotation in the Redux store
 *   for a specific target.
 * - `switchToSingleCanvasView`: Change the current window's view type
 *   to `"single"`.
 *
 * @function
 * @param {Function} dispatch - Redux dispatch function.
 * @param {object} props - The wrapper component props.
 * @param {object} props.targetProps - Props passed down to the wrapped target component.
 * @param {string} props.targetProps.windowId - The ID of the Mirador window.
 * @returns {object} An object mapping action dispatchers to props.
 * @property {function(string, object):void} addCompanionWindow
 * @property {function(string, string, object):void} receiveAnnotation
 * @property {function():void} switchToSingleCanvasView
 */
const mapDispatchToProps = (dispatch, props) => ({
  addCompanionWindow: (content, additionalProps) => dispatch(actions.addCompanionWindow(
    props.targetProps.windowId,
    { content, ...additionalProps },
  )),
  receiveAnnotation: (targetId, id, annotation) => dispatch(
    actions.receiveAnnotation(targetId, id, annotation),
  ),
  switchToSingleCanvasView: () => dispatch(actions.setWindowViewType(props.targetProps.windowId, 'single')),
});
const canvasAnnotationsPlugin = {
  component: CanvasAnnotationsWrapper,
  mapDispatchToProps,
  mapStateToProps,
  mode: 'wrap',
  target: 'CanvasAnnotations',
};
export default canvasAnnotationsPlugin;
