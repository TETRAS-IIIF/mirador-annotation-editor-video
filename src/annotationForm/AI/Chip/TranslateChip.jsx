import React from 'react';
import PropTypes from 'prop-types';
import { Chip } from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';
import { useDispatch } from 'react-redux';
import { receiveAnnotation } from 'mirador';

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
  const dispatch = useDispatch();

  /** Calls the FastAPI translate-manifest endpoint and dispatches resulting annotations. */
  const handleTranslate = async () => {
    const activeCanvases = playerReferences.getCanvases?.() || [];
    if (!activeCanvases.length || !manifestUrl) return;

    const canvasId = activeCanvases[0].id;
    const canvasIndex = activeCanvases[0].index;

    setIsLoading(true);
    try {
      const response = await fetch(`${endpoint}iiif/translate-manifest`, {
        body: JSON.stringify({
          canvas_index: canvasIndex,
          manifest_url: manifestUrl,
          target_iso: 'en',
          target_lang: 'English',
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });

      const updatedManifest = await response.json();
      const newAnnos = updatedManifest.items[canvasIndex]?.annotations || [];

      newAnnos.forEach((annoPage) => {
        dispatch(receiveAnnotation(canvasId, annoPage.id, annoPage));
      });

      conversationService.addMessage(conversationId, 'assistant', '✅ Translation complete. Annotations added to viewer.', null);
      setConversation(conversationService.getActiveBranch(conversationId));
    } catch (err) {
      console.error('Translation error', err);
      pushErrorMessage();
    } finally {
      setIsLoading(false);
    }
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

