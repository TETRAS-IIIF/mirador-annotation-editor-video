import React from 'react';
import PropTypes from 'prop-types';
import { Grid, Typography } from '@mui/material';
import { MEDIA_TYPES, TEMPLATE } from './AnnotationFormUtils';
import TargetTimeInput from './TargetTimeInput';
import { TargetSpatialInput } from './TargetSpatialInput';

/**
 * Section of Time and Space Target
 * @param templateType
 * @param spatialTarget
 * @param windowId
 * @returns {Element}
 * @constructor
 */
export default function TargetFormSection(
  {
    onChangeTarget,
    spatialTarget,
    t,
    playerReferences,
    target,
    timeTarget,
    windowId,
  },
) {
  if (!target) {
    // eslint-disable-next-line no-param-reassign
    target = {};
    if (playerReferences.getMediaType() === MEDIA_TYPES.VIDEO) {
      // eslint-disable-next-line no-param-reassign
      target.tstart = playerReferences.getCurrentTime() || 0;
      // eslint-disable-next-line no-param-reassign
      target.tend = playerReferences.getMediaDuration()
        ? Math.floor(playerReferences.getMediaDuration()) : 0;
    }

    // TODO Check if its possible to use overlay ?
    switch (playerReferences.getMediaType()) {
      case MEDIA_TYPES.IMAGE:
      case MEDIA_TYPES.VIDEO:
        // eslint-disable-next-line no-param-reassign
        target.fullCanvaXYWH = `0,0,${playerReferences.getMediaTrueWidth()},${playerReferences.getMediaTrueHeight()}`;
        break;
      default:
        break;
    }

    if (target.templateType !== TEMPLATE.IMAGE_TYPE
      && target.templateType !== TEMPLATE.KONVA_TYPE) {
      // eslint-disable-next-line no-param-reassign
      target.drawingState = {
        currentShape: null,
        isDrawing: false,
        shapes: [],
      };
    }

    onChangeTarget(target);
  }

  /** Handle timeTargetInput  and spatialTargetInput* */
  const onChangeTargetInput = (newData) => {
    onChangeTarget({
      ...target,
      ...newData,
    });
  };

  if (playerReferences.getMediaType() === MEDIA_TYPES.IMAGE) {
    // eslint-disable-next-line no-param-reassign
    timeTarget = false;
  }

  return (
    <Grid item container direction="column" spacing={1}>
      <Grid item>
        <Typography variant="formSectionTitle">
          {t('target')}
        </Typography>
      </Grid>
      {
        (spatialTarget && playerReferences.getMediaType() !== MEDIA_TYPES.AUDIO) && (
          <Grid item container direction="column">
            <TargetSpatialInput
              playerReferences={playerReferences}
              setTargetDrawingState={onChangeTargetInput}
              targetDrawingState={target.drawingState}
              windowId={windowId}
              t={t}
            />
          </Grid>
        )
      }
      {
        (timeTarget && playerReferences.getMediaType() !== MEDIA_TYPES.IMAGE) && (
          <Grid item container direction="column">
            <TargetTimeInput
              playerReferences={playerReferences}
              tstart={target.tstart}
              tend={target.tend}
              onChange={onChangeTargetInput}
              windowId={windowId}
              t={t}
            />
          </Grid>
        )
      }
    </Grid>
  );
}

TargetFormSection.propTypes = {
  onChangeTarget: PropTypes.func.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  playerReferences: PropTypes.object.isRequired,
  spatialTarget: PropTypes.bool.isRequired,
  t: PropTypes.func.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  target: PropTypes.object.isRequired,
  timeTarget: PropTypes.bool.isRequired,
  windowId: PropTypes.string.isRequired,
};
