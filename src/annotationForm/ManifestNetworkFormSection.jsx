import React from 'react';
import {
  Grid, Link, TextField, Typography,
} from '@mui/material';
import PropTypes from 'prop-types';
import { isValidUrl } from './AnnotationFormUtils';

/**
 * Handle Manifest Section
 * @param manifestNetwork
 * @param onChange - callback function to handle manifest URL changes
 * @param t
 * @returns {Element}
 * @constructor
 */
export default function ManifestNetworkFormSection(
  {
    manifestNetwork,
    onChange,
    t,
  },
) {
  return (
    <Grid container direction="column" spacing={1}>
      <Grid>
        <Typography variant="formSectionTitle">
          {t('document')}
        </Typography>
      </Grid>
      <Grid>
        <TextField
          value={manifestNetwork}
          onChange={(event) => onChange(event.target.value.trim())}
          label={t('manifest_url')}
          type="url"
          error={!isValidUrl(manifestNetwork)}
        />
      </Grid>
      <Grid>
        {isValidUrl(manifestNetwork) && (
          <Link href={manifestNetwork} target="_blank" rel="noreferrer">
            {manifestNetwork}
          </Link>
        )}
      </Grid>
      <Grid>
        {!isValidUrl(manifestNetwork) && (
          <Typography variant="caption" color="error">
            {t('invalid_url')}
          </Typography>
        )}
      </Grid>
    </Grid>
  );
}

ManifestNetworkFormSection.propTypes = {
  manifestNetwork: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};
