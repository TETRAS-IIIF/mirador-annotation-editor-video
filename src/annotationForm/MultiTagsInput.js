import React from 'react';
import PropTypes from 'prop-types';
import { Divider, Typography } from '@mui/material';
import CreatableSelect from 'react-select/creatable';

/**
 * MultiTagsInput component
 * @param t
 * @param tags
 * @param tagsSuggestions
 * @param setTags
 * @returns {Element}
 * @constructor
 */
export function MultiTagsInput({
  setTags,
  t,
  tags,
  tagsSuggestions,
}) {
  const mappedSuggestionsTags = tagsSuggestions.map((suggestion) => ({
    label: suggestion,
    value: suggestion,
  }));

  return (
    <>
      <Typography variant="formSectionTitle">
        {t('tags')}
      </Typography>
      <CreatableSelect
        isMulti
        options={mappedSuggestionsTags}
        value={tags}
        onChange={setTags}
        closeMenuOnSelect={false}
        placeholder={t('tagsPlaceholder')}
      />
      <Divider
        spacing={2}
      />
    </>
  );
}

MultiTagsInput.propTypes = {
  setTags: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  tags: PropTypes.any.isRequired,
  tagsSuggestions: PropTypes.arrayOf(PropTypes.string).isRequired,
};
