import ToggleButton from '@mui/material/ToggleButton';
import RectangleIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CircleIcon from '@mui/icons-material/RadioButtonUnchecked';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import PolygonIcon from '@mui/icons-material/Timeline';
import PropTypes from 'prop-types';
import React, { useEffect, useMemo } from 'react';
import { Button, Tooltip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import Typography from '@mui/material/Typography';
import AnnotationFormOverlayToolOptions from './AnnotationFormOverlayToolOptions';
import {
  isShapesTool,
  KONVA_MODE,
  OVERLAY_TOOL,
  SHAPES_TOOL,
} from './KonvaDrawing/KonvaUtils';
import ShapesList from './ShapesList';
import { StyledToggleButtonGroup } from '../AnnotationFormUtils';

/** All the form part for the overlay view */
function AnnotationFormOverlayTool({
  currentShape,
  deleteShape,
  displayMode,
  setToolState,
  shapes,
  t,
  toolState,
  updateCurrentShapeInShapes,
}) {
  /**
     * Updates the active annotation tool when a user selects a new one.
     *
     * @param {Event} e - The event triggered by the user interaction.
     * @param {string} tool - The tool selected by the user.
     * @returns {void}
     */
  const changeTool = (e, tool) => {
    if (!tool) return;
    const nextTool = tool === OVERLAY_TOOL.SHAPE ? SHAPES_TOOL.RECTANGLE : tool;
    setToolState((s) => (s.activeTool === nextTool ? s : { ...s, activeTool: nextTool }));
  };

  /**
     * Updates the global tool state and synchronizes style changes
     * to the currently selected shape if applicable.
     *
     * @param {Object} newState - The partial tool state containing new visual or functional properties.
     * @param {number} [newState.strokeWidth] - The updated stroke width for the shape.
     * @param {string} [newState.strokeColor] - The updated stroke color for the shape.
     * @param {string} [newState.fillColor] - The updated fill color for the shape.
     * @param {string} [newState.text] - The updated text content for text shapes.
     * @param {{id?: string}} [newState.image] - The updated image reference for image shapes.
     * @returns {void}
     */
  const customUpdateToolState = (newState) => {
    // 1) Update global tool defaults/state
    setToolState((s) => ({ ...s, ...newState, activeTool: OVERLAY_TOOL.EDIT }));

    // 2) If a shape is selected, sync the changed visual props onto it
    if (currentShape) {
      const patch = {};
      if (Object.prototype.hasOwnProperty.call(newState, 'strokeWidth')
                && newState.strokeWidth !== currentShape.strokeWidth) {
        patch.strokeWidth = newState.strokeWidth;
      }
      if (Object.prototype.hasOwnProperty.call(newState, 'strokeColor')
                && newState.strokeColor !== currentShape.stroke) {
        patch.stroke = newState.strokeColor;
      }
      if (Object.prototype.hasOwnProperty.call(newState, 'fillColor')
                && newState.fillColor !== currentShape.fill) {
        patch.fill = newState.fillColor;
      }
      if (Object.prototype.hasOwnProperty.call(newState, 'text')
                && newState.text !== currentShape.text) {
        patch.text = newState.text;
      }
      if (Object.prototype.hasOwnProperty.call(newState, 'image')
                && newState.image?.id !== currentShape.url) {
        patch.url = newState.image?.id ?? null;
      }

      if (Object.keys(patch).length) {
        updateCurrentShapeInShapes({ ...currentShape, ...patch });
      }
    }
  };

  useEffect(() => {
    if (toolState.activeTool === OVERLAY_TOOL.SHAPE) {
      setToolState((s) => ({ ...s, activeTool: SHAPES_TOOL.RECTANGLE }));
    }
  }, [toolState.activeTool, setToolState]);

  const selectedToolState = useMemo(
    () => (currentShape
      ? {
        ...toolState,
        activeTool: currentShape.type,
        closedMode: currentShape.closedMode,
        fillColor: currentShape.fill,
        image: { id: currentShape.url },
        strokeColor: currentShape.stroke,
        strokeWidth: currentShape.strokeWidth,
        text: currentShape.text,
      }
      : toolState),
    [toolState, currentShape],
  );

  return (
    <>
      {toolState.activeTool === OVERLAY_TOOL.EDIT && (
        <>
          {(currentShape
                        && (displayMode === KONVA_MODE.DRAW
                            || displayMode === KONVA_MODE.TARGET)) && (
                            <div>
                              <Typography variant="subFormSectionTitle">
                                {t('selected_object')}
                              </Typography>
                              <AnnotationFormOverlayToolOptions
                                t={t}
                                toolState={selectedToolState}
                                setToolState={customUpdateToolState}
                                displayMode={displayMode}
                                currentShape={currentShape}
                              />
                            </div>
          )}
          {displayMode === KONVA_MODE.DRAW && shapes.length > 0 && (
          <>
            <Typography variant="subFormSectionTitle">
              {t('object_list')}
            </Typography>
            <ShapesList
              currentShapeId={currentShape?.id}
              shapes={shapes}
              deleteShape={deleteShape}
              updateCurrentShapeInShapes={updateCurrentShapeInShapes}
              t={t}
            />
          </>
          )}
        </>
      )}
      {isShapesTool(toolState.activeTool) && (
        <StyledToggleButtonGroup
          value={toolState.activeTool}
          exclusive
          onChange={changeTool}
          aria-label={t('tool_selection')}
          size="small"
          data-testid="tool_selection"
        >
          {displayMode !== KONVA_MODE.IMAGE && (
          <Tooltip title={t('rectangle')}>
            <ToggleButton
              value={SHAPES_TOOL.RECTANGLE}
              aria-label={t('add_a_rectangle')}
            >
              <RectangleIcon />
            </ToggleButton>
          </Tooltip>
          )}
          {displayMode === KONVA_MODE.TARGET && (
          <Tooltip title={t('circle')}>
            <ToggleButton
              value={SHAPES_TOOL.CIRCLE}
              aria-label={t('add_a_circle')}
            >
              <CircleIcon />
            </ToggleButton>
          </Tooltip>
          )}
          {displayMode !== KONVA_MODE.IMAGE && (
          <div>
            <Tooltip title={t('line')}>
              <ToggleButton
                value={SHAPES_TOOL.POLYGON}
                aria-label={t('add_a_line')}
              >
                <PolygonIcon />
              </ToggleButton>
            </Tooltip>
          </div>
          )}
          {displayMode === KONVA_MODE.DRAW && (
          <>
            <Tooltip title="Ellipse shape">
              <ToggleButton
                value={SHAPES_TOOL.ELLIPSE}
                aria-label={t('add_an_ellipse')}
              >
                <CircleIcon />
              </ToggleButton>
            </Tooltip>
            <Tooltip title={t('arrow')}>
              <ToggleButton
                value={SHAPES_TOOL.ARROW}
                aria-label={t('add_an_arrow_shape')}
              >
                <ArrowOutwardIcon />
              </ToggleButton>
            </Tooltip>
          </>
          )}
        </StyledToggleButtonGroup>
      )}
      {toolState.activeTool === OVERLAY_TOOL.DELETE && (
        <>
          <Typography variant="overline">{t('delete')}</Typography>
          <p>{t('click_to_delete_shape')}</p>
          <Button onClick={() => deleteShape()}>
            <span>{t('delete_all')}</span>
            <DeleteIcon color="red" />
          </Button>
        </>
      )}
      <AnnotationFormOverlayToolOptions
        t={t}
        toolState={toolState}
        setToolState={setToolState}
        displayMode={displayMode}
        currentShape={currentShape}
      />
    </>
  );
}

AnnotationFormOverlayTool.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  currentShape: PropTypes.object.isRequired,
  deleteShape: PropTypes.func.isRequired,
  displayMode: PropTypes.string.isRequired,
  setToolState: PropTypes.func.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  shapes: PropTypes.array.isRequired,
  t: PropTypes.func.isRequired,
  toolState: PropTypes.shape({
    activeTool: PropTypes.string.isRequired,
    closedMode: PropTypes.string.isRequired,
    fillColor: PropTypes.string.isRequired,
    image: PropTypes.shape({
      id: PropTypes.string,
    }).isRequired,
    strokeColor: PropTypes.string.isRequired,
    strokeWidth: PropTypes.number.isRequired,
    updateColor: PropTypes.func.isRequired,
  }).isRequired,
  updateCurrentShapeInShapes: PropTypes.func.isRequired,
};

export default AnnotationFormOverlayTool;
