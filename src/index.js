// import miradorAnnotationPlugin from './plugins/miradorAnnotationPlugin';
import miradorAnnotationPlugin from './containers/miradorAnnotationPlugin';
import externalStorageAnnotationPlugin from './plugins/externalStorageAnnotationPlugin';
import canvasAnnotationsPlugin from './plugins/canvasAnnotationsPlugin';
import annotationCreationCompanionWindowPlugin from './plugins/annotationCreationCompanionWindow';
import windowSideBarButtonsPlugin from './plugins/windowSideBarButtonsPlugin';
import translations from './locales/locales';

export {
  miradorAnnotationPlugin, externalStorageAnnotationPlugin,
  canvasAnnotationsPlugin, annotationCreationCompanionWindowPlugin,
  windowSideBarButtonsPlugin,
};

const annotationPlugins = [
  {
    component: miradorAnnotationPlugin,
    config: {
      translations,
    },
    mode: 'wrap',
    target: 'AnnotationSettings',
  },
  externalStorageAnnotationPlugin,
  canvasAnnotationsPlugin,
  annotationCreationCompanionWindowPlugin,
  windowSideBarButtonsPlugin,
];

export default annotationPlugins;
