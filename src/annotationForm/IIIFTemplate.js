import React, { useState } from 'react';
import { JsonEditor as Editor } from 'jsoneditor-react18';
import PropTypes from 'prop-types';
import 'jsoneditor-react18/es/editor.min.css';
import ace from 'brace';
import 'brace/mode/json';
import 'brace/theme/github';
import { Paper } from '@mui/material';
import AnnotationFormFooter from './AnnotationFormFooter';
import { TEMPLATE } from './AnnotationFormUtils';

/**
 * IIIFTemplate component
 * @param annotation
 * @param saveAnnotation
 * @param closeFormCompanionWindow
 * @param canvases
 * @returns {JSX.Element}
 */
export default function IIIFTemplate({
  annotation,
  saveAnnotation,
  closeFormCompanionWindow,
  canvases,
  t,
}) {
  let maeAnnotation = annotation;
  if (!annotation.id) {
    // If the annotation does not have maeData, the annotation was not created with mae
    maeAnnotation = {
      body: {
        id: '',
        type: '',
        value: 'Your annotation',
      },
      id: null,
      maeData: {
        templateType: TEMPLATE.IIIF_TYPE,
      },
      motivation: 'commenting',
      target: '',
    };
  }

  const [annotationState, setAnnotationState] = useState(maeAnnotation);

  /**
   * Save function for the annotation
   * @returns {Object}
   */
  const saveFunction = () => {
    // We return annotation to save it
    canvases.forEach(async (canvas) => {
      // Adapt target to the canvas
      // eslint-disable-next-line no-param-reassign
      // annotation.target = `${canvas.id}#xywh=${target.xywh}&t=${target.t}`;
      saveAnnotation(annotationState, canvas.id);
    });
    closeFormCompanionWindow();
  };

  return (
    <>
      <Paper
        elevation={0}
        style={{ minHeight: '300px' }}
      >
        <Editor
          value={annotationState}
          ace={ace}
          theme="ace/theme/github"
          onChange={setAnnotationState}
        />
      </Paper>
      <AnnotationFormFooter
        closeFormCompanionWindow={closeFormCompanionWindow}
        saveAnnotation={saveFunction}
        t={t}
      />
    </>
  );
}

IIIFTemplate.propTypes = {
  annotation: PropTypes.shape({
    body: PropTypes.shape({
      format: PropTypes.string,
      id: PropTypes.string,
      type: PropTypes.string,
      value: PropTypes.string,
    }),
    drawingState: PropTypes.string,
    id: PropTypes.string,
    // eslint-disable-next-line react/forbid-prop-types
    maeData: PropTypes.object,
    manifestNetwork: PropTypes.string,
    motivation: PropTypes.string,
    target: PropTypes.string,
  }).isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  canvases: PropTypes.arrayOf(PropTypes.object).isRequired,
  closeFormCompanionWindow: PropTypes.func.isRequired,
  saveAnnotation: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};
