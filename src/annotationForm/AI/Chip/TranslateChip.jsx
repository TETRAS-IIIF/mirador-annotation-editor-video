import React from 'react';
import PropTypes from 'prop-types';
import { Chip } from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';
import { useSelector } from 'react-redux';
import { translate } from '../UtilsLLMAPI';

/** Chip that triggers translation of annotations on the current canvas. */
export default function TranslateChip({
  endpoint,
  manifestUrl,
  playerReferences,
  conversationId,
  conversationService,
  isLoading,
  setIsLoading,
  setConversation,
  pushErrorMessage,
}) {
  const storageAdapter = useSelector((state) => state.config.annotation.adapter);

  /** Calls the FastAPI translate-manifest endpoint and dispatches resulting annotations. */
  const handleTranslate = async () => {
    const activeCanvases = playerReferences.getCanvases?.() || [];
    if (!activeCanvases.length || !manifestUrl) return;

    setIsLoading(true);

    await translate(
      manifestUrl,
      activeCanvases[0],
      endpoint,
      storageAdapter,
      () => {
        conversationService.addMessage(conversationId, 'assistant', '✅ Translation complete. Annotations added to viewer.', null);
        setConversation(conversationService.getActiveBranch(conversationId));
        setIsLoading(false);
      },
      () => {
        pushErrorMessage();
      },
    );
  };

  return (
    <Chip
      icon={<TranslateIcon fontSize="small" />}
      label="Translate this"
      onClick={handleTranslate}
      disabled={isLoading}
      clickable
      size="small"
      variant="outlined"
      color="primary"
    />
  );
}

TranslateChip.propTypes = {
  conversationId: PropTypes.string,
  conversationService: PropTypes.shape({
    addMessage: PropTypes.func.isRequired,
    getActiveBranch: PropTypes.func.isRequired,
  }).isRequired,
  endpoint: PropTypes.string.isRequired,
  isLoading: PropTypes.bool.isRequired,
  manifestUrl: PropTypes.string,
  playerReferences: PropTypes.shape({
    getCanvases: PropTypes.func,
  }).isRequired,
  pushErrorMessage: PropTypes.func.isRequired,
  setConversation: PropTypes.func.isRequired,
  setIsLoading: PropTypes.func.isRequired,
};

TranslateChip.defaultProps = {
  conversationId: null,
  manifestUrl: null,
};
