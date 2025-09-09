import React from 'react';
import CompanionWindow from 'mirador/dist/es/src/containers/CompanionWindow';
import { Grid } from '@mui/material';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

/** */
export default function UnsupportedMedia({ id, windowId, mediaType }) {
  const { t } = useTranslation();
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

UnsupportedMedia.propTypes = {
  id: PropTypes.string.isRequired,
  mediaType: PropTypes.string.isRequired,
  windowId: PropTypes.string.isRequired,
};
