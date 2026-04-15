import React from 'react';
import PropTypes from 'prop-types';
import { Chip } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useSelector, useDispatch } from 'react-redux';
import { processTargetAction } from './AI/UtilsLLMAPI';

/** Chip that triggers visual description of a targeted region on the current canvas. */
export default function DescribeChip({
  endpoint,
  manifestUrl,
  playerReferences,
  target,
  isLoading,
  setIsLoading,
}) {
  const storageAdapter = useSelector((state) => state.config.annotation.adapter);
  const dispatch = useDispatch();

  const handleDescribe = async () => {
    const activeCanvases = playerReferences.getCanvases?.() || [];
    if (!activeCanvases.length || !manifestUrl || !target) return;

    setIsLoading(true);
    await processTargetAction(
      manifestUrl,
      activeCanvases[0],
      target,
      'describe',
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
      label="Describe this"
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
