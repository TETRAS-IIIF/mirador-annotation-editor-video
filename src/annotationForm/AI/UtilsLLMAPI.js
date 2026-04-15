import { receiveAnnotation } from 'mirador';
import { saveAnnotationInStorageAdapter, TEMPLATE } from '../AnnotationFormUtils';

const IA_TAGGING_BODY = {
  motivation: 'tagging',
  purpose: 'tagging',
  value: 'IA Generated',
};

const IA_TRANSCRIPTION_BODY = {
  motivation: 'tagging',
  purpose: 'tagging',
  value: 'IA Transcribed',
};

const IA_MAE_DATA = {
  templateType: TEMPLATE.IIIF_TYPE,
};

/**
 * Generic function to save AI-generated annotations to the storage adapter
 * and dispatch them to the Redux store.
 *
 * @param annotationPages
 * @param canvasId
 * @param storageAdapter
 * @param dispatch
 * @param taggingBody - the specific IA tagging body to append
 * @returns {Promise<void>}
 */
function saveIAAnnotations(annotationPages, canvasId, storageAdapter, dispatch, taggingBody) {
  const allAnnotations = annotationPages.flatMap((annoPage) => annoPage.items || []);
  const dispatchReceiveAnnotation = (targetId, annoId, annotation) => dispatch(
    receiveAnnotation(targetId, annoId, annotation),
  );
  return allAnnotations.reduce(
    (chain, anno) => chain.then(() => {
      const annoToSave = {
        ...anno,
        body: Array.isArray(anno.body)
          ? [...anno.body, taggingBody]
          : [anno.body, taggingBody],
        id: null,
        maeData: IA_MAE_DATA,
      };

      console.log("annoToSave",annoToSave)
      return saveAnnotationInStorageAdapter(
        canvasId,
        storageAdapter,
        dispatchReceiveAnnotation,
        annoToSave,
      );
    }),
    Promise.resolve(),
  );
}

/**
 * Transcribe a canvas using the AI endpoint and save the resulting annotations.
 *
 * @param manifestUrl
 * @param canvas
 * @param endpoint
 * @param storageAdapter
 * @param dispatch
 * @param successCallBack
 * @param errorCallBack
 * @returns {Promise<void>}
 */
export async function transcribe(
  manifestUrl,
  canvas,
  endpoint,
  storageAdapter,
  dispatch,
  successCallBack,
  errorCallBack,
) {
  try {
    const response = await fetch(`${endpoint}iiif/transcribe`, {
      body: JSON.stringify({
        canvas_index: canvas.index,
        manifest_url: manifestUrl,
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });

    const updatedManifest = await response.json();
    const newAnnos = updatedManifest.items?.[canvas.index]?.annotations || [];

    // eslint-disable-next-line max-len
    await saveIAAnnotations(newAnnos, canvas.id, storageAdapter(canvas.id), dispatch, IA_TRANSCRIPTION_BODY);
    successCallBack();
  } catch (err) {
    console.error('Transcription error', err);
    errorCallBack(err);
  }
}

const IA_ANNOTATION_BODY = {
  motivation: 'tagging',
  purpose: 'tagging',
  value: 'IA Annotated',
};

/**
 * Annotate a canvas using the AI endpoint and save the resulting annotations.
 *
 * @param manifestUrl
 * @param canvas
 * @param endpoint
 * @param storageAdapter
 * @param dispatch
 * @param successCallBack
 * @param errorCallBack
 * @returns {Promise<void>}
 */
export async function annotate(
  manifestUrl,
  canvas,
  endpoint,
  storageAdapter,
  dispatch,
  successCallBack,
  errorCallBack,
) {
  try {
    const response = await fetch(`${endpoint}iiif/annotate-manifest`, {
      body: JSON.stringify({
        canvas_index: canvas.index,
        manifest_url: manifestUrl,
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });

    const updatedManifest = await response.json();
    const newAnnos = updatedManifest.items?.[canvas.index]?.annotations || [];

    // eslint-disable-next-line max-len
    await saveIAAnnotations(newAnnos, canvas.id, storageAdapter(canvas.id), dispatch, IA_ANNOTATION_BODY);
    successCallBack();
  } catch (err) {
    console.error('Annotation error', err);
    errorCallBack(err);
  }
}

/**
 * Perform an AI action (describe, transcribe, translate) on a targeted region
 * and save the resulting annotation.
 *
 * @param {string} manifestUrl - URL of the IIIF manifest
 * @param {object} canvas - The current canvas object
 * @param {object} targetData - The drawn shape coordinates
 * @param {string} action - The action to perform: 'describe', 'transcribe', or 'translate'
 * @param {string} endpoint - The backend API endpoint base URL
 * @param {Function|any} storageAdapter - Function to get the storage adapter for the canvas
 * @param {Function|any} dispatch - Redux/State dispatch function
 * @param {Function|any} successCallBack - Called on success
 * @param {Function|any} errorCallBack - Called on error
 * @returns {Promise<void>}
 */
export async function processTargetAction(
  manifestUrl,
  canvas,
  targetData,
  action,
  endpoint,
  storageAdapter,
  dispatch,
  successCallBack,
  errorCallBack,
) {
  try {
    const response = await fetch(`${endpoint}iiif/target-action`, {
      body: JSON.stringify({
        action,
        canvas_index: canvas.index,
        manifest_url: manifestUrl,
        target_data: targetData,
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }

    // The backend returns a single IIIF Web Annotation object for the targeted region
    const newAnnotation = await response.json();

    // Wrap the single annotation inside an AnnotationPage structure
    // to match the format saveIAAnnotations likely expects (array of AnnotationPages)
    const newAnnos = [
      {
        id: `${canvas.id}/page/target-${Date.now()}`,
        items: [newAnnotation],
        type: 'AnnotationPage',
      },
    ];

    // Save to your storage adapter
    await saveIAAnnotations(
      newAnnos,
      canvas.id,
      storageAdapter(canvas.id),
      dispatch,
      `IA ${action.charAt(0).toUpperCase() + action.slice(1)}`,
    );

    successCallBack();
  } catch (err) {
    console.error(`Targeted ${action} error:`, err);
    errorCallBack(err);
  }
}
