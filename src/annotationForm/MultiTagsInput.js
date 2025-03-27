import React from 'react';
import { WithContext as ReactTags } from 'react-tag-input';
import PropTypes from 'prop-types';
import { Typography } from '@mui/material';

/**
 * MultiTagsInput component
 * @param t
 * @param tags
 * @param setTags
 * @returns {Element}
 * @constructor
 */
export function MultiTagsInput({
  setTags,
  t,
  tags,
}) {
  /**
   * Handle tag deletion
   * @param index
   */
  const handleDelete = (index) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  /**
   * Handle tag update
   * @param index
   * @param newTag
   */
  const onTagUpdate = (index, newTag) => {
    const updatedTags = [...tags];
    updatedTags.splice(index, 1, newTag);
    setTags(updatedTags);
  };

  /**
   * Handle tag addition
   * @param tag
   */
  const handleAddition = (tag) => {
    setTags([...tags, tag]);
  };

  /**
   * Handle tag drag
   * @param tag
   * @param currPos
   * @param newPos
   */
  const handleDrag = (tag, currPos, newPos) => {
    const newTags = tags.slice();

    newTags.splice(currPos, 1);
    newTags.splice(newPos, 0, tag);

    // re-render
    setTags(newTags);
  };

  /**
   * Handle tag click
   * @param index
   */
  const handleTagClick = (index) => {
    console.log(`The tag at index ${index} was clicked`);
  };

  /**
   * Clear all tags
   */
  const onClearAll = () => {
    setTags([]);
  };

  const suggestions = ['Geourjon', 'Anthony', 'Cataegoru'];

  return (
    <>
      <Typography variant="formSectionTitle">
        {t('tags')}
      </Typography>
      <ReactTags
        placeholder={t('pressEnterToAddTag')}
        clearAll
        editable
        handleAddition={handleAddition}
        handleDelete={handleDelete}
        handleDrag={handleDrag}
        handleTagClick={handleTagClick}
        inputFieldPosition="bottom"
        onClearAll={onClearAll}
        onTagUpdate={onTagUpdate}
        tags={tags}
        suggestions={suggestions.map((suggestion) => ({
          id: suggestion,
          text: suggestion,
        }))}
      />
    </>
  );
}

MultiTagsInput.propTypes = {
  setTags: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  tags: PropTypes.any.isRequired,
};
