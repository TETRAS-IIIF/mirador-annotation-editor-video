import React from 'react';
import PropTypes from 'prop-types';
import { Box, Stack } from '@mui/material';
import TranslateChip from './TranslateChip';
import TranscribeChip from './TranscribeChip';
import DescribeChip from './DescribeChip';
import AnnotateChip from './AnnotateChip';

/** Toolbar grouping the four AI action chips (Translate, Transcribe, Describe, Annotate). */
export default function UtilsChipTools({
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
  return (
    <Box sx={{ pt: 1.5, px: 2 }}>
      <Stack direction="row" spacing={1}>
        <TranslateChip
          conversationId={conversationId}
          conversationService={conversationService}
          endpoint={endpoint}
          isLoading={isLoading}
          manifestUrl={manifestUrl}
          playerReferences={playerReferences}
          pushErrorMessage={pushErrorMessage}
          setConversation={setConversation}
          setIsLoading={setIsLoading}
        />
        <TranscribeChip
          conversationId={conversationId}
          conversationService={conversationService}
          endpoint={endpoint}
          isLoading={isLoading}
          manifestUrl={manifestUrl}
          playerReferences={playerReferences}
          pushErrorMessage={pushErrorMessage}
          setConversation={setConversation}
          setIsLoading={setIsLoading}
        />
        <DescribeChip
          conversationId={conversationId}
          conversationService={conversationService}
          endpoint={endpoint}
          isLoading={isLoading}
          manifestUrl={manifestUrl}
          playerReferences={playerReferences}
          pushErrorMessage={pushErrorMessage}
          setConversation={setConversation}
          setIsLoading={setIsLoading}
        />
        <AnnotateChip
          conversationId={conversationId}
          conversationService={conversationService}
          endpoint={endpoint}
          isLoading={isLoading}
          manifestUrl={manifestUrl}
          playerReferences={playerReferences}
          pushErrorMessage={pushErrorMessage}
          setConversation={setConversation}
          setIsLoading={setIsLoading}
        />
      </Stack>
    </Box>
  );
}

UtilsChipTools.propTypes = {
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

UtilsChipTools.defaultProps = {
  conversationId: null,
  manifestUrl: null,
};
