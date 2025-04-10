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
 * @param onChangeTemplate - Function to handle template selection
 * @param t - Translation function
 * @constructor
 */
export function TextCommentInput({
  comment,
  commentTemplates,
  onChangeTemplate,
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
        <Grid item style={{ marginBottom: '10px' }}>
          <CreatableSelect
            options={commentTemplates.map((template) => ({
              label: template.title,
              title: template.content, // Add title attribute for tooltip
              value: template.content,
            }))}
            placeholder={t('useTemplate')}
            onChange={(selectedOption) => {
              if (selectedOption) {
                onChangeTemplate(selectedOption);
              }
            }}
            isClearable
            isSearchable
            formatOptionLabel={(option) => (
              <div title={option.title}>
                {option.label}
              </div>
            )}
            styles={{
              marginBottom: '20px',
            }}
          />
        </Grid>
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
  onChangeTemplate: PropTypes.func.isRequired,
  setComment: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};
