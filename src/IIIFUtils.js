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
 * test annotation with oa:Choice selector containing SVG and Fagment to a xywh=200,200,300,300 rectangle.

db.getCollection("annotations2").updateOne(
  { "@id": "http://127.0.0.1:4000/data/2/iiif/annotation/e58b8c60-005c-4c41-a22f-07d49cb25ede_aa7ac44a-dede-49ed-84f6-488214c6dd64" },
  {
    $set: {
      '@context': 'http://iiif.io/api/presentation/2/context.json',
      '@type': 'oa:Annotation',
      maeData: {},
      motivation: [ 'oa:commenting' ],
      '@id': 'http://127.0.0.1:4000/data/2/iiif/annotation/e58b8c60-005c-4c41-a22f-07d49cb25ede_aa7ac44a-dede-49ed-84f6-488214c6dd64',
      resource: [
        {
          chars: '<p>faceeee</p>',
          '@type': 'dctypes:Text',
          motivation: 'describing'
        }
      ],
      on: [
        {
          '@type': 'oa:SpecificResource',
          full: 'https://iiif.bodleian.ox.ac.uk/iiif/canvas/e58b8c60-005c-4c41-a22f-07d49cb25ede.json',
          selector: {
            '@type': 'oa:Choice',
            default: {
              '@type': 'oa:SvgSelector',
              value:
                `<svg
                    version='1.1'
                    xmlns='http://www.w3.org/2000/svg'
                    xmlns:xlink='http://www.w3.org/1999/xlink'
                >
                  <defs/>
                  <g><g>
                    <path
                      d=' M 200 200 L 500 200 L 500 500 L 200 500 L 200 200 Z Z'
                      fill='rgba(100,100,100, 0)'
                      stroke='rgba(255,0, 0, 0.5)'
                      stroke-width='5'
                      fill-opacity='0'
                      stroke-miterlimit='10'
                      stroke-dasharray=''
                    />
                  </g></g>
                </svg>`
            },
            item: {
              '@type': 'oa:FragmentSelector',
              value: 'https://iiif.bodleian.ox.ac.uk/iiif/canvas/e58b8c60-005c-4c41-a22f-07d49cb25ede.json#xywh=200,200,300,300'
            }
          },
          manifestUri: 'https://iiif.bodleian.ox.ac.uk/iiif/canvas/e58b8c60-005c-4c41-a22f-07d49cb25ede.json',
        }
      ]
    }
  }
)
*/

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

/**
 * quick and dirty function to compute bounding box from an SVG Document using a hidden off-screen insertion.
 * @param {XMLDocument} svgDoc - the parsed SVG
 * @returns {{ x: number, y: number, width: number, height: number }} in the SVG's user coordinate system.
 */
const svgToXywh = (svgDoc) => {
  const parsedSvg = svgDoc.documentElement;

  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-99999px";
  container.style.width = "0";
  container.style.height = "0";
  container.style.overflow = "hidden";
  container.style.pointerEvents = "none";
  document.body.appendChild(container);

  const svg = document.importNode(parsedSvg, true);
  // some SVGs don't have explicit width/height/viewBox. We still want user-space coords.
  // wrap everything into a <g> so we can call getBBox on that group.
  const ns = "http://www.w3.org/2000/svg";
  const wrapper = document.createElementNS(ns, "svg");
  for (const attr of svg.attributes || []) {
    wrapper.setAttribute(attr.name, attr.value);
  }
  // move children into a group so getBBox returns combined extents
  const g = document.createElementNS(ns, "g");
  while (svg.firstChild) g.appendChild(svg.firstChild);
  wrapper.appendChild(g);
  container.appendChild(wrapper);

  // force layout/render so getBBox is correct (reading offsetWidth is one way)
  container.offsetWidth;

  let bbox;
  try {
    bbox = g.getBBox(); // SVGRect-like: { x, y, width, height }
  } catch (err) {
    bbox = { x: 0, y: 0, width: 0, height: 0 };
  }

  document.body.removeChild(container);
  return bbox;
}

/**
 * renerate a string-representation of an SVG rectangle based on XYWH coordinates
 * @param {{ x: number, y: number, w: number, fullW: number?, fullH: number? }}
 * @returns {string}
 */
const xywhToSvg = ({ x, y, w, h, fullW=undefined, fullH=undefined }) =>
  `<svg
      version='1.1'
      xmlns='http://www.w3.org/2000/svg'
      xmlns:xlink='http://www.w3.org/1999/xlink'
      ${
        fullW && fullH
        ? "width='"+ fullW + "' height='" + fullH + "'"
        : ""
      }
  >
    <defs/>
    <g><g>
      <path
        d=' M ${x} ${y} L ${x+w} ${y} L ${x+w} ${y+h} L ${x} ${x+h} L ${x} ${y} Z Z'
        fill='${TARGET_TOOL_STATE.fillColor}'
        stroke='${TARGET_TOOL_STATE.strokeColor}'
        stroke-width='${TARGET_TOOL_STATE.strokeWidth}'
        fill-opacity='0'
        stroke-miterlimit='10'
        stroke-dasharray=''
      />
    </g></g>
  </svg>`;


const convertFragmentSelectorToMae = (selector) => {
  const [ x, y, w, h ] = selector.value.replace("xywh=", "").split(",");
  // // TODO these should be dynamic. but they don't seem necessary
  // const [fullW, fullH, scale] = [2087, 2550, 0.8947368421052632];
  const shapeId = uuidv4();
  const currentShape = {
    id: shapeId,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    x: x,
    y: y,
    width: w,
    height: h,
    type: SHAPES_TOOL.RECTANGLE,
    fill: TARGET_TOOL_STATE.fillColor,
    stroke: TARGET_TOOL_STATE.strokeColor,
    strokeWidth: TARGET_TOOL_STATE.strokeWidth
  };

  return {
    drawingState: JSON.stringify({
      currentShape: currentShape,
      shapes: [ currentShape ],
      isDrawing: true,
    }),
    svg: xywhToSvg({
      x,y,w,h,
      // fullW,
      // fullH,
    }),
    // fullCanvaXYWH: `0,0,${fullW},${fullH}`,
    // scale: scale
  }
}

const convertSvgSelectorToMae = (selector) => {
  console.log(">SELECTOR", selector);
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(selector.value, "image/svg+xml");
  const xywh = svgToXywh(svgDoc);
  // console.log(svg.querySelector("g>g").getBoundingClientRect());

}


// NOTE: currently, only 2 types of targets are supported:
// - FragmentSelectors
// - SvgSelectors
// - an array of the 2 above (corresponding to a IIIF Presentation 2 "oa:Choice" selector containing an "oa:FragmentSelector" and "oa:SvgSelector" )
const convertIIIFTargetToMae = (target, annotationId) => {
  const supportedSelectorTypes = ["SvgSelector", "FragmentSelector"];
  const selectorArray = Array.isArray(target.selector) ? target.selector : [target.selector];

  for (const selector of selectorArray ) {
    if ( selector.type === "SvgSelector" ) {
      return convertSvgSelectorToMae(selector);
    } else if ( selector.type === "FragmentSelector" ) {
      return convertFragmentSelectorToMae(selector)
    }
    // if at the end of the loop, no selector could be processed, log an error and return.
    console.error(`On annotation '${annotationId}': none of the selector types in the annotation are unsupported: ${selectorArray.map(selector => selector.type)}. Supported selectors are: [${supportedSelectorTypes}].`)
    return {}
  }
}

export function convertIIIFAnnoToMaeData(anno) {
  try {
    const maeData = {
      target: {},
      templateType: "",  // AnnotationFormUtils.TEMPLATE
      tags: [],  // string[]
      textBody: {}  // expeced keys: purpose, type, value. not used if `templateType === "tagging"`
    };

    // tagging annotation
    if ( anno.motivation === "tagging" || anno.motivation === "oa:tagging" ) {
      maeData.templateType = TEMPLATE.TAGGING_TYPE;
      maeData.tags = [ anno.body.value || anno.bodyValue || "" ]
    // multiple body
    } else {
      maeData.templateType = TEMPLATE.MULTIPLE_BODY_TYPE;
      maeData.textBody = convertIIIFBodyToMae({
        bodyValue: anno.bodyValue || "",
        bodyObj: anno.body || ""
      })
    }

    maeData.target = convertIIIFTargetToMae(anno.target, anno.id);
    console.log("anno.target", anno.target);
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
