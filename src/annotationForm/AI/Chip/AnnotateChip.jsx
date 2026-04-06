import React from 'react';
import PropTypes from 'prop-types';
import { Chip } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useDispatch } from 'react-redux';
import { receiveAnnotation } from 'mirador';

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

  const handleAnnotate = async () => {
    const activeCanvases = playerReferences.getCanvases?.() || [];
    if (!activeCanvases.length || !manifestUrl) return;

    const canvasId = activeCanvases[0].id;
    const canvasIndex = activeCanvases[0].index;

    setIsLoading(true);
    try {
      const response = await fetch(`${endpoint}iiif/annotate-manifest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manifest_url: manifestUrl,
          canvas_index: canvasIndex,
        }),
      });

      const updatedManifest = await response.json();
      const newAnnos = updatedManifest.items[canvasIndex]?.annotations || [];

      newAnnos.forEach((annoPage) => {
        dispatch(receiveAnnotation(canvasId, annoPage.id, annoPage));
      });

      conversationService.addMessage(
        conversationId,
        'assistant',
        '🧠 Full annotation complete (description + regions added).',
        null,
      );
      setConversation(conversationService.getActiveBranch(conversationId));
    } catch (err) {
      console.error('Annotate error', err);
      pushErrorMessage();
    } finally {
      setIsLoading(false);
    }
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
