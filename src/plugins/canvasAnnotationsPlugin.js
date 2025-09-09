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
import {
  firstScrollableDescendant, closestScrollableAncestor, scrollToSelectedAnnotation
} from './canvasAnnotationsPluginUtils';

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
}) {
  const [singleCanvasDialogOpen, setSingleCanvasDialogOpen] = useState(false);

  const wrapperRef = useRef(null);
  const bridgedScrollRef = useRef(null);
  const markerClass = useMemo(() => ns('scrollto-scrollable'), []);

  useEffect(() => {
    const root = wrapperRef.current;
    if (!root) return;

    /**
     * Callback to find and mark the scrollable container to use for scrolling to annotations.
     * - Prefers an element with the marker class if present.
     * - Otherwise, prefers the first scrollable descendant of the root.
     * - Otherwise, prefers the closest scrollable ancestor of the root.
     * - Marks the chosen element with the marker class for future reference.
     * - Updates the `bridgedScrollRef` to point to the chosen element or null if none found.
     * - Observes DOM mutations to re-evaluate the scrollable container if the structure changes.
     * @function
     * @returns {void}
     */
    const updateScrollableContainer = () => {
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

    updateScrollableContainer();
    const mo = new MutationObserver(updateScrollableContainer);
    mo.observe(root, { childList: true, subtree: true });

    // eslint-disable-next-line consistent-return
    return () => mo.disconnect();
  }, [targetProps?.windowId, markerClass]);

  useEffect(() => {
    const selId = targetProps?.selectedAnnotationId;
    if (!selId) return;

    const node = wrapperRef.current?.querySelector(`li[annotationid="${selId}"]`)
            || wrapperRef.current?.querySelector('li.MuiMenuItem-root.Mui-selected');
    if (!node) return;

    scrollToSelectedAnnotation(node, bridgedScrollRef);
  }, [
    targetProps?.selectedAnnotationId,
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
