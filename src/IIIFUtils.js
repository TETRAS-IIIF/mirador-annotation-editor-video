import {
  getKonvaAsDataURL,
  getSvg,
  SHAPES_TOOL,
} from './annotationForm/AnnotationFormOverlay/KonvaDrawing/KonvaUtils';
import { TEMPLATE } from './annotationForm/AnnotationFormUtils';

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
  // eslint-disable-next-line no-shadow
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

  if (annotationStateForSaving.maeData.templateType == TEMPLATE.TAGGING_TYPE
    || annotationStateForSaving.maeData.templateType == TEMPLATE.TEXT_TYPE) {
    // Complex annotation
    if (annotationStateForSaving.maeData.target.drawingState.shapes.length > 0) {
      // eslint-disable-next-line no-param-reassign
      annotationStateForSaving.maeData.target.svg = await getSvg(windowId);
    }
  }

  if (isAnnotationExportableToImage(annotationStateForSaving.maeData)) {
    annotationStateForSaving.body.id = await getKonvaAsDataURL(windowId);
    annotationStateForSaving.body.format = 'image/jpg';
    annotationStateForSaving.type = 'Annotation';
  }

  // eslint-disable-next-line no-param-reassign
  annotationStateForSaving.maeData.target.scale = playerReferences.getMediaTrueHeight()
    / playerReferences.getDisplayedMediaHeight() * playerReferences.getZoom();

  // eslint-disable-next-line no-param-reassign
  annotationStateForSaving.target = maeTargetToIiifTarget(
    annotationStateForSaving.maeData.target,
    canvas.id,
    playerReferences.getScale(),
    windowId,
  );
  // eslint-disable-next-line no-param-reassign
  annotationStateForSaving.maeData.target.drawingState = JSON.stringify(
    annotationStateForSaving.maeData.target.drawingState,
  );

  return annotationStateForSaving;
};

/** Transform maetarget to IIIF compatible data * */
export const maeTargetToIiifTarget = (maeTarget, canvasId, playerScale, windowId = null) => {
  // In case of IIIF target, the user know what he is doing
  if (maeTarget.templateType === TEMPLATE.IIIF_TYPE) {
    return maeTarget;
  }

  // In some case the target can be simplify in a string
  if (maeTarget.drawingState.shapes.length === 1
    && maeTarget.drawingState.shapes[0].type === SHAPES_TOOL.RECTANGLE) {
    const {
      // eslint-disable-next-line prefer-const
      x,
      y,
      width,
      height,
      scaleX,
      scaleY,
    } = maeTarget.drawingState.shapes[0];
    console.info('Implement target as string with one shape (rectangle)');
    // Image have not tstart and tend
    // We use scaleX and scaleY to have the real size of the shape, if it has been resized
    return `${canvasId}#${maeTarget.tend ? `xywh=${x},${y},${width * scaleX},${height * scaleY}&t=${maeTarget.tstart},${maeTarget.tend}` : `xywh=${x},${y},${width * scaleX},${height * scaleY}`}`;
  }
  // On the other case, the target is a SVG
  console.info('Implement target as SVG/Fragment with shapes');
  const fragmentTarget = `${maeTarget.tend ? `xywh=${maeTarget.fullCanvaXYWH}&t=${maeTarget.tstart},${maeTarget.tend}` : `xywh=${maeTarget.fullCanvaXYWH}`}`;
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
