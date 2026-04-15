import React from 'react';
import PropTypes from 'prop-types';
import { Chip } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useDispatch, useSelector } from 'react-redux';
import { processTargetAction, transcribe } from '../UtilsLLMAPI';

/** Chip that triggers transcription of the current canvas. */
export default function TranscribeChip({
  endpoint,
  manifestUrl,
  playerReferences,
  setIsLoading,
  isLoading,
  target,
}) {
  const dispatch = useDispatch();
  const storageAdapter = useSelector((state) => state.config.annotation.adapter);
  const handleTranscribe = async () => {
    const activeCanvases = playerReferences.getCanvases?.() || [];
    if (!activeCanvases.length || !manifestUrl) return;

    setIsLoading(true);
    await processTargetAction(
      manifestUrl,
      activeCanvases[0],
      target,
      'transcribe',
      endpoint,
      storageAdapter,
      dispatch,
      () => {
        setIsLoading(false);
      },
      (err) => {
        console.error('Translation failed:', err);
        setIsLoading(false);
      },
    );
  };

  return (
    <Chip
      icon={<AutoAwesomeIcon fontSize="small" />}
      label="Transcribe this"
      onClick={handleTranscribe}
      disabled={isLoading}
      clickable
      size="small"
      variant="outlined"
      color="primary"
    />
  );
}

TranscribeChip.propTypes = {
  endpoint: PropTypes.string.isRequired,
  isLoading: PropTypes.bool.isRequired,
  manifestUrl: PropTypes.string,
  playerReferences: PropTypes.shape({
    getCanvases: PropTypes.func,
  }).isRequired,
  setIsLoading: PropTypes.func.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  target: PropTypes.object,
};

TranscribeChip.defaultProps = {
  manifestUrl: null,
};
