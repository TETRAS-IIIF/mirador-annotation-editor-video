import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Chip, Tooltip, CircularProgress } from '@mui/material';
import EditNoteIcon from '@mui/icons-material/EditNote';
import { processTargetAction } from '../UtilsLLMAPI';

/** Chip that triggers transcription of the current canvas. */
export default function TranscribeChip({
  endpoint,
  manifestUrl,
  playerReferences,
  setIsLoading,
  isLoading,
  target,
  handleSetAnnotationState,
  hasMultipleShapes,
}) {
  const [isPending, setIsPending] = useState(false);
  /** Calls the FastAPI target-action endpoint and dispatches resulting annotations. */
  const handleTranscribe = async () => {
    const activeCanvases = playerReferences.getCanvases?.() || [];
    if (!activeCanvases.length || !manifestUrl) return;

    setIsPending(true);
    setIsLoading(true);
    await processTargetAction(
      manifestUrl,
      activeCanvases[0],
      target,
      'transcribe',
      endpoint,
      (newAnnotation) => {
        handleSetAnnotationState?.(newAnnotation);
        setIsPending(false);
        setIsLoading(false);
      },
      (err) => {
        console.error('Transcription failed:', err);
        setIsPending(false);
        setIsLoading(false);
      },
    );
  };

  return (
    <Tooltip title={hasMultipleShapes ? 'Transcription is not available with multiple shapes' : 'Transcribe this'}>
      <span>
        <Chip
          icon={
              isPending
                ? <CircularProgress size={14} color="inherit" />
                : <EditNoteIcon fontSize="small" />
            }
          onClick={handleTranscribe}
          disabled={isLoading || hasMultipleShapes}
          clickable
          size="medium"
          variant="outlined"
          color="primary"
        />
      </span>
    </Tooltip>
  );
}

TranscribeChip.propTypes = {
  endpoint: PropTypes.string.isRequired,
  handleSetAnnotationState: PropTypes.func,
  hasMultipleShapes: PropTypes.bool,
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
  handleSetAnnotationState: null,
  hasMultipleShapes: false,
  manifestUrl: null,
  target: null,
};
