import {
  createV2Anno,
  createV2AnnoBody,
  createV2AnnoSelector,
  createV3Anno,
  createV3AnnoBody,
  createV3AnnoSelector,
  createAnnotationPage,
} from './utils';

/**
 * @typedef WebAnnotationBodyContent
 * @type {object}
 * @property {"TextualBody"} type
 * @property {string} value - HTML string
 */

/**
 * @typedef {[]} WebAnnotationBodyEmpty - always empty array when there are no annotations
 */

/**
 * @typedef WebAnnotationBody
 * @type {WebAnnotationBodyEmpty|WebAnnotationBodyContent}
 */

/**
 * @typedef {string} WebAnnotationTargetString - URI to the canvas
 */

/**
 * @typedef WebAnnotationTargetSelectorObject
 * @type {object}
 * @property {string} type - "FragmentSelector", "SvgSelector"...
 * @property {string} value - the selector: "xywh=758,58,778,824", "<svg>...</svg>"
 */

/**
 * @typedef {WebAnnotationTargetSelectorObject[]} WebAnnotationTargetSelectorArray
 *  - 1st element is just a FragmentSelector (bounding box of annotation),
 *  - second element is more sophisticated (SVG selector with CSS)
 */

/**
 * @typedef WebAnnotationTargetPartOf
 * @type {object}
 * @property {string} id - URI of the manifest
 * @property {"Manifest"} type
 */

/**
 * @typedef WebAnnotationTargetSource
 * @type {object}
 * @property {string} id - ID of the canvas
 * @property {WebAnnotationTargetPartOf} partOf
 */

/**
 * @typedef WebAnnotationTargetObject
 * @type {object}
 * @property {WebAnnotationTargetSelectorArray} selector
 * @property {WebAnnotationTargetSource} source
 */

/**
 * @typedef WebAnnotationTarget
 * @type {WebAnnotationTargetString|WebAnnotationTargetObject}
 */

/**
 * @typedef WebAnnotation - Mirador 3 uses Web Annotatins, compatible directly with IIIF 3.x
 * @type object
 * @property {string} id - uuid of the annotation
 * @property {"Annotation"} type
 * @property {WebAnnotationTarget} target - either canvas URI or array of selectors.
 * @property {string} motivation - "commenting"
 * @property {WebAnnotationBody} body
 */

/** @typedef {AiiinotateAdapter} AiiinotateAdapterType */

/**
 * @class
 * @type {AiiinotateAdapterType}
 */
export default class AiiinotateAdapter {
  /**
   * @type {string} canvasId
   * @type {endpointUrl} string
   * @type {2 | 3} iiifPresentationVersion
   */
  constructor(canvasId, endpointUrl, iiifPresentationVersion) {
    if (![2, 3].includes(iiifPresentationVersion)) {
      throw new Error(`AiiinotateAdapter: unrecognized value for 'iiifPresentationVersion'. expected one of [2,3], got '${iiifPresentationVersion}'`);
    }
    this.canvasId = canvasId;
    this.iiifPresentationVersion = iiifPresentationVersion;
    this.endpointUrl = endpointUrl;
    this.endpointUrlAnnotations = `${this.endpointUrl}/annotations/${iiifPresentationVersion}`;
    this.endpointUrlManifests = `${this.endpointUrl}/manifests/${iiifPresentationVersion}`;
  }

  /**
   * NOTE: if `this.iiifPresentationVersion===2`, an URI to an annotationList will be returned.
   * @returns {string} the ID of the current annotationPage
   */
  get annotationPageId() {
    const uriBase = `${this.endpointUrlAnnotations}/search?uri=${this.canvasId}`;
    return this.iiifPresentationVersion === 2
      ? `${uriBase}&asAnnotationList=true`
      : uriBase;
  }

  /**
   * @param {WebAnnotation} annotation
   */
  async create(annotation) {
    return fetch(`${this.endpointUrlAnnotations}/create`, {
      method: 'POST',
      body: JSON.stringify(createV2Anno(annotation)),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
    .then(async (r) => this.all())
    .catch((err) => {
      console.error('Aiiinotate.create error', err);
      return this.all()
    });
  }

  /**
   * @param {WebAnnotation} annotation
   */
  async update(annotation) {
    return fetch(`${this.endpointUrlAnnotations}/update`, {
      method: "POST",
      body: JSON.stringify(createV2Anno(annotation)),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
    .then(async (r) => this.all())
    .catch((err) => {
      console.error('Aiiinotate.create error', err);
      return this.all()
    });
  }

  /** @param {string} annotationId */
  async delete(annotationId) {
    return fetch(`${this.endpointUrlAnnotations}/delete?uri=${annotationId}`, {
      method: "DELETE",
    })
    .then(async (r) => this.all())
    .catch((err) => {
      console.error("Aiiinotate.delete error", err);
      return this.all();
    });
  }

  /**
   * get a single annotation
   */
  async get(annotationId) {
    return await fetch(annotationId);
  }

  /** @returns {object} an annotationPage (IIIF 3) with all annotations for the current canvas */
  async all() {
    const r = await fetch(this.annotationPageId);
    const annotations = await r.json();
    if (this.iiifPresentationVersion === 2) {
      return createAnnotationPage(annotations.resources, this.annotationPageId);
    }
  }
}
