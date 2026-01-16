import { v4 as uuidv4 } from "uuid";

import {
  getKonvaAsDataURL,
  getSvg,
  SHAPES_TOOL,
  OVERLAY_TOOL
} from './annotationForm/AnnotationFormOverlay/KonvaDrawing/KonvaUtils';
import { TARGET_TOOL_STATE, TEMPLATE } from './annotationForm/AnnotationFormUtils';

/**
 * Check if annotation is exportable to image in case of Konva annotation
 * @param maeData
 * @returns {boolean}
 */
// eslint-disable-next-line no-unused-vars
function isAnnotationExportableToImage(maeData) {
  return false;
}

/**
 * Check if the shape has the same stroke and fill colors as the TARGET_TOOL_STATE
 * @param shape
 * @returns {boolean}
 */
const hasMatchingStrokeAndFillColors = (shape) => shape.strokeColor === TARGET_TOOL_STATE.strokeColor
  && shape.fillColor === TARGET_TOOL_STATE.fillColor;

/**
 * Check if the shape is a rectangle
 * @param shape
 * @returns {boolean}
 */
const isRectangleShape = (shape) => shape.type === SHAPES_TOOL.RECTANGLE;

/**
 * Check if the target is a simple rectangle with the same color as the tool
 * @param shapes
 * @returns {boolean}
 */
const isSimpleTarget = (shapes) => {
  if (shapes.length !== 1) return false;
  const shape = shapes[0];

  return isRectangleShape(shape) && (!shape?.rotation || shape.rotation === 0);
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
        console.info('Simple target detected');
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
};

/**
 *
 * @param {{ bodyValue?: string, bodyObj?: (Object|Object[]) }} body
 * @returns {(Object|Object[])}
 */
const convertIIIFBodyToMae = (body) => {
  const { bodyValue, bodyObj } = body;
  const maeBodyTemplate = {
    purpose: "describing",
    type: "TextualBody",
    value: ""
  }
  const convertBodyObjToMae = (_bodyObj) => {
    const maeBody = structuredClone(maeBodyTemplate);
    maeBody.value = _bodyObj.value || "";
    return maeBody;
  }
  if ( bodyValue ) {
    maeBodyTemplate.value = bodyValue;
    return maeBodyTemplate;
  } else if (bodyObj) {
    return Array.isArray(bodyObj)
      ? bodyObj.map(convertBodyObjToMae)
      : convertBodyObjToMae(bodyObj)
  };
}

export function convertIIIFAnnoToMaeData(anno) {
  try {
    const maeData = {
      target: {},
      templateType: "",  // AnnotationFormUtils.TEMPLATE
      tags: [],  // string[]
      // not used if `templateType === "tagging"`
      textBody: {}  // expeced keys: purpose, type, value
    };

    if ( anno.motivation === "tagging" || anno.motivation === "oa:tagging" ) {
      // tags
      maeData.templateType = TEMPLATE.TAGGING_TYPE;
      maeData.tags = [ anno.body.value || anno.bodyValue || "" ]
    } else {
      maeData.templateType = TEMPLATE.MULTIPLE_BODY_TYPE;
      const bodyValue = anno.bodyValue || "";
      maeData.textBody = convertIIIFBodyToMae({ bodyValue: bodyValue, bodyObj: anno.body })
    }

    // TODO handle multiple targets.
    // TODO handle other body types (Choice)
    console.log("anno.target", anno.target);
    if ( anno.target.selector?.type === "FragmentSelector" ) {
      const [ x, y, w, h ] = anno.target.selector.value.replace("xywh=", "").split(",");
      const style = {
        fill: "rgba(100,100,100, 0)",
        stroke: "rgba(255,0, 0, 0.5)",
        strokeWidth: 5
      };
      // TODO these should be dynamic
      const [fullW, fullH, scale] = [2087, 2550, 0.8947368421052632];
      const shapeId = uuidv4();
      const currentShape = {
        id: shapeId,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        type: SHAPES_TOOL.RECTANGLE,
        x: x,
        y: y,
        width: w,
        height: h,
        fill: style.fill,
        stroke: style.stroke,
        strokeWidth: style.strokeWidth
      };
      const xywhSvg = `
        <svg
          version='1.1'
          xmlns='http://www.w3.org/2000/svg'
          xmlns:xlink='http://www.w3.org/1999/xlink'
          width='${fullW}' height='${fullH}'
        >
          <defs/>
          <g><g>
            <path
              fill='${style.fill}'
              stroke='${style.stroke}'
              d=' M ${x} ${y} L ${x+w} ${y} L ${x+w} ${y+h} L ${x} ${x+h} L ${x} ${y} Z Z'
              fill-opacity='0'
              stroke-miterlimit='10'
              stroke-width='${style.strokeWidth}' stroke-dasharray=''
            />
          </g></g>
        </svg>`;

      const maeTarget = {
        drawingState: JSON.stringify({
          currentShape: currentShape,
          shapes: [ currentShape ],
          isDrawing: true,
        }),
        svg: xywhSvg,
        fullCanvaXYWH: `0,0,${fullW},${fullH}`,
        scale: scale
      }
      maeData.target = maeTarget;
      // example SVG for fragment 'xywh=1784.8605898123324,318.92493297587134,-1454.745308310992,358.0911528150134'
      // `<svg version='1.1'
      //       xmlns='http://www.w3.org/2000/svg'
      //       xmlns:xlink='http://www.w3.org/1999/xlink'
      //       width='2087' height='2550'
      // >
      //   <defs/>
      //   <g><g>
      //     <path
      //       fill='rgb(100,100,100)'
      //       stroke='rgb(255,0,0' paint-order='fill stroke markers'
      //       d=' M 1784.8605898123324 318.92493297587134 L 330.1152815013404 318.92493297587134 L 330.1152815013404 677.0160857908847 L 1784.8605898123324 677.0160857908847 L 1784.8605898123324 318.92493297587134 Z Z'
      //       fill-opacity='0'
      //       stroke-miterlimit='10'
      //       stroke-width='3' stroke-dasharray=''
      //     />
      //   </g></g>
      // </svg>`
    }

    console.log("maeData", maeData);
    anno.maeData = maeData;
    return anno;

  } catch (e) {
    console.error("ERROR IN convertIIIFAnnoToMaeData", e);
    return anno;
  }

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

//* *******************************************

/**
 * Create the body of a V2 annotation from a V3 annotation
 * @param {object} v3body
 * @returns {object}
 */
function createV2AnnoBody(v3body) {
  const v2body = {
    chars: v3body.value,
  };
  if (v3body.purpose === 'tagging') {
    v2body['@type'] = 'oa:Tag';
  } else {
    v2body['@type'] = 'dctypes:Text';
  }
  if (v3body.format) {
    v2body.format = v3body.format;
  }
  if (v3body.language) {
    v2body.language = v3body.language;
  }
  if (v3body.purpose) {
    v2body.motivation = v3body.purpose;
  }
  return v2body;
}

/**
 * Create a V2 selector from a V3 selector
 * @param {object} v3selector
 * @returns {object|null}
 */
function createV2AnnoSelector(v3selector) {
  switch (v3selector.type) {
    case 'SvgSelector':
      return {
        '@type': 'oa:SvgSelector',
        value: v3selector.value,
      };
    case 'FragmentSelector':
      return {
        '@type': 'oa:FragmentSelector',
        value: v3selector.value,
      };
    default:
      return null;
  }
}

/**
 * Creates a V2 annotation from a V3 annotation
 * @param {object} v3anno
 * @returns {object}
 */
export function createV2Anno(v3anno) {
  const v2anno = {
    '@context': 'https://iiif.io/api/presentation/2/context.json',
    '@type': 'oa:Annotation',
    maeData: v3anno.maeData || {},
    motivation: 'oa:commenting',
  };
  // copy id if it is SAS-generated
  if (v3anno.id?.startsWith('http')) {
    v2anno['@id'] = v3anno.id;
  }
  if (Array.isArray(v3anno.body)) {
    v2anno.resource = v3anno.body.map((b) => createV2AnnoBody(b));
  } else {
    v2anno.resource = createV2AnnoBody(v3anno.body);
  }
  // v3anno.target can be either a string or an object =>
  // if it's an object, extract it.
  if (typeof v3anno.target === "object" && !Array.isArray(v3anno.target) && v3anno.target !== null) {
    v2anno.on = {
      '@type': 'oa:SpecificResource',
      full:
        // `target` has a `source` with `id` object pointing to the proper canvas
        v3anno.target.source?.id
        // `target` has an id
        || v3anno.target.id
        // `target` is an object and `target.source` is a string
        || v3anno.target.source
    };
  // if v3anno.target is a string, don't process it
  } else {
    v2anno.on = v3anno.target;
  }
  if (v3anno.target.selector) {
    if (Array.isArray(v3anno.target.selector)) {
      const selectors = v3anno.target.selector.map((s) => createV2AnnoSelector(s));
      // create choice, assuming two elements and 0 is default
      v2anno.on.selector = {
        '@type': 'oa:Choice',
        default: selectors[0],
        item: selectors[1],
      };
    } else {
      v2anno.on.selector = createV2AnnoSelector(v3anno.target.selector);
    }
    if (v3anno.target.source?.partOf) {
      v2anno.on.within = {
        '@id': v3anno.target.source.partOf.id,
        '@type': 'sc:Manifest',
      };
    }
  }
  return v2anno;
}

/**
 * create a V3 body from a V2 body
 * @param {object} v2body
 * @returns {object}
 */
function createV3AnnoBody(v2body) {
  const v3body = {
    type: 'TextualBody',
    value: v2body.chars,
  };
  if (v2body.motivation) {
    v3body.purpose = v2body.motivation;
  }
  if (v2body.format) {
    v3body.format = v2body.format;
  }
  if (v2body.language) {
    v3body.language = v2body.language;
  }
  if (v2body['@type'] === 'oa:Tag') {
    v3body.purpose = 'tagging';
  }
  return v3body;
}

/**
 * Create a V3 selector from a V2 selector
 * @param {object} v2selector
 * @returns {object}
 */
function createV3AnnoSelector(v2selector) {
  switch (v2selector['@type']) {
    case 'oa:SvgSelector':
      return {
        type: 'SvgSelector',
        value: v2selector.value,
      };
    case 'oa:FragmentSelector':
      return {
        type: 'FragmentSelector',
        value: v2selector.value,
      };
    case 'oa:Choice':
      /* create alternate selectors */
      return [
        createV3AnnoSelector(v2selector.default),
        createV3AnnoSelector(v2selector.item),
      ];
    default:
      return null;
  }
}

/**
 * Creates a V3 annotation from a V2 annotation
 * @param {object} v2anno
 * @returns {object}
 */
function createV3Anno(v2anno) {
  const v3anno = {
    id: v2anno['@id'],
    maeData: v2anno.maeData || {},
    motivation: 'commenting',
    type: 'Annotation',
  };
  if (Array.isArray(v2anno.resource)) {
    v3anno.body = v2anno.resource.map((b) => createV3AnnoBody(b));
  } else if (v2anno.resource) {
    // it's an object
    v3anno.body = createV3AnnoBody(v2anno.resource);
  } else {
    // no body is defined
    v3anno.body = {};
  }
  let v2target = v2anno.on;
  if (Array.isArray(v2target)) {
    [v2target] = v2target;
  }
  v3anno.target = {
    selector: createV3AnnoSelector(v2target.selector),
    source: v2target.full,
  };
  if (v2target.within) {
    v3anno.target.source = {
      id: v2target.full,
      partOf: {
        id: v2target.within['@id'],
        type: 'Manifest',
      },
      type: 'Canvas',
    };
  }
  return v3anno;
}

/**
 * from an array of IIIF V2 annotations, create a V3 annotationPage
 * @param {object[]} v2annos - array of IIIF V2 annotations
 * @param {string} annotationPageId - '@id' of the annotationPage
 * @returns {object}
 */
export function createAnnotationPage(v2annos, annotationPageId) {
  if (Array.isArray(v2annos)) {
    const v3annos = v2annos.map((a) => createV3Anno(a));
    return {
      id: annotationPageId,
      items: v3annos,
      type: 'AnnotationPage',
    };
  }
  return v2annos;
}
