import React from 'react';
import PropTypes from 'prop-types';
import { Grid, Typography } from '@mui/material';
import CreatableSelect from 'react-select/creatable';
import TextEditor from '../TextEditor';

/**
 * TextCommentInput component
 * @param commentTemplates - The list of comment templates
 * @param comment - The current comment
 * @param setComment - Function to set the comment
 * @param t - Translation function
 * @constructor
 */
export function TextCommentInput({
  commentTemplates,
  comment,
  setComment,
  t,
}) {
  return (
    <>
      <Grid container item>
        <Typography variant="formSectionTitle">
          {t('note')}
        </Typography>
      </Grid>
      {commentTemplates.length > 0 && (
        <CreatableSelect
          options={commentTemplates.map((template) => ({
            label: template.title,
            value: template.content,
            title: template.content, // Add title attribute for tooltip
          }))}
          placeholder={t('useTemplate')}
          onChange={(selectedOption) => {
            if (selectedOption) {
              setComment(selectedOption.value);
            }
          }}
          isClearable
          isSearchable
          formatOptionLabel={(option) => (
            <div title={option.title}>
              {option.label}
            </div>
          )}
        />
      )}

      <Grid container item>
        <TextEditor
          text={comment}
          setText={setComment}
        />
      </Grid>
    </>
  );
}

TextCommentInput.propTypes = {
  comment: PropTypes.string.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  commentTemplates: PropTypes.arrayOf(PropTypes.object).isRequired,
  setComment: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};
