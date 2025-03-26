import React from 'react';
import { WithContext as ReactTags } from 'react-tag-input';
import PropTypes from 'prop-types';

/**
 * MultiTagsInput component
 * @param tags
 * @param setTags
 * @returns {Element}
 * @constructor
 */
export function MultiTagsInput({
  tags,
  setTags,
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

  console.log('tags', tags);

  return (
    <ReactTags
      tags={tags}
      handleDelete={handleDelete}
      handleAddition={handleAddition}
      handleDrag={handleDrag}
      handleTagClick={handleTagClick}
      onTagUpdate={onTagUpdate}
      inputFieldPosition="bottom"
      editable
      clearAll
      onClearAll={onClearAll}
    />
  );
}

MultiTagsInput.propTypes = {
  setTags: PropTypes.func.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  tags: PropTypes.any.isRequired,
};
