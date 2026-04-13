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
 * Translate a canvas using the AI endpoint and save the resulting annotations.
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
export async function translate(
  manifestUrl,
  canvas,
  endpoint,
  storageAdapter,
  dispatch,
  successCallBack,
  errorCallBack,
) {
  try {
    const response = await fetch(`${endpoint}iiif/translate-manifest`, {
      body: JSON.stringify({
        canvas_index: canvas.index,
        manifest_url: manifestUrl,
        target_iso: 'en',
        target_lang: 'English',
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });

    const updatedManifest = await response.json();
    const newAnnos = updatedManifest.items?.[canvas.index]?.annotations || [];

    await saveIAAnnotations(newAnnos, canvas.id, storageAdapter(canvas.id), dispatch, IA_TAGGING_BODY);
    successCallBack();
  } catch (err) {
    console.error('Translation error', err);
    errorCallBack(err);
  }
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

    await saveIAAnnotations(newAnnos, canvas.id, storageAdapter(canvas.id), dispatch, IA_ANNOTATION_BODY);
    successCallBack();
  } catch (err) {
    console.error('Annotation error', err);
    errorCallBack(err);
  }
}
