import {
  getKonvaAsDataURL,
  getSvg,
  SHAPES_TOOL,
} from './annotationForm/AnnotationFormOverlay/KonvaDrawing/KonvaUtils';
import { TARGET_TOOL_STATE, TEMPLATE } from './annotationForm/AnnotationFormUtils';

/**
 * Check if annotation is exportable to image in case of Konva annotation
 * @param maeData
 * @returns {boolean}
 */
function isAnnotationExportableToImage(maeData) {
  return false;
}

/**
 * Convert annotation state to be saved. Function change the annotationState object
 * @param annotationState
 * @param canvas
 * @param windowId
 * @param playerReferences
 * @returns {Promise<void>}
 */
export const convertAnnotationStateToBeSaved = async (
  annotationState,
  canvas,
  windowId,
  playerReferences,
) => {
  const annotationStateForSaving = annotationState;

  if (annotationState.maeData.templateType === TEMPLATE.IIIF_TYPE) {
    return annotationState;
  }

  // TODO I dont know why this code is here? To clean the object ?
  annotationStateForSaving.maeData.target = {
    drawingState: annotationStateForSaving.maeData.target.drawingState,
    fullCanvaXYWH: annotationStateForSaving.maeData.target.fullCanvaXYWH,
    scale: annotationStateForSaving.maeData.target.scale,
    tend: annotationStateForSaving.maeData.target.tend,
    tstart: annotationStateForSaving.maeData.target.tstart,
  };

  console.info('Annotation state target', annotationState.maeData.target);

  if (annotationStateForSaving.maeData.templateType === TEMPLATE.TAGGING_TYPE
    || annotationStateForSaving.maeData.templateType === TEMPLATE.TEXT_TYPE
    || annotationStateForSaving.maeData.templateType === TEMPLATE.MULTIPLE_BODY_TYPE) {
    // Complex annotation
    if (annotationStateForSaving.maeData.target.drawingState.shapes.length > 0) {
      annotationStateForSaving.maeData.target.svg = await getSvg(windowId);
    }
  }

  if (annotationStateForSaving.maeData.templateType === TEMPLATE.MULTIPLE_BODY_TYPE) {
    annotationStateForSaving.body = [annotationState.maeData.textBody];
    annotationStateForSaving.body.push(...annotationState.maeData.tags.map((tag) => ({
      id: tag.value,
      purpose: 'tagging',
      type: 'TextualBody',
      value: tag.value,
    })));
  }

  if (isAnnotationExportableToImage(annotationStateForSaving.maeData)) {
    annotationStateForSaving.body.id = await getKonvaAsDataURL(windowId);
    annotationStateForSaving.body.format = 'image/jpg';
    annotationStateForSaving.type = 'Annotation';
  }

  // TODO Always relevant ?
  annotationStateForSaving.maeData.target.scale = playerReferences.getMediaTrueHeight()
    / playerReferences.getDisplayedMediaHeight() * playerReferences.getZoom();

  annotationStateForSaving.target = getIIIFTargetFromMaeData(
    annotationStateForSaving.maeData,
    canvas.id,
    windowId,
    playerReferences.getScale(),
  );

  annotationStateForSaving.maeData.target.drawingState = JSON.stringify(
    annotationStateForSaving.maeData.target.drawingState,
  );

  return annotationStateForSaving;
};

/** Get the IIIF target from the annotation state
 * @param maeData
 * @param canvasId
 * @param windowId NEEDED By MAEV
 * @param playerScale NEEDED By MAEV
 * @returns {{selector: [{type: string, value},{type: string, value: string}], source}|*|string}
 */
export const getIIIFTargetFromMaeData = (
  maeData,
  canvasId,
  windowId = null,
  playerScale = null,
) => {
  const maeTarget = maeData.target;
  const { templateType } = maeData;

  switch (templateType) {
    case TEMPLATE.IIIF_TYPE:
      return maeTarget;
    case TEMPLATE.TAGGING_TYPE:
    case TEMPLATE.TEXT_TYPE:
    case TEMPLATE.MULTIPLE_BODY_TYPE:
      // In some case the target can be simplified in a string
      if (isSimpleTarget(maeTarget.drawingState.shapes)) {
        return getIIIFTargetFromRectangleShape(
          maeTarget,
          canvasId,
          maeTarget.drawingState.shapes[0],
        );
      }
      // On the other case, the target is a SVG
      console.info('Implement target as SVG/Fragment with shapes');
      return getIIIFTargetAsFragmentSVGSelector(maeTarget, canvasId);
    default:
      return getIIIFTargetFullCanvas(maeData, canvasId);
  }

  // Default return
  return getIIIFTargetFullCanvas(maeData, canvasId);
};

/**
 * Check if the target is a simple rectangle with the same color as the tool
 * @param shapes
 * @returns {boolean}
 */
const isSimpleTarget = (shapes) => {
  if (shapes.length !== 1) return false;
  const shape = shapes[0];
  return isRectangleShape(shape) && hasMatchingStrokeAndFillColors(shape);
};

/**
 * Check if the shape is a rectangle
 * @param shape
 * @returns {boolean}
 */
const isRectangleShape = (shape) => {
  return shape.type === SHAPES_TOOL.RECTANGLE;
};

/**
 * Check if the shape has the same stroke and fill colors as the TARGET_TOOL_STATE
 * @param shape
 * @returns {boolean}
 */
const hasMatchingStrokeAndFillColors = (shape) => {
  return shape.strokeColor === TARGET_TOOL_STATE.strokeColor
    && shape.fillColor === TARGET_TOOL_STATE.fillColor;
};

/**
 * Get the IIIF target from the full canvas
 * @param maeData
 * @param canvasId
 * @returns {`${string}#${string}`}
 */
const getIIIFTargetFullCanvas = (maeData, canvasId) => {
  console.info('Implement target as string on fullSizeCanvas.');
  const maeTarget = maeData.target;
  return `${canvasId}#${maeTarget.tend ? `xywh=${maeTarget.fullCanvaXYWH}&t=${maeTarget.tstart},${maeTarget.tend}` : `xywh=${maeTarget.fullCanvaXYWH}`}`;
};

/**
 * Get the IIIF target from a rectangle shape
 * @param maeTarget
 * @param canvasId
 * @param shape
 * @returns {`${string}#${string}`}
 */
const getIIIFTargetFromRectangleShape = (maeTarget, canvasId, shape) => {
  console.info('Implement target as string with one shape (rectangle)');
  const {
    x,
    y,
    width,
    height,
    scaleX,
    scaleY,
  } = shape;

  // Image have not tstart and tend
  // We use scaleX and scaleY to have the real size of the shape, if it has been resized
  return `${canvasId}#${maeTarget.tend ? `xywh=${x},${y},${width * scaleX},${height * scaleY}&t=${maeTarget.tstart},${maeTarget.tend}` : `xywh=${x},${y},${width * scaleX},${height * scaleY}`}`;
};

/**
 * Get the IIIF target as a fragment selector with SVG
 * @param maeTarget
 * @param canvasId
 * @returns {{selector: [{type: string, value},{type: string, value: string}], source}}
 */
const getIIIFTargetAsFragmentSVGSelector = (maeTarget, canvasId) => {
  const fragmentTarget = `${maeTarget.tend ? `t=${maeTarget.tstart},${maeTarget.tend}` : ''}`;
  return {
    selector: [
      {
        type: 'SvgSelector',
        value: maeTarget.svg,
      },
      {
        type: 'FragmentSelector',
        value: `${canvasId}#${fragmentTarget}`,
      },
    ],
    source: canvasId,
  };
};
