import React, { useState } from 'react';
import { Grid } from '@mui/material';
import PropTypes from 'prop-types';
import AnnotationFormFooter from './AnnotationFormFooter';
import { TEMPLATE } from './AnnotationFormUtils';
import TargetFormSection from './TargetFormSection';
import { resizeKonvaStage } from './AnnotationFormOverlay/KonvaDrawing/KonvaUtils';
import { MultiTagsInput } from './MultiTagsInput';
import { TextCommentInput } from './TextCommentInput';

/** Tagging Template* */
export default function MultipleBodyTemplate(
  {
    annotation,
    closeFormCompanionWindow,
    playerReferences,
    saveAnnotation,
    t,
    windowId,
    tagsSuggestions,
    commentTemplate,
  },
) {
  let maeAnnotation = annotation;

  if (!maeAnnotation.id) {
    // If the annotation does not have maeData, the annotation was not created with mae
    maeAnnotation = {
      body: [],
      maeData: {
        tags: [],
        target: null,
        templateType: TEMPLATE.MULTIPLE_BODY_TYPE,
        textBody: {
          purpose: 'describing',
          type: 'TextualBody',
          value: '',
        },
      },
      motivation: 'commenting',
      target: null,
    };
  } else {
    if (maeAnnotation.maeData.target.drawingState && typeof maeAnnotation.maeData.target.drawingState === 'string') {
      maeAnnotation.maeData.target.drawingState = JSON.parse(
        maeAnnotation.maeData.target.drawingState,
      );
    }
    // We support only one textual body
    maeAnnotation.maeData.textBody = maeAnnotation.body.find((body) => body.purpose === 'describing');
    maeAnnotation.maeData.tags = maeAnnotation.body.filter((body) => body.purpose === 'tagging')
      .map((tag) => ({
        id: tag.id,
        text: tag.value,
      }));
  }

  const [annotationState, setAnnotationState] = useState(maeAnnotation);

  /**
   * Update the annotation's Body
   * */
  const updateAnnotationTextualBodyValue = (newTextValue) => {
    setAnnotationState({
      ...annotationState,
      maeData: {
        ...annotationState.maeData,
        textBody: {
          ...annotationState.maeData.textBody,
          value: newTextValue,
        },
      },
    });
  };

  /** Update annotation with Tag Value * */
  const setTags = (newTags) => {
    setAnnotationState({
      ...annotationState,
      maeData: {
        ...annotationState.maeData,
        tags: newTags,
      },
    });
  };

  /** Update Target State * */
  const updateTargetState = (target) => {
    const newMaeData = annotationState.maeData;
    newMaeData.target = target;
    setAnnotationState({
      ...annotationState,
      maeData: newMaeData,
    });
  };

  /** Save function * */
  const saveFunction = async () => {
    resizeKonvaStage(
      windowId,
      playerReferences.getMediaTrueWidth(),
      playerReferences.getMediaTrueHeight(),
      1 / playerReferences.getScale(),
    );
    saveAnnotation(annotationState);
  };

  return (
    <Grid container direction="column" spacing={2}>
      <Grid item>
        <TextCommentInput
          commentTemplates={commentTemplate}
          comment={annotationState.maeData.textBody.value}
          setComment={updateAnnotationTextualBodyValue}
          t={t}
        />
      </Grid>
      <Grid item>
        <MultiTagsInput
          t={t}
          tags={annotationState.maeData.tags}
          setTags={setTags}
          tagsSuggestions={tagsSuggestions}
        />
      </Grid>
      <Grid item>
        <TargetFormSection
          onChangeTarget={updateTargetState}
          playerReferences={playerReferences}
          spatialTarget
          t={t}
          target={annotationState.maeData.target}
          timeTarget
          windowId={windowId}
        />
      </Grid>
      <Grid item>
        <AnnotationFormFooter
          closeFormCompanionWindow={closeFormCompanionWindow}
          saveAnnotation={saveFunction}
          t={t}
          annotationState={annotationState}
        />
      </Grid>
    </Grid>
  );
}

MultipleBodyTemplate.propTypes = {
  annotation: PropTypes.shape({
    adapter: PropTypes.func,
    body: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.string,
      }),
    ),
    defaults: PropTypes.objectOf(
      PropTypes.oneOfType(
        [PropTypes.bool, PropTypes.func, PropTypes.number, PropTypes.string],
      ),
    ),
    drawingState: PropTypes.string,
    manifestNetwork: PropTypes.string,
    target: PropTypes.string,
  }).isRequired,
  commentTemplate: PropTypes.string.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  closeFormCompanionWindow: PropTypes.func.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  playerReferences: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  saveAnnotation: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  tagsSuggestions: PropTypes.arrayOf(PropTypes.string).isRequired,
  windowId: PropTypes.string.isRequired,
};
