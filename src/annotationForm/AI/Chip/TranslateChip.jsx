import React from 'react';
import PropTypes from 'prop-types';
import { Chip } from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';
import { useSelector, useDispatch } from 'react-redux';
import { processTargetAction } from '../UtilsLLMAPI';

/** Chip that triggers translation of a targeted region on the current canvas. */
export default function TranslateChip({
  endpoint,
  manifestUrl,
  playerReferences,
  target,
  isLoading,
  setIsLoading,
}) {
  const storageAdapter = useSelector((state) => state.config.annotation.adapter);
  const dispatch = useDispatch();
  /** Calls the FastAPI target-action endpoint and dispatches resulting annotations. */
  const handleTranslate = async () => {
    const activeCanvases = playerReferences.getCanvases?.() || [];
    if (!activeCanvases.length || !manifestUrl || !target) return;

    setIsLoading(true);

    await processTargetAction(
      manifestUrl,
      activeCanvases[0],
      target,
      'translate',
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
      icon={<TranslateIcon fontSize="small" />}
      label="Translate this"
      onClick={handleTranslate}
      disabled={isLoading || !target}
      clickable
      size="small"
      variant="outlined"
      color="primary"
    />
  );
}

TranslateChip.propTypes = {
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

TranslateChip.defaultProps = {
  manifestUrl: null,
  target: null,
};
