import {
  getKonvaAsDataURL,
  getKonvaShape,
  getSvg,
  OVERLAY_TOOL,
  SHAPES_TOOL,
} from './annotationForm/AnnotationFormOverlay/KonvaDrawing/KonvaUtils';
import { TEMPLATE } from './annotationForm/AnnotationFormUtils';

/**
 * Check if annotation is exportable to image in case of Konva annotation
 * @param maeData
 * @returns {boolean}
 */
function isAnnotationExportableToImage(maeData) {
  if (maeData.templateType === TEMPLATE.KONVA_TYPE) {
    if (maeData.target.drawingState.shapes.length > 1) {
      return true;
    }
    if (maeData.target.drawingState.shapes.length === 1 && maeData.target.drawingState.shapes[0].type !== 'rectangle') {
      return true;
    }
  }
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
  console.info('Annotation state to be saved', annotationState);
  console.info('Annotation state target', annotationState.maeData.target);

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
    || annotationStateForSaving.maeData.templateType === TEMPLATE.TEXT_TYPE) {
    // Complex annotation
    if (annotationStateForSaving.maeData.target.drawingState.shapes.length > 0) {
      annotationStateForSaving.maeData.target.svg = await getSvg(windowId);
    }
  }

  if (isAnnotationExportableToImage(annotationStateForSaving.maeData)) {
    annotationStateForSaving.body.id = await getKonvaAsDataURL(windowId);
    annotationStateForSaving.body.format = 'image/jpg';
    annotationStateForSaving.type = 'Annotation';
  }

  // MAEV Specific
  if (annotationStateForSaving.maeData.templateType == TEMPLATE.IMAGE_TYPE) {
    if (annotationStateForSaving.maeData.target.drawingState.shapes.length == 1) {
      // eslint-disable-next-line max-len
      annotationStateForSaving.body.id = annotationStateForSaving.maeData.target.drawingState.shapes[0].url;
      annotationStateForSaving.type = 'Annotation';
    }
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
    case TEMPLATE.KONVA_TYPE:
      return getIIIFTargetFromKonvaType(maeData, canvasId);
    case TEMPLATE.IMAGE_TYPE:
      return getIIIFTargetFromImageType(maeData, canvasId, windowId, playerScale);
    case TEMPLATE.TAGGING_TYPE:
    case TEMPLATE.MANIFEST_TYPE:
    case TEMPLATE.TEXT_TYPE:
      // Note, tagging or Manifest network template
      if (templateType === TEMPLATE.TAGGING_TYPE
        || templateType === TEMPLATE.MANIFEST_TYPE
        || templateType === TEMPLATE.TEXT_TYPE) {
        // In some case the target can be simplified in a string
        if (maeTarget.drawingState.shapes.length === 1
          && maeTarget.drawingState.shapes[0].type === SHAPES_TOOL.RECTANGLE) {
          return getIIIFTargetFromRectangleShape(
            maeTarget,
            canvasId,
            maeTarget.drawingState.shapes[0],
          );
        }
        // On the other case, the target is a SVG
        console.info('Implement target as SVG/Fragment with shapes');
        return getIIIFTargetAsFragmentSVGSelector(maeTarget, canvasId);
      }
      break;
    default:
      return getIIIFTargetFullCanvas(maeData, canvasId);
  }

  // Default return
  return getIIIFTargetFullCanvas(maeData, canvasId);
};

/**
 * Get the IIIF target from a Konva annotation (Drawing template)
 * @param maeData
 * @param canvasId
 * @returns {`${string}#${string}`}
 */
const getIIIFTargetFromKonvaType = (maeData, canvasId) => {
  // Simplified target for Konva annotation
  console.log('Implement target as string with Konva annotation');
  return getIIIFTargetFullCanvas(maeData, canvasId);
};

/**
 * Get the IIIF target from an annotation with image template
 * @param maeData
 * @param canvasId
 * @param windowId
 * @param playerScale
 * @returns {string}
 */
const getIIIFTargetFromImageType = (maeData, canvasId, windowId, playerScale) => {
  const maeTarget = maeData.target;

  if (maeTarget.drawingState.shapes.length === 1) {
    if (maeTarget.drawingState.shapes[0].type === OVERLAY_TOOL.IMAGE) {
      const {
        x,
        y,
      } = maeTarget.drawingState.shapes[0];
      const imageShape = getKonvaShape(windowId, maeTarget.drawingState.shapes[0].id);
      console.log('imageShape', imageShape);
      const widthImage = Math.round(
        imageShape.attrs.image.width * imageShape.attrs.scaleX / playerScale,
      );
      const heightImage = Math.round(
        imageShape.attrs.image.height * imageShape.attrs.scaleY / playerScale,
      );
      const xImage = Math.round(x / playerScale);
      const yImage = Math.round(y / playerScale);
      return `${canvasId}#${maeTarget.tend ? `xywh=${xImage},${yImage},${widthImage},${heightImage}&t=${maeTarget.tstart},${maeTarget.tend}` : `xywh=${xImage},${yImage},${widthImage},${heightImage}`}`;
    }
  }
  // Default return. For example if no image is upload in the annotation
  return getIIIFTargetFullCanvas(maeData, canvasId);
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
