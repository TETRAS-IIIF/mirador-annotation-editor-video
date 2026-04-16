import React from 'react';
import PropTypes from 'prop-types';
import { Chip } from '@mui/material';
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
  const handleDescribe = async () => {
    const activeCanvases = playerReferences.getCanvases?.() || [];
    if (!activeCanvases.length || !manifestUrl || !target) return;

    const canvas = activeCanvases[0];
    setIsLoading(true);

    // Call the centralized API function for 'describe'
    await processTargetAction(
      manifestUrl,
      canvas,
      target,
      'describe',
      endpoint,
      (newAnnotation) => {
        // SUCCESS CALLBACK: Update the UI state with the tag label 'IA Described'
        handleSetAnnotationState(newAnnotation, 'IA Described');
        setIsLoading(false);
      },
      (error) => {
        // ERROR CALLBACK
        console.error('Description error:', error);
        setIsLoading(false);
      },
    );
  };

  return (
    <Chip
      icon={<AutoAwesomeIcon fontSize="small" />}
      label="Describe target"
      onClick={handleDescribe}
      disabled={isLoading || !target}
      clickable
      size="small"
      variant="outlined"
      color="primary"
    />
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
