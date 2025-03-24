import Typography from '@mui/material/Typography';
import { Grid } from '@mui/material';
import React from 'react';
import PropTypes from 'prop-types';

/** Debug Component * */
export function Debug(
  {
    playerReferences,
  },
) {
  if (playerReferences.isInitializedCorrectly()) {
    return (
      <Grid container direction="column" spacing={1}>
        <Grid item>
          <Typography variant="formSectionTitle">
            Debug
          </Typography>
        </Grid>
        <Grid item>
          <Typography variant="subFormSectionTitle">
            Canvas size :
            {' '}
            {playerReferences.getCanvasWidth()}
            {' '}
            x
            {' '}
            {playerReferences.getCanvasHeight()}
          </Typography>
        </Grid>
        <Grid item>
          <Typography variant="subFormSectionTitle">
            Container size :
            {' '}
            {playerReferences.getContainerWidth()}
            {' '}
            x
            {playerReferences.getContainerHeight()}
          </Typography>
        </Grid>
        <Grid item>
          <Typography variant="subFormSectionTitle">
            Displayed image size :
            {' '}
            {playerReferences.getDisplayedMediaWidth()}
            {' '}
            x
            {playerReferences.getDisplayedMediaHeight()}
          </Typography>
        </Grid>
        <Grid item>
          <Typography variant="subFormSectionTitle">
            Media size (from manifest):
            {' '}
            {playerReferences.getMediaTrueWidth()}
            {' '}
            x
            {playerReferences.getMediaTrueHeight()}
          </Typography>
        </Grid>
        <Grid item>
          <Typography variant="subFormSectionTitle">
            Scale :
            {' '}
            {playerReferences.getScale()}
          </Typography>
        </Grid>
        <Grid item>
          <Typography variant="subFormSectionTitle">
            True scale height (media / displayed image ) :
            {' '}
            {playerReferences.getMediaTrueHeight() / playerReferences.getDisplayedMediaHeight()}
          </Typography>
        </Grid>
        <Grid item>
          <Typography variant="subFormSectionTitle">
            Zoom
            {' '}
            {playerReferences.getZoom()}
          </Typography>
        </Grid>
      </Grid>
    );
  }

  return (
    <Typography>
      Player reference is not initialized correctly
    </Typography>
  );
}

Debug.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  playerReferences: PropTypes.object.isRequired,
};
