import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Chip, CircularProgress, Tooltip } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { processTargetAction } from './AI/UtilsLLMAPI';

/** Chip that triggers visual description of a targeted region on the current canvas. */
export default function DescribeChip({
  endpoint,
  manifestUrl,
  playerReferences,
  isLoading,
  setIsLoading,
  target,
  handleSetAnnotationState,
}) {
  const [isPending, setIsPending] = useState(false);
  /** Calls the FastAPI target-action endpoint and dispatches resulting annotations. */
  const handleDescribe = async () => {
    const activeCanvases = playerReferences.getCanvases?.() || [];
    if (!activeCanvases.length || !manifestUrl || !target) return;

    const canvas = activeCanvases[0];

    setIsPending(true);
    setIsLoading(true);

    await processTargetAction(
      manifestUrl,
      canvas,
      target,
      'describe',
      endpoint,
      (newAnnotation) => {
        setIsPending(false);
        handleSetAnnotationState(newAnnotation);
        setIsLoading(false);
      },
      (error) => {
        console.error('Description error:', error);
        setIsLoading(false);
      },
    );
  };

  return (

    <Tooltip title="Describe this">
      <span>
        <Chip
          icon={
            isPending
              ? <CircularProgress size={14} color="inherit" />
              : <AutoAwesomeIcon fontSize="small" />
          }
          onClick={handleDescribe}
          disabled={isLoading || !target}
          clickable
          size="small"
          variant="outlined"
          color="primary"
        />
      </span>
    </Tooltip>
  );
}

DescribeChip.propTypes = {
  endpoint: PropTypes.string.isRequired,
  handleSetAnnotationState: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
  manifestUrl: PropTypes.string,
  playerReferences: PropTypes.shape({
    getCanvases: PropTypes.func,
  }).isRequired,
  setIsLoading: PropTypes.func.isRequired,
  target: PropTypes.object,
};

DescribeChip.defaultProps = {
  manifestUrl: null,
  target: null,
};
