import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  getVisibleCanvases,
  getWindowViewType,
  getCompanionWindowsForContent,
  setWindowViewType as setWindowViewTypeM3Action,
  addCompanionWindow as addCompanionWindowM3Action,
  receiveAnnotation as receiveAnnotationM3Action,
} from 'mirador';
import CanvasListItem from '../CanvasListItem';
import AnnotationActionsContext from '../AnnotationActionsContext';
import SingleCanvasDialog from '../SingleCanvasDialog';

/** Functional Component */
function CanvasAnnotationsWrapper({
  addCompanionWindow,
  annotationsOnCanvases = {},
  canvases = [],
  config,
  receiveAnnotation,
  switchToSingleCanvasView,
  TargetComponent,
  t,
  targetProps,
  windowViewType,
  annotationEditCompanionWindowIsOpened,
}) {
  const [singleCanvasDialogOpen, setSingleCanvasDialogOpen] = useState(false);

  const toggleSingleCanvasDialogOpen = () => {
    setSingleCanvasDialogOpen((prev) => !prev);
  };

  const props = {
    ...targetProps,
    listContainerComponent: CanvasListItem,
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
        toggleSingleCanvasDialogOpen,
        windowId: targetProps.windowId,
        windowViewType,
      }}
    >
      <TargetComponent {...props} />
      {windowViewType !== 'single' && (
        <SingleCanvasDialog
          handleClose={toggleSingleCanvasDialogOpen}
          open={singleCanvasDialogOpen}
          switchToSingleCanvasView={switchToSingleCanvasView}
          t={t}
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
    PropTypes.shape({ id: PropTypes.string, index: PropTypes.number }),
  ).isRequired,
  config: PropTypes.shape({
    annotation: PropTypes.shape({
      adapter: PropTypes.func,
    }),
  }).isRequired,
  receiveAnnotation: PropTypes.func.isRequired,
  switchToSingleCanvasView: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  TargetComponent: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.node,
  ]).isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  targetProps: PropTypes.object.isRequired,
  windowViewType: PropTypes.string.isRequired,
};

/** TODO this logic is duplicated */
function mapStateToProps(state, { targetProps: { windowId } }) {
  const canvases = getVisibleCanvases(state, { windowId });
  const annotationsOnCanvases = {};
  const annotationCreationCompanionWindows = getCompanionWindowsForContent(state, { content: 'annotationCreation', windowId });
  let annotationEditCompanionWindowIsOpened = true;

  if (Object.keys(annotationCreationCompanionWindows).length !== 0) {
    annotationEditCompanionWindowIsOpened = false;
  }

  canvases.forEach((canvas) => {
    const anno = state.annotations[canvas.id];
    if (anno) {
      annotationsOnCanvases[canvas.id] = anno;
    }
  });
  return {
    annotationEditCompanionWindowIsOpened,
    annotationsOnCanvases,
    canvases,
    config: state.config,
    windowViewType: getWindowViewType(state, { windowId }),
  };
}
/** */
const mapDispatchToProps = (dispatch, props, annotationEditCompanionWindowIsOpened) => ({
  addCompanionWindow: (content, additionalProps) => dispatch(
    addCompanionWindowM3Action(props.targetProps.windowId, { content, ...additionalProps }),
  ),
  receiveAnnotation: (targetId, id, annotation) => dispatch(
    receiveAnnotationM3Action(targetId, id, annotation),
  ),
  switchToSingleCanvasView: () => dispatch(
    setWindowViewTypeM3Action(props.targetProps.windowId, 'single'),
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
