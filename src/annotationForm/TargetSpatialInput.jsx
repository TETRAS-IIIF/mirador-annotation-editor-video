import React, { useLayoutEffect, useRef, useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import Typography from '@mui/material/Typography';
import { Grid } from '@mui/material';
import { useTranslation } from 'react-i18next';
import AnnotationDrawing from './AnnotationFormOverlay/AnnotationDrawing';
import { TARGET_TOOL_STATE, TARGET_VIEW } from './AnnotationFormUtils';
import AnnotationFormOverlay from './AnnotationFormOverlay/AnnotationFormOverlay';
import { KONVA_MODE } from './AnnotationFormOverlay/KonvaDrawing/KonvaUtils';

// Always schedule after commit
function useMacrotaskSetter(setState) {
  const ref = useRef(setState);
  useEffect(() => { ref.current = setState; }, [setState]);
  return useCallback((update) => {
    setTimeout(() => {
      ref.current((prev) => (typeof update === 'function' ? update(prev) : update));
    }, 0);
  }, []);
}

/**
 * TargetSpatialInput - Target spatial input component
 * @param playerReferences
 * @param setTargetDrawingState
 * @param targetDrawingState
 * @param windowId
 */
export function TargetSpatialInput({
  playerReferences,
  setTargetDrawingState,
  targetDrawingState,
  windowId,
}) {
  const { t } = useTranslation();

  const [drawingState, setDrawingState] = useState(() => ({
    currentShape: null,
    isDrawing: false,
    shapes: Array.isArray(targetDrawingState?.shapes) ? targetDrawingState.shapes : [],
    ...targetDrawingState,
  }));

  const [toolState, setToolState] = useState(TARGET_TOOL_STATE);
  const [viewTool, setViewTool] = useState(TARGET_VIEW);
  const [scale, setScale] = useState(playerReferences.getScale());

  const safeSetToolState = useMacrotaskSetter(setToolState);
  const safeSetViewTool  = useMacrotaskSetter(setViewTool);
    console.log("toto")
  const updateScale = useCallback(() => {
    const nxt = playerReferences.getScale();
    setScale((prev) => (prev === nxt ? prev : nxt));
  }, [playerReferences]);

  // Emit to parent only when shapes identity actually changes
  const lastShapesRef = useRef(drawingState.shapes);
  useLayoutEffect(() => {
    const prev = lastShapesRef.current;
    const next = drawingState.shapes;
    if (prev === next) return;
    if (prev && next && prev.length === next.length && prev.every((s, i) => s === next[i])) return;
    lastShapesRef.current = next;
    setTargetDrawingState({ drawingState });
  }, [drawingState.shapes, setTargetDrawingState, drawingState]);

  const deleteShape = useCallback((shapeId) => {
    setDrawingState((prev) => {
      if (!shapeId) {
        if (prev.shapes.length === 0 && prev.currentShape == null) return prev;
        return { ...prev, currentShape: null, shapes: [] };
      }
      const filtered = prev.shapes.filter((s) => s.id !== shapeId);
      if (filtered.length === prev.shapes.length) return prev;
      return { ...prev, currentShape: null, shapes: filtered };
    });
  }, []);

  // Synchronize currentShape with both drawingState.currentShape and
  // drawingState.shapes without triggering redundant re-renders or state churn.
  const updateCurrentShapeInShapes = useCallback((currentShape) => {
    // Defer in case Overlay calls during render
    setTimeout(() => {
      setDrawingState((prev) => {
        if (!currentShape) {
          if (prev.currentShape == null) {
            return prev;
          }
          return { ...prev, currentShape: null };
        }
        const idx = prev.shapes.findIndex((s) => s.id === currentShape.id);
        if (idx !== -1) {
          const prevShape = prev.shapes[idx];
          if (prevShape === currentShape && prev.currentShape === currentShape) {
            return prev;
          }
          const nextShapes = prev.shapes === undefined ? [] : [...prev.shapes];
          nextShapes[idx] = currentShape;
          return { ...prev, currentShape, shapes: nextShapes };
        }
        return { ...prev, currentShape, shapes: [...(prev.shapes || []), currentShape] };
      });
    }, 0);
  }, []);

  return (
    <Grid container direction="column">
      <Grid container direction="column">
        <Typography variant="subFormSectionTitle">{t('spatialTarget')}</Typography>
        <Grid direction="row" spacing={2}>
          <AnnotationDrawing
            displayMode={KONVA_MODE.TARGET}
            drawingState={drawingState}
            playerReferences={playerReferences}
            scale={scale}
            setColorToolFromCurrentShape={() => {}}
            setDrawingState={setDrawingState}
            tabView="edit"
            toolState={toolState}
            updateCurrentShapeInShapes={updateCurrentShapeInShapes}
            updateScale={updateScale}
            windowId={windowId}
            setToolState={setToolState}
          />

          <AnnotationFormOverlay
            toolState={toolState}
            deleteShape={deleteShape}
            setToolState={setToolState}
            shapes={drawingState.shapes}
            currentShape={drawingState.currentShape}
            setViewTool={safeSetViewTool}
            t={t}
            displayMode={KONVA_MODE.TARGET}
            updateCurrentShapeInShapes={updateCurrentShapeInShapes}
          />
        </Grid>
      </Grid>
    </Grid>
  );
}

TargetSpatialInput.propTypes = {
  playerReferences: PropTypes.object.isRequired,
  setTargetDrawingState: PropTypes.func.isRequired,
  targetDrawingState: PropTypes.object.isRequired,
  windowId: PropTypes.string.isRequired,
};
