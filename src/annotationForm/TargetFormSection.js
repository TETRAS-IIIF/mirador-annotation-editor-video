import React, { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Grid, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { MEDIA_TYPES, TEMPLATE } from './AnnotationFormUtils';
import TargetTimeInput from './TargetTimeInput';
import { TargetSpatialInput } from './TargetSpatialInput';

/**
 * Section of Time and Space Target
 * @param onChangeTarget
 * @param spatialTarget
 * @param playerReferences
 * @param target
 * @param timeTarget
 * @param windowId
 * @returns {Element}
 * @constructor
 */
export default function TargetFormSection({
  onChangeTarget,
  spatialTarget,
  playerReferences,
  target,
  timeTarget,
  windowId,
}) {
  const { t } = useTranslation();

  const mediaType = playerReferences.getMediaType();
  const defaultTarget = useMemo(() => {
    if (target) return target;

    const next = {
      drawingState: {
        currentShape: null,
        isDrawing: false,
        shapes: [],
      },
    };

    if (mediaType === MEDIA_TYPES.IMAGE) {
      next.fullCanvaXYWH = `0,0,${playerReferences.getMediaTrueWidth()},${playerReferences.getMediaTrueHeight()}`;
    }

    if (mediaType === MEDIA_TYPES.VIDEO) {
      next.fullCanvaXYWH = `0,0,${playerReferences.getMediaTrueWidth()},${playerReferences.getMediaTrueHeight()}`;
      next.tstart = playerReferences.getCurrentTime() || 0;
      next.tend = playerReferences.getMediaDuration()
        ? Math.floor(playerReferences.getMediaDuration()) : 0;
    }

    /** Handle timeTargetInput  and spatialTargetInput* */
    return next;
    // Only depends on values used to compute defaults
    // DO NOT include onChangeTarget here
  }, [target, mediaType, playerReferences]);

  // Post-render sync: if parent didn't provide target, set it once
  useEffect(() => {
    if (!target) onChangeTarget(defaultTarget);
  }, [target, defaultTarget, onChangeTarget]);

  const onChangeTargetInput = (newData) => {
    onChangeTarget({
      ...defaultTarget,
      ...newData,
    });
  };

  if (playerReferences.getMediaType() === MEDIA_TYPES.IMAGE) {
    // eslint-disable-next-line no-param-reassign
    timeTarget = false;
  }

  if (!spatialTarget && !timeTarget) {
    return <> </>;
  }

  return (
    <Grid container direction="column" spacing={1}>
      <Grid>
        <Typography variant="formSectionTitle">
          {t('target')}
        </Typography>
      </Grid>

      {spatialTarget && mediaType !== MEDIA_TYPES.AUDIO && (
        <Grid container direction="column">
          <TargetSpatialInput
            playerReferences={playerReferences}
            setTargetDrawingState={onChangeTargetInput}
            targetDrawingState={defaultTarget.drawingState}
            windowId={windowId}
          />
        </Grid>
      )}
      {
        (timeTarget && playerReferences.getMediaType() !== MEDIA_TYPES.IMAGE) && (
          <Grid container direction="column">
            <TargetTimeInput
              playerReferences={playerReferences}
              tstart={defaultTarget.tstart}
              tend={defaultTarget.tend}
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
  playerReferences: PropTypes.object.isRequired,
  spatialTarget: PropTypes.bool.isRequired,
  target: PropTypes.object, // allow undefined/null; child will hydrate once
  // eslint-disable-next-line react/forbid-prop-types
  timeTarget: PropTypes.bool.isRequired,
  windowId: PropTypes.string.isRequired,
};
