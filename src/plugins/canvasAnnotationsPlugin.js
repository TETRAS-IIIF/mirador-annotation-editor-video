import React, {
  useEffect, useMemo, useRef, useState,
} from 'react';
import PropTypes from 'prop-types';
import { getVisibleCanvases } from 'mirador/dist/es/src/state/selectors/canvases';
import * as actions from 'mirador/dist/es/src/state/actions';
import { getWindowViewType } from 'mirador/dist/es/src/state/selectors';
import { getCompanionWindowsForContent } from 'mirador/dist/es/src/state/selectors/companionWindows';
import CanvasListItem from '../CanvasListItem';
import AnnotationActionsContext from '../AnnotationActionsContext';
import SingleCanvasDialog from '../SingleCanvasDialog';
import translations from '../locales/locales';
import ns from "mirador/dist/es/src/config/css-ns";

/**
 * Utilities
 */
const isScrollable = (el) => {
  if (!el) return false;
  const cs = getComputedStyle(el);
  const oy = cs.overflowY || cs.overflow || '';
  return /(auto|scroll|overlay)/.test(oy) && el.scrollHeight > el.clientHeight;
};
const closestScrollableAncestor = (node) => {
  let cur = node?.parentElement || null;
  while (cur) {
    if (isScrollable(cur)) return cur;
    cur = cur.parentElement;
  }
  return null;
};
const firstScrollableDescendant = (root) => {
  if (!root) return null;
  for (const el of Array.from(root.children)) if (isScrollable(el)) return el;
  for (const el of Array.from(root.querySelectorAll('*'))) if (isScrollable(el)) return el;
  return null;
};
const getWindowScroller = () => document.scrollingElement || document.documentElement;

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
  debug = false,
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

      if (debug && chosen) {
        const cs = getComputedStyle(chosen);
        // eslint-disable-next-line no-console
        console.debug('[Wrapper] chosen scroller', chosen, {
          overflowY: cs.overflowY, clientHeight: chosen.clientHeight, scrollHeight: chosen.scrollHeight,
        });
      }
    };

    resolve();
    const raf = requestAnimationFrame(resolve);
    const mo = new MutationObserver(resolve);
    mo.observe(root, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
    };
  }, [targetProps?.windowId, markerClass, debug]);

  useEffect(() => {
    const selId = targetProps?.selectedAnnotationId;
    if (!selId) return;

    const node = wrapperRef.current?.querySelector(`li[annotationid="${selId}"]`)
            || wrapperRef.current?.querySelector('li.MuiMenuItem-root.Mui-selected');
    if (!node) return;

    const runOnce = () => new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          let container = bridgedScrollRef.current;
          if (!isScrollable(container)) container = closestScrollableAncestor(node);
          if (!isScrollable(container)) container = getWindowScroller();

          if (debug) {
            // eslint-disable-next-line no-console
            console.debug('[Wrapper] scrolling to', selId, 'node:', node, 'container:', container);
          }

          const isWindow = container === document.body
                        || container === document.documentElement
                        || container === document.scrollingElement;

          if (isWindow) {
            const t = computeTargetWindow(node, scrollOffsetTop);
            if (t == null) return resolve(true);
            const before = window.scrollY;
            window.scrollTo({ top: t, behavior: scrollBehavior });
            setTimeout(() => {
              const after = window.scrollY;
              resolve(Math.abs(after - before) > 0.5);
            }, scrollRetryDelay);
            return;
          }

          const t = computeTargetContainer(container, node, scrollOffsetTop);
          if (t == null) return resolve(true);
          const before = container.scrollTop;
          if (typeof container.scrollTo === 'function') {
            container.scrollTo({ top: t, behavior: scrollBehavior });
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
        ok = await runOnce();
        if (!ok) {
          attempt += 1;
          if (debug) {
            // eslint-disable-next-line no-console
            console.debug('[Wrapper] retry', attempt, 'in', scrollRetryDelay, 'ms');
          }
          if (attempt <= scrollRetries) {
            await new Promise((r) => setTimeout(r, scrollRetryDelay));
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
    debug,
  ]);

  const toggleSingleCanvasDialogOpen = () => setSingleCanvasDialogOpen((p) => !p);

  const props = {
    ...targetProps,
    listContainerComponent: CanvasListItem,
    containerRef: bridgedScrollRef, // harmless: CanvasAnnotations can keep passing this to its own ScrollTo if present
  };

  return (
    <AnnotationActionsContext.Provider
      value={{
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
      }}
    >
      <div ref={wrapperRef} style={{ position: 'relative', height: '100%' }}>
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
  canvases: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string, index: PropTypes.number })).isRequired,
  config: PropTypes.shape({ annotation: PropTypes.shape({ adapter: PropTypes.func }) }).isRequired,
  receiveAnnotation: PropTypes.func.isRequired,
  switchToSingleCanvasView: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  TargetComponent: PropTypes.oneOfType([PropTypes.func, PropTypes.node]).isRequired,
  targetProps: PropTypes.object.isRequired,
  windowViewType: PropTypes.string.isRequired,
  scrollOffsetTop: PropTypes.number,
  scrollRetries: PropTypes.number,
  scrollRetryDelay: PropTypes.number,
  scrollBehavior: PropTypes.oneOf(['auto', 'smooth']),
  debug: PropTypes.bool,
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
const mapDispatchToProps = (dispatch, props) => ({
  addCompanionWindow: (content, additionalProps) => dispatch(actions.addCompanionWindow(props.targetProps.windowId, { content, ...additionalProps })),
  receiveAnnotation: (targetId, id, annotation) => dispatch(actions.receiveAnnotation(targetId, id, annotation)),
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
