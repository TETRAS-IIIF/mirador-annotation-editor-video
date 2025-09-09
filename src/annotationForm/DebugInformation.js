import Typography from '@mui/material/Typography';
import React from 'react';
import PropTypes from 'prop-types';

/**
 * DebugInformation component to display media and container details
 * @param playerReferences
 * @returns {Element}
 * @constructor
 */
export function DebugInformation({ playerReferences, t }) {
  return (
    <>
      <Typography>
        {playerReferences.getMediaType()}
      </Typography>
      <Typography>
        {t('scale')}
        :
        {playerReferences.getScale()}
      </Typography>
      <Typography>
        {t('zoom')}
        :
        {playerReferences.getZoom()}
      </Typography>
      <Typography>
        {t('image_true_size')}
        :
        {playerReferences.getMediaTrueWidth()}
        {' '}
        x
        {playerReferences.getMediaTrueHeight()}
      </Typography>
      <Typography>
        {t('container_size')}
        :
        {playerReferences.getContainerWidth()}
        {' '}
        x
        {playerReferences.getContainerHeight()}
      </Typography>
      <Typography>
        {t('image_displayed')}
        :
        {playerReferences.getDisplayedMediaWidth()}
        {' '}
        x
        {playerReferences.getDisplayedMediaHeight()}
      </Typography>
    </>
  );
}

DebugInformation.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  playerReferences: PropTypes.any.isRequired,
  t: PropTypes.func.isRequired,
};
