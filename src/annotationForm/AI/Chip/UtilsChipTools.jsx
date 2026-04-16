import React from 'react';
import PropTypes from 'prop-types';
import { Box, Stack } from '@mui/material';
import { useSelector } from 'react-redux';
import TranslateChip from './TranslateChip';
import TranscribeChip from './TranscribeChip';
import DescribeChip from '../../DescribeChip';

/** Toolbar grouping the four AI action chips (Translate, Transcribe, Describe, Annotate). */
export default function UtilsChipTools({
  manifestUrl,
  playerReferences,
  isLoading,
  setIsLoading,
  setAnnotationState,
  target,
}) {
  const endpoint = useSelector((state) => state.config?.llm?.endpoint);

  const handleSetAnnotationState = (aiAnnotation, aiTagLabel = 'IA Generated') => {
    const aiTextValue = Array.isArray(aiAnnotation.body)
      ? aiAnnotation.body.find((b) => b.purpose !== 'tagging')?.value || aiAnnotation.body[0]?.value
      : aiAnnotation.body?.value;

    if (!aiTextValue) return;

    // Use prevState to calculate the new tags safely
    setAnnotationState((prevState) => {
      const currentTags = prevState.maeData?.tags || [];
      const hasIATag = currentTags.some((tag) => tag.value === aiTagLabel);
      const newTags = hasIATag
        ? currentTags
        : [...currentTags, { label: aiTagLabel, value: aiTagLabel }];

      return {
        ...prevState,
        maeData: {
          ...prevState.maeData,
          tags: newTags,
          textBody: {
            ...prevState.maeData.textBody,
            value: aiTextValue,
          },
        },
      };
    });
  };

  return (
    <Box sx={{ pt: 1.5, px: 2 }}>
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
        <TranslateChip
          endpoint={endpoint}
          manifestUrl={manifestUrl}
          playerReferences={playerReferences}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          target={target}
          handleSetAnnotationState={handleSetAnnotationState}
        />
        <TranscribeChip
          endpoint={endpoint}
          manifestUrl={manifestUrl}
          playerReferences={playerReferences}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          target={target}
          handleSetAnnotationState={handleSetAnnotationState}
        />
        <DescribeChip
          endpoint={endpoint}
          manifestUrl={manifestUrl}
          playerReferences={playerReferences}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          target={target}
          handleSetAnnotationState={handleSetAnnotationState}
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
  setAnnotationState: PropTypes.func.isRequired,
  setIsLoading: PropTypes.func.isRequired,
  target: PropTypes.object,
};

UtilsChipTools.defaultProps = {
  manifestUrl: null,
  target: null,
};
