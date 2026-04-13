import React from 'react';
import PropTypes from 'prop-types';
import { Chip } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useDispatch, useSelector } from 'react-redux';
import { annotate } from '../UtilsLLMAPI';

/** Chip that triggers full annotation (description + regions) on the current canvas. */
export default function AnnotateChip({
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
  const dispatch = useDispatch();
  const storageAdapter = useSelector((state) => state.config.annotation.adapter);

  const handleAnnotate = async () => {
    const activeCanvases = playerReferences.getCanvases?.() || [];
    if (!activeCanvases.length || !manifestUrl) return;

    const canvas = activeCanvases[0];

    setIsLoading(true);
    await annotate(
      manifestUrl,
      canvas,
      endpoint,
      storageAdapter,
      dispatch,
      () => {
        conversationService.addMessage(
          conversationId,
          'assistant',
          '🧠 Full annotation complete (description + regions added).',
          null,
        );
        setConversation(conversationService.getActiveBranch(conversationId));
        setIsLoading(false);
      },
      (err) => {
        console.error('Annotate error:', err);
        pushErrorMessage();
        setIsLoading(false);
      },
    );
  };

  return (
    <Chip
      icon={<AutoAwesomeIcon fontSize="small" />}
      label="Annotate this"
      onClick={handleAnnotate}
      disabled={isLoading}
      clickable
      size="small"
      variant="outlined"
      color="secondary"
    />
  );
}

AnnotateChip.propTypes = {
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

AnnotateChip.defaultProps = {
  conversationId: null,
  manifestUrl: null,
};
