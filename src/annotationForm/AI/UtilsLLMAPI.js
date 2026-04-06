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
 * @param annos
 * @param canvasId
 * @param dispatch
 * @param storageAdapter
 */
function saveIAAnnotation(annos, canvasId, dispatch, storageAdapter) {
  const taggedAnnos = annos.map((annoPage) => ({
    ...annoPage,
    creationDate: new Date().toISOString(),
    creator: 'AI Assistant',
    items: annoPage.items.map((anno) => ({
      ...anno,
      body: Array.isArray(anno.body) ? [...anno.body, IA_TAGGING_BODY] : [anno.body, IA_TAGGING_BODY],
      id: null,
      maeData: IA_MAE_DATA,
    })),
  }));

  console.log(taggedAnnos);

  const promises = taggedAnnos.map(
    (annoPage) =>
      saveAnnotationInStorageAdapter(canvasId, storageAdapter, receiveAnnotation, annoPage)
  );

  Promise.all(promises)
    .then(() => {
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

    saveIAAnnotation(newAnnos, canvas.id, dispatch, storageAdapter);
  } catch (err) {
    console.error('Translation error', err);
    errorCallBack(err);
  } finally {
    successCallBack();
  }
};
