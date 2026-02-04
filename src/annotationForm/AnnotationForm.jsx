import React, { useEffect, useReducer, useState } from 'react';
import { ConnectedCompanionWindow } from 'mirador';
import PropTypes from 'prop-types';
import { Grid } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { isEmptyValue, convertAnnotationStateToBeSaved } from '../IIIFUtils';
import AnnotationFormTemplateSelector from './AnnotationFormTemplateSelector';
import { getTemplateType, saveAnnotationInStorageAdapter, TEMPLATE } from './AnnotationFormUtils';
import AnnotationFormHeader from './AnnotationFormHeader';
import AnnotationFormBody from './AnnotationFormBody';
import '../custom.css';
import UnsupportedMedia from './UnsupportedMedia';

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

  // TDOO perhaps useless
  const [retryCount, setRetryCount] = useState(0);

  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  /**
   * Generates the default body value for empty annotations
   * @returns {string} HTML string with translated "No content" message and current timestamp
   */
  const getDefaultBodyValue = () => `<p><em>${t('no_content')}, ${new Date().toLocaleString()}</em></p>`;

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

  useEffect(() => {
    setTemplateType(null);
    setMediaType(playerReferences.getMediaType());
    // eslint-disable-next-line react/prop-types
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
      <UnsupportedMedia id={id} mediaType={mediaType} windowId={windowId} />
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
   * @param {Object} annotationState - The annotation state to save
   * @returns {Promise} Promise that resolves when all annotations are saved
   */
  const saveAnnotation = (annotationState) => {
    const annotationProps = annotationState;
    const defaultBodyValue = getDefaultBodyValue();

    if (annotationProps.body && annotationProps.body.length > 0) {
      if (isEmptyValue(annotationProps.body[0].value)) {
        annotationProps.body[0].value = defaultBodyValue;
      }
    } else {
      annotationProps.body = [{
        purpose: 'describing',
        type: 'TextualBody',
        value: defaultBodyValue,
      }];
    }
    if (annotationProps.maeData?.textBody) {
      if (isEmptyValue(annotationProps.maeData.textBody.value)) {
        annotationProps.maeData.textBody.value = defaultBodyValue;
      }
    }

    const promises = playerReferences.getCanvases()
      .map(async (canvas) => {
        let annotationStateToBeSaved;
        if (annotationProps?.maeData && annotationProps.maeData.templateType) {
          annotationStateToBeSaved = await convertAnnotationStateToBeSaved(
            annotationProps,
            canvas,
            windowId,
            playerReferences,
          );
        } else {
          annotationStateToBeSaved = annotationProps;
        }
        const storageAdapter = config.annotation.adapter(canvas.id);
        return saveAnnotationInStorageAdapter(
          canvas.id,
          storageAdapter,
          receiveAnnotation,
          annotationStateToBeSaved,
        );
      });

    return Promise.all(promises)
      .then(() => {
        closeFormCompanionWindow();
      });
  };
  return (
    <ConnectedCompanionWindow
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
            <Grid container>
              <AnnotationFormHeader
                setCommentingType={setTemplateType}
                templateType={templateType}
                annotation={annotation}
              />
            </Grid>
            <Grid>
              <AnnotationFormBody
                annotation={annotation}
                canvases={canvases}
                closeFormCompanionWindow={closeFormCompanionWindow}
                playerReferences={playerReferences}
                saveAnnotation={saveAnnotation}
                templateType={templateType}
                windowId={windowId}
              />
            </Grid>
          </Grid>
        )}
    </ConnectedCompanionWindow>
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
      debug: PropTypes.bool,
      defaults: PropTypes.objectOf(
        PropTypes.oneOfType([PropTypes.bool, PropTypes.func, PropTypes.number, PropTypes.string]),
      ),
    }),
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

export default AnnotationForm;
