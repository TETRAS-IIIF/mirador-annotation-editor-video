import miradorAnnotationPlugin from './plugins/miradorAnnotationPlugin';
import externalStorageAnnotationPlugin from './plugins/externalStorageAnnotationPlugin';
import canvasAnnotationsPlugin from './plugins/canvasAnnotationsPlugin';
import annotationCreationCompanionWindowPlugin from './plugins/annotationCreationCompanionWindow';
import windowSideBarButtonsPlugin from './plugins/windowSideBarButtonsPlugin';
import annotationSagaPlugin from './plugins/annotationSaga';
import AiiinotateAdapter from './annotationAdapter/AiiinotateAdapter';
import LocalStorageAdapter from './annotationAdapter/LocalStorageAdapter';

export {
  miradorAnnotationPlugin, externalStorageAnnotationPlugin,
  canvasAnnotationsPlugin, annotationCreationCompanionWindowPlugin,
  windowSideBarButtonsPlugin,
};

// TODO atttention M4 merge

const annotationPlugins = [
  miradorAnnotationPlugin,
  externalStorageAnnotationPlugin,
  canvasAnnotationsPlugin,
  annotationCreationCompanionWindowPlugin,
  windowSideBarButtonsPlugin,
  annotationSagaPlugin,
  {
    "AiiinotateAdapter": AiiinotateAdapter,
    "LocalStorageAdapter": LocalStorageAdapter
  }
];

export default annotationPlugins;
