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
  /**
   * Updates the annotation state with the result of an AI-generated annotation.
   * Extracts the text value from the annotation body, ensures exactly one AI tag
   * with the given label exists, and updates the text body value.
   *
   * @param {object} aiAnnotation - The IIIF Web Annotation object returned by the AI action.
   * @param {Array|object} aiAnnotation.body - The annotation body, either an array of bodies
   *   or a single body object containing a `value` string.
   * @param {string} [aiTagLabel='IA Generated'] - The label and value used for the AI tag.
   *   Any existing tag with this exact value will be replaced to avoid duplicates.
   * @returns {void} Returns early if no text value can be extracted from the annotation body.
   */
  const handleSetAnnotationState = (aiAnnotation, aiTagLabel = 'IA Generated') => {
    const aiTextValue = Array.isArray(aiAnnotation.body)
      ? aiAnnotation.body.find((b) => b.purpose !== 'tagging')?.value || aiAnnotation.body[0]?.value
      : aiAnnotation.body?.value;

    if (!aiTextValue) return;

    setAnnotationState((prevState) => {
      const currentTags = prevState.maeData?.tags || [];

      const filteredTags = currentTags.filter((tag) => tag.value !== aiTagLabel);
      const newTags = [...filteredTags, { label: aiTagLabel, value: aiTagLabel }];
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
  // eslint-disable-next-line react/forbid-prop-types
  target: PropTypes.object,
};

UtilsChipTools.defaultProps = {
  manifestUrl: null,
  target: null,
};
