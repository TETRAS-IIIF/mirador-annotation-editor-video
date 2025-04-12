import React, { useEffect, useReducer, useState } from 'react';
import CompanionWindow from 'mirador/dist/es/src/containers/CompanionWindow';
import PropTypes from 'prop-types';
import { Grid } from '@mui/material';
import Typography from '@mui/material/Typography';
import { useTranslation, withTranslation } from 'react-i18next';
import i18n from 'i18next';
import AnnotationFormTemplateSelector from './AnnotationFormTemplateSelector';
import { getTemplateType, saveAnnotationInStorageAdapter, TEMPLATE } from './AnnotationFormUtils';
import AnnotationFormHeader from './AnnotationFormHeader';
import AnnotationFormBody from './AnnotationFormBody';
import { convertAnnotationStateToBeSaved } from '../IIIFUtils';
import '../118n';
import '../custom.css';

/**
 * Component for submitting a form to create or edit an annotation.
 * */
function AnnotationForm(
  {
    annotation,
    canvases,
    closeCompanionWindow,
    config,
    id,
    playerReferences,
    receiveAnnotation,
    windowId,
  },
) {
  const { t } = useTranslation();
  const [templateType, setTemplateType] = useState(null);
  // eslint-disable-next-line no-underscore-dangle
  const [mediaType, setMediaType] = useState(playerReferences.getMediaType());

  const [retryCount, setRetryCount] = useState(0);

  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  if (!playerReferences.isInitializedCorrectly() && retryCount < 10) {
    console.log('AnnotationForm.js: retryCount', retryCount);
    setTimeout(() => {
      setRetryCount(retryCount + 1);
      forceUpdate();
    }, 100);
  }

  // Add a state to trigger redraw
  const [windowSize, setWindowSize] = useState({
    height: window.innerHeight,
    width: window.innerWidth,
  });

  const debugMode = config.debug === true;

  if (!templateType) {
    if (annotation.id) {
      if (annotation.maeData && annotation.maeData.templateType) {
        // Annotation has been created with MAE
        setTemplateType(getTemplateType(t, annotation.maeData.templateType));
      } else {
        // Annotation has been created with other IIIF annotation editor
        setTemplateType(getTemplateType(t, TEMPLATE.IIIF_TYPE));
      }
    }
  }

  // Add translations from config to i18n
  useEffect(() => {
    if (i18n.isInitialized && config.translations) {
      Object.keys(config.translations)
        .forEach((language) => {
          i18n.addResourceBundle(
            language,
            'translation',
            config.translations[language],
            true,
            true,
          );
        });

      if (config.language) {
        i18n.changeLanguage(config.language);
      }
    }
  }, [config.translations, config.language]);

  useEffect(() => {
    setTemplateType(null);
    setMediaType(playerReferences.getMediaType());
  }, [canvases[0].index]);

  // Listen to window resize event
  useEffect(() => {
    /**
     * Updates the state with the current window size when the window is resized.
     * @function handleResize
     * @returns {void}
     */
    const handleResize = () => {
      setWindowSize({
        height: window.innerHeight,
        width: window.innerWidth,
      });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  if (!playerReferences.isInitCorrectly) {
    playerReferences.isInitializedCorrectly();
  }
  if (!playerReferences.isInitCorrectly) {
    return (
      <CompanionWindow title={t('media_not_supported')} windowId={windowId} id={id}>
        <Grid container padding={1} spacing={1}>
          <Grid item>
            <Typography>{t('media_not_supported')}</Typography>
          </Grid>
          <Grid item>
            <Typography>
              {t('detected_media_type', { mediaType })}
            </Typography>
          </Grid>
        </Grid>
      </CompanionWindow>
    );
  }

  /**
   * Closes the companion window with the specified ID and position.
   *
   * @returns {void}
   */
  const closeFormCompanionWindow = () => {
    closeCompanionWindow('annotationCreation', {
      id,
      position: 'right',
    });
  };

  /**
   * Save the annotation
   * @param annotationState
   */
  const saveAnnotation = (annotationState) => {
    const promises = playerReferences.getCanvases()
      .map(async (canvas) => {
        let annotationStateToBeSaved;
        if (annotationState?.maeData && annotationState.maeData.templateType) {
          annotationStateToBeSaved = await convertAnnotationStateToBeSaved(
            annotationState,
            canvas,
            windowId,
            playerReferences,
          );
        } else {
          annotationStateToBeSaved = annotationState;
        }
        const storageAdapter = config.annotation.adapter(canvas.id);
        return saveAnnotationInStorageAdapter(
          canvas.id,
          storageAdapter,
          receiveAnnotation,
          annotationStateToBeSaved,
        );
      });

    Promise.all(promises)
      .then(() => {
        closeFormCompanionWindow();
      });
  };

  return (
    <CompanionWindow
      title={annotation.id ? t('edit_annotation') : t('new_annotation')}
      windowId={windowId}
      id={id}
    >
      {templateType === null
        ? (
          <AnnotationFormTemplateSelector
            setCommentingType={setTemplateType}
            mediaType={mediaType}
          />
        )
        : (
          <Grid container direction="column" spacing={1}>
            <Grid item container>
              <AnnotationFormHeader
                setCommentingType={setTemplateType}
                templateType={templateType}
                annotation={annotation}
              />
            </Grid>
            <Grid item>
              <AnnotationFormBody
                annotation={annotation}
                canvases={canvases}
                closeFormCompanionWindow={closeFormCompanionWindow}
                debugMode={debugMode}
                playerReferences={playerReferences}
                saveAnnotation={saveAnnotation}
                templateType={templateType}
                windowId={windowId}
                config={config}
              />
            </Grid>
          </Grid>
        )}
    </CompanionWindow>
  );
}

AnnotationForm.propTypes = {
  annotation: PropTypes.oneOfType([
    PropTypes.shape({
      body: PropTypes.shape({
        format: PropTypes.string,
        id: PropTypes.string,
        type: PropTypes.string,
        value: PropTypes.string,
      }),
      drawingState: PropTypes.string,
      id: PropTypes.string,
      manifestNetwork: PropTypes.string,
      motivation: PropTypes.string,
      target: PropTypes.string,
    }),
    PropTypes.string,
  ]).isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  canvases: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.string }),
  ).isRequired,
  closeCompanionWindow: PropTypes.func.isRequired,
  config: PropTypes.shape({
    annotation: PropTypes.shape({
      adapter: PropTypes.func,
      defaults: PropTypes.objectOf(
        PropTypes.oneOfType([PropTypes.bool, PropTypes.func, PropTypes.number, PropTypes.string]),
      ),
    }),
    debug: PropTypes.bool,
    language: PropTypes.string,
    // eslint-disable-next-line react/forbid-prop-types
    translations: PropTypes.objectOf(PropTypes.object),
  }).isRequired,
  id: PropTypes.string.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  playerReferences: PropTypes.object.isRequired,
  receiveAnnotation: PropTypes.func.isRequired,
  windowId: PropTypes.string.isRequired,
};

export default withTranslation()(AnnotationForm);
