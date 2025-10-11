import React, { useEffect, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import Typography from '@mui/material/Typography';
import { Grid } from '@mui/material';
import { useTranslation } from 'react-i18next';
import AnnotationDrawing from './AnnotationFormOverlay/AnnotationDrawing';
import { TARGET_TOOL_STATE, TARGET_VIEW } from './AnnotationFormUtils';
import AnnotationFormOverlay from './AnnotationFormOverlay/AnnotationFormOverlay';
import { KONVA_MODE } from './AnnotationFormOverlay/KonvaDrawing/KonvaUtils';

// Defer a state update until after the current render finishes
function useDeferredSetter(setState) {
  const ref = useRef(setState);
  useEffect(() => { ref.current = setState; }, [setState]);

  return useCallback((update) => {
    // microtask -> runs after render, before paint; setTimeout(0) also works
    queueMicrotask(() => {
      ref.current((prev) => (typeof update === 'function' ? update(prev) : update));
    });
  }, []);
}

export function TargetSpatialInput({
  playerReferences,
  setTargetDrawingState,
  targetDrawingState,
  windowId,
}) {
  const [toolState, setToolState] = useState(TARGET_TOOL_STATE);
  const [viewTool, setViewTool] = useState(TARGET_VIEW);
  const [scale, setScale] = useState(playerReferences.getScale());
  const { t } = useTranslation();

  // Wrap setters passed down; prevents “update during render”
  const deferSetToolState = useDeferredSetter(setToolState);
  const deferSetViewTool = useDeferredSetter(setViewTool);

  const [drawingState, setDrawingState] = useState({
    ...targetDrawingState,
    currentShape: null,
    isDrawing: false,
  });

  // Sync shapes -> parent
  useEffect(() => {
    setTargetDrawingState({ drawingState });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawingState.shapes]);

  // Optional: if parent replaces targetDrawingState, merge it
  useEffect(() => {
    setDrawingState((prev) => ({ ...prev, ...targetDrawingState }));
  }, [targetDrawingState]);

  const updateScale = () => setScale(playerReferences.getScale());

  const deleteShape = (shapeId) => {
    if (!shapeId) {
      setDrawingState((prev) => ({ ...prev, currentShape: null, shapes: [] }));
      return;
    }
    setDrawingState((prev) => ({
      ...prev,
      currentShape: null,
      shapes: prev.shapes.filter((s) => s.id !== shapeId),
    }));
  };

  // Also defer; Overlay might call it while rendering
  const updateCurrentShapeInShapes = useCallback((currentShape) => {
    queueMicrotask(() => {
      setDrawingState((prev) => {
        if (!currentShape) return { ...prev, currentShape: null };
        const idx = prev.shapes.findIndex((s) => s.id === currentShape.id);
        if (idx !== -1) {
          const shapes = prev.shapes.map((s, i) => (i === idx ? currentShape : s));
          return { ...prev, currentShape, shapes };
        }
        return { ...prev, currentShape, shapes: [...prev.shapes, currentShape] };
      });
    });
  }, []);

  return (
    <Grid container direction="column">
      <Grid item container direction="column">
        <Typography variant="subFormSectionTitle">{t('spatialTarget')}</Typography>
        <Grid item direction="row" spacing={2}>
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
            setToolState={deferSetToolState}
            shapes={drawingState.shapes}
            currentShape={drawingState.currentShape}
            setViewTool={deferSetViewTool}
            t={t}
            displayMode={KONVA_MODE.TARGET}
            updateCurrentShapeInShapes={updateCurrentShapeInShapes} // deferred inside
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
