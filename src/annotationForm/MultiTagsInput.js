import React, { useState } from 'react';
import { WithContext as ReactTags } from 'react-tag-input';
import PropTypes from 'prop-types';
import {
  Divider, FormControlLabel, Switch, Typography,
} from '@mui/material';

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
  const [showSuggestions, setShowSuggestions] = useState(false);

  const mappedSuggestionsTags = tagsSuggestions.map((suggestion) => ({
    id: suggestion,
    text: suggestion,
  }));

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
  const handleAddition = (newTag) => {
    if (tags.length === 0 || !tags.find((tag) => tag.id === newTag.id)) {
      setTags([...tags, newTag]);
    }
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

  return (
    <>
      <Typography variant="formSectionTitle">
        {t('tags')}
      </Typography>
      {/* Show list of suggestions into a clickable tag */}
      {/* add a toggle to show hide suggestions */}

      <FormControlLabel
        control={(
          <Switch
            value={showSuggestions}
            onClick={() => setShowSuggestions(!showSuggestions)}
          />
        )}
        label="Suggestion"
      />
      {
        showSuggestions
        && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
          }}
          >
            {mappedSuggestionsTags.map((suggestion) => (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => handleAddition(suggestion)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '16px',
                  border: '1px solid #ccc',
                  backgroundColor: '#f1f1f1',
                  cursor: 'pointer',
                }}
              >
                {suggestion.text}
              </button>
            ))}
          </div>
        )
      }
      <Divider
        spacing={2}
      />

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
        suggestions={mappedSuggestionsTags}
        minQueryLength={1}
        autocomplete
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
