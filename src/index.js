import miradorAnnotationPlugin from './plugins/miradorAnnotationPlugin';
import externalStorageAnnotationPlugin from './plugins/externalStorageAnnotationPlugin';
import canvasAnnotationsPlugin from './plugins/canvasAnnotationsPlugin';
import annotationCreationCompanionWindowPlugin from './plugins/annotationCreationCompanionWindow';
import windowSideBarButtonsPlugin from './plugins/windowSideBarButtonsPlugin';
import annotationSagaPlugin from './plugins/annotationSaga';
import aiiinotateAdapter from './annotationAdapter/AiiinotateAdapter';

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
  aiiinotateAdapter,
];

export default annotationPlugins;
