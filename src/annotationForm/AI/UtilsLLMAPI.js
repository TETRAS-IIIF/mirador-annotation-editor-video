import { receiveAnnotation } from 'mirador';
import { saveAnnotationInStorageAdapter, TEMPLATE } from '../AnnotationFormUtils';

const IA_TAGGING_BODY = {
  motivation: 'tagging',
  purpose: 'tagging',
  value: 'IA Generated',
};

const IA_MAE_DATA = {
  templateType: TEMPLATE.IIIF_TYPE,
};

/**
 * Save AI-generated annotations to the storage adapter and dispatch them
 * to the Redux store so the UI refreshes.
 *
 * @param annotationPages
 * @param canvasId
 * @param storageAdapter
 * @param dispatch
 * @returns {Promise<void>}
 */
function saveIAAnnotation(annotationPages, canvasId, storageAdapter, dispatch) {
  const allAnnotations = annotationPages.flatMap((annoPage) => annoPage.items || []);
  const dispatchReceiveAnnotation = (targetId, annoId, annotation) => dispatch(
    receiveAnnotation(targetId, annoId, annotation),
  );
  return allAnnotations.reduce(
    (chain, anno) => chain.then(() => {
      const annoToSave = {
        ...anno,
        body: Array.isArray(anno.body)
          ? [...anno.body, IA_TAGGING_BODY]
          : [anno.body, IA_TAGGING_BODY],
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
    const newAnnos = updatedManifest.items[canvas.index]?.annotations || [];

    await saveIAAnnotation(newAnnos, canvas.id, storageAdapter(canvas.id), dispatch);
    successCallBack();
  } catch (err) {
    console.error('Translation error', err);
    errorCallBack(err);
  }
}
