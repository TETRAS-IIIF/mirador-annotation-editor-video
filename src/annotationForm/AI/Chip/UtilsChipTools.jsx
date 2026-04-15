import React from 'react';
import PropTypes from 'prop-types';
import { Box, Stack } from '@mui/material';
import { useSelector } from 'react-redux';
import TranslateChip from './TranslateChip';
import TranscribeChip from './TranscribeChip';
import DescribeChip from '../../DescribeChip';
import AnnotateChip from './AnnotateChip';

/** Toolbar grouping the four AI action chips (Translate, Transcribe, Describe, Annotate). */
export default function UtilsChipTools({
  manifestUrl,
  playerReferences,
  isLoading,
  setIsLoading,
  target,
}) {
  const endpoint = useSelector((state) => state.config?.llm?.endpoint);

  return (
    <Box sx={{ pt: 1.5, px: 2 }}>
      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        sx={{ flexWrap: 'wrap' }}
      >
        <TranslateChip
          endpoint={endpoint}
          manifestUrl={manifestUrl}
          playerReferences={playerReferences}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          target={target}
        />
        <TranscribeChip
          endpoint={endpoint}
          manifestUrl={manifestUrl}
          playerReferences={playerReferences}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          target={target}
        />
        <DescribeChip
          endpoint={endpoint}
          manifestUrl={manifestUrl}
          playerReferences={playerReferences}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          target={target}
        />
      </Stack>
    </Box>
  );
}

UtilsChipTools.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  manifestUrl: PropTypes.string,
  playerReferences: PropTypes.shape({
    getCanvases: PropTypes.func,
  }).isRequired,
  setIsLoading: PropTypes.func.isRequired,
};

UtilsChipTools.defaultProps = {
  manifestUrl: null,
};
