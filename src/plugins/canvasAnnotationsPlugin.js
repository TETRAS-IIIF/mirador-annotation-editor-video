import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  addCompanionWindow as addCompanionWindowAction,
  getCompanionWindowsForContent,
  getVisibleCanvases,
  getWindowViewType,
  receiveAnnotation as receiveAnnotationAction,
  setWindowViewType as setWindowViewTypeAction,
} from 'mirador';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import CanvasListItem from '../CanvasListItem';
import AnnotationActionsContext from '../AnnotationActionsContext';
import SingleCanvasDialog from '../SingleCanvasDialog';
import translations from '../locales/locales';
import {
  scrollToSelectedAnnotation,
} from './canvasAnnotationsPluginUtils';

// TODO Attention merge M4upstream


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
}) {
  const [singleCanvasDialogOpen, setSingleCanvasDialogOpen] = useState(false);

  const { t } = useTranslation();

  const wrapperRef = useRef(null);
  const bridgedScrollRef = useRef(null);

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
  /* const toggleSingleCanvasDialogOpen = useCallback(
    () => setSingleCanvasDialogOpen((p) => !p),
    [],
  );*/

  // Add translations from config to i18n
  useEffect(() => {
    if (i18n.isInitialized && config.translations) {
      Object.keys(config.translations)
        .forEach((language) => {
          i18n.addResourceBundle(
            language,
            'translation',
            config.translations[language],
            true,
            true,
          );
        });

      if (config.language) {
        i18n.changeLanguage(config.language);
      }
    }
  }, [config.translations, config.language]);

  /** */
  const toggleSingleCanvasDialogOpen = () => {
    setSingleCanvasDialogOpen((prev) => !prev);
  };

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
  annotationsOnCanvases: PropTypes.shape({
    id: PropTypes.string,
    isFetching: PropTypes.bool,
    json: PropTypes.shape({
      id: PropTypes.string,
      items: PropTypes.arrayOf(
        PropTypes.shape({
          body: PropTypes.shape({
            format: PropTypes.string,
            id: PropTypes.string,
            value: PropTypes.string,
          }),
          drawingState: PropTypes.string,
          id: PropTypes.string,
          manifestNetwork: PropTypes.string,
          motivation: PropTypes.string,
          target: PropTypes.string,
          type: PropTypes.string,
        }),
      ),
      type: PropTypes.string,
    }),
  }).isRequired,
  canvases: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      index: PropTypes.number,
    }),
  ).isRequired,
  config: PropTypes.shape({
    annotation: PropTypes.shape({
      adapter: PropTypes.func,
    }),
    language: PropTypes.string,
    // eslint-disable-next-line react/forbid-prop-types
    translations: PropTypes.objectOf(PropTypes.object),
  }).isRequired,
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
    if (anno) {
      annotationsOnCanvases[canvas.id] = anno;
    }
  });


  // TODO Before merging we were injecting translation inside config.
  //  Perhaps a regression to remove it
  return {
    annotationEditCompanionWindowIsOpened,
    annotationsOnCanvases,
    canvases,
    config: {
      ...state.config,
      translations,
    },
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
    receiveAnnotationAction(targetId, id, annotation),
  ),
  switchToSingleCanvasView: () => dispatch(
    setWindowViewTypeAction(props.targetProps.windowId, 'single'),
  ),
});
const canvasAnnotationsPlugin = {
  component: CanvasAnnotationsWrapper,
  mapDispatchToProps,
  mapStateToProps,
  mode: 'wrap',
  target: 'CanvasAnnotations',
};
export default canvasAnnotationsPlugin;
