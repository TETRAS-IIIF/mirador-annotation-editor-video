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
 *
 * @param annotationPages
 * @param canvasId
 * @param dispatch
 * @param storageAdapter
 */
function saveIAAnnotation(annotationPages, canvasId, dispatch, storageAdapter) {
  const promises = annotationPages.map(function (annoPage) {
    annoPage.items.map((anno) => {
      const annoToSaved = {
        ...anno,
        id: null,
        body: Array.isArray(anno.body) ? [...anno.body, IA_TAGGING_BODY] : [anno.body, IA_TAGGING_BODY],
        maeData: IA_MAE_DATA,
      };
      console.log('annos to save', annoToSaved);
      return saveAnnotationInStorageAdapter(canvasId, storageAdapter, receiveAnnotation, annoToSaved);
    });
  });

  Promise.all(promises).then(() => {
    console.log('Storage done');
  });
}

/**
 *
 * @param manifestUrl
 * @param canvas
 * @param endpoint
 * @param storageAdapter
 * @param successCallBack
 * @param errorCallBack
 * @param dispatch
 * @returns {Promise<void>}
 */
export const translate = async function (
  manifestUrl,
  canvas,
  endpoint,
  storageAdapter,
  successCallBack,
  errorCallBack,
  dispatch,
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

    saveIAAnnotation(newAnnos, canvas.id, dispatch, storageAdapter(canvas.id));
  } catch (err) {
    console.error('Translation error', err);
    errorCallBack(err);
  } finally {
    successCallBack();
  }
};
