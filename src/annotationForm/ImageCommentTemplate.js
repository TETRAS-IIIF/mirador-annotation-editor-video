import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Grid } from '@mui/material';
import Typography from '@mui/material/Typography';
import TextFormSection from './TextFormSection';
import TargetFormSection from './TargetFormSection';
import { IMAGE_TOOL_STATE, TARGET_VIEW, TEMPLATE } from './AnnotationFormUtils';
import { KONVA_MODE, resizeKonvaStage } from './AnnotationFormOverlay/KonvaDrawing/KonvaUtils';
import AnnotationDrawing from './AnnotationFormOverlay/AnnotationDrawing';
import AnnotationFormOverlay from './AnnotationFormOverlay/AnnotationFormOverlay';
import AnnotationFormFooter from './AnnotationFormFooter';

/**
 * Image Comment template
 */
export default function ImageCommentTemplate(
  {
    annotation,
    closeFormCompanionWindow,
    playerReferences,
    saveAnnotation,
    windowId,
    t,
  },
) {
  let maeAnnotation = annotation;
  if (!maeAnnotation.id) {
    // If the annotation does not have maeData, the annotation was not created with mae
    maeAnnotation = {
      body: {
        id: null,
        type: 'Image',
        value: '',
      },
      maeData: {
        target: null,
        templateType: TEMPLATE.IMAGE_TYPE,
      },
      motivation: 'commenting',
      target: null,
    };
  } else if (maeAnnotation.maeData.target.drawingState && typeof maeAnnotation.maeData.target.drawingState === 'string') {
    maeAnnotation.maeData.target.drawingState = JSON.parse(
      maeAnnotation.maeData.target.drawingState,
    );
  }

  const [annotationState, setAnnotationState] = useState(maeAnnotation);

  /** updateTargetState with maeDate * */
  const updateTargetState = (target) => {
    const newMaeData = annotationState.maeData;
    newMaeData.target = target;
    setAnnotationState({
      ...annotationState,
      maeData: newMaeData,
    });
  };

  /** save Function * */
  const saveFunction = () => {
    resizeKonvaStage(
      windowId,
      playerReferences.getMediaTrueWidth(),
      playerReferences.getMediaTrueHeight(),
      1 / playerReferences.getScale(),
    );
    annotationState.maeData.target.drawingState = drawingState;
    saveAnnotation(annotationState);
  };

  /** Update Annotation with body Text * */
  const updateAnnotationTextualBodyValue = (newTextValue) => {
    const newBody = annotationState.body;
    newBody.value = newTextValue;
    setAnnotationState({
      ...annotationState,
      body: newBody,
    });
  };

  /** ****************************************
   * Drawing stuff
   ***************************************** */
  const [toolState, setToolState] = useState(IMAGE_TOOL_STATE);

  /** Initialize drawingState * */
  const initDrawingState = () => {
    if (annotationState.maeData.target && annotationState.maeData.target.drawingState) {
      return {
        ...annotationState.maeData.target.drawingState,
        isDrawing: false,
      };
    }
    return {
      currentShape: null,
      isDrawing: false,
      shapes: [],
    };
  };

  const [drawingState, setDrawingState] = useState(initDrawingState());

  const [scale, setScale] = useState(playerReferences.getZoom());
  const [viewTool, setViewTool] = useState(TARGET_VIEW);

  useEffect(() => {

  }, [toolState.fillColor, toolState.strokeColor, toolState.strokeWidth]);

  /** Change scale from container / canva */
  const updateScale = () => {
    setScale(playerReferences.getZoom());
  };

  /**
   * Updates the tool state by merging the current color state with the existing tool state.
   * @param {object} colorState - The color state to be merged with the tool state.
   * @returns {void}
   */
  const setColorToolFromCurrentShape = (colorState) => {
    setToolState((prevState) => ({
      ...prevState,
      ...colorState,
    }));
  };

  /**
   * Deletes a shape from the drawing state based on its ID.
   * If no shape ID is provided, clears all shapes from the drawing state.
   *
   * @param {string} [shapeId] - The ID of the shape to delete.
   * If not provided, clears all shapes.
   */
  const deleteShape = (shapeId) => {
    if (!shapeId) {
      setDrawingState((prevState) => ({
        ...prevState,
        currentShape: null,
        shapes: [],
      }));
    } else {
      setDrawingState((prevState) => ({
        ...prevState,
        currentShape: null,
        shapes: prevState.shapes.filter((shape) => shape.id !== shapeId),
      }));
    }
  };

  /** Update CurrentShape * */
  const updateCurrentShapeInShapes = (currentShape) => {
    if (currentShape) {
      const index = drawingState.shapes.findIndex((s) => s.id === currentShape.id);
      if (index !== -1) {
        // eslint-disable-next-line max-len
        const updatedShapes = drawingState.shapes.map((shape, i) => (i === index ? currentShape : shape));
        setDrawingState({
          ...drawingState,
          currentShape,
          shapes: updatedShapes,
        });
      } else {
        setDrawingState({
          ...drawingState,
          currentShape,
          shapes: [...drawingState.shapes, currentShape],
        });
      }
    } else {
      setDrawingState({
        ...drawingState,
        currentShape: null,
        shapes: drawingState.shapes,
      });
    }
  };

  return (
    <Grid container direction="column" spacing={1}>
      <Grid item>
        <Typography variant="formSectionTitle">
          {t('image')}
        </Typography>
      </Grid>
      <Grid item>
        <AnnotationDrawing
          annotation={annotation}
          closed={toolState.closedMode === 'closed'}
          displayMode={KONVA_MODE.IMAGE}
          drawingState={drawingState}
          playerReferences={playerReferences}
          scale={scale}
          setColorToolFromCurrentShape={setColorToolFromCurrentShape}
          setDrawingState={setDrawingState}
          showFragmentSelector={false}
          tabView={viewTool}
          toolState={toolState}
          updateCurrentShapeInShapes={updateCurrentShapeInShapes}
          updateScale={updateScale}
          windowId={windowId}
          setToolState={setToolState}
        />
      </Grid>
      <Grid item>
        <AnnotationFormOverlay
          toolState={toolState}
          deleteShape={deleteShape}
          setToolState={setToolState}
          shapes={drawingState.shapes}
          currentShape={drawingState.currentShape}
          setViewTool={setViewTool}
          updateCurrentShapeInShapes={updateCurrentShapeInShapes}
          showStyleTools
          displayMode={KONVA_MODE.IMAGE}
          t={t}
        />
      </Grid>
      <Grid item>
        <TextFormSection
          annoHtml={annotationState.body.value}
          updateAnnotationBody={updateAnnotationTextualBodyValue}
          t={t}
        />
      </Grid>
      <TargetFormSection
        onChangeTarget={updateTargetState}
        playerReferences={playerReferences}
        spatialTarget={false}
        t={t}
        target={annotationState.maeData.target}
        timeTarget
        windowId={windowId}
      />
      <Grid item>
        <AnnotationFormFooter
          closeFormCompanionWindow={closeFormCompanionWindow}
          saveAnnotation={saveFunction}
          t={t}
          annotationState={annotationState}
        />
      </Grid>
    </Grid>
  );
}

ImageCommentTemplate.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  annotation: PropTypes.oneOfType([
    PropTypes.shape({
      body: PropTypes.shape({
        format: PropTypes.string,
        id: PropTypes.string,
        type: PropTypes.string,
        value: PropTypes.string,
      }),
      // eslint-disable-next-line react/forbid-prop-types
      drawingState: PropTypes.object,
      id: PropTypes.string,
      manifestNetwork: PropTypes.string,
      motivation: PropTypes.string,
      target: PropTypes.string,
    }),
    PropTypes.string,
  ]).isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  closeFormCompanionWindow: PropTypes.func.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  playerReferences: PropTypes.object.isRequired,
  saveAnnotation: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  windowId: PropTypes.string.isRequired,

};
