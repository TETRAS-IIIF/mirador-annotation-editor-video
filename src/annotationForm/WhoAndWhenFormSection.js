import PropTypes from 'prop-types';
import Typography from '@mui/material/Typography';
import React from 'react';

/**
 *
 * @param creator
 * @param creationDate
 * @param lastEditor
 * @param lastSavedDate
 * @param t
 * @returns {React.JSX.Element|null}
 * @constructor
 */
function WhoAndWhenFormSection({
  creator,
  creationDate,
  lastEditor,
  lastSavedDate,
  t,
}) {
  if (!creator || !creationDate) {
    return null;
  }

  let creatorToDisplay = creator !== ANONYMOUS_USER ? creator : t('anonymous');
  let lastEditorToDisplay = lastEditor !== ANONYMOUS_USER ? lastEditor : t('anonymous');

  return (
    <>
      <Typography>
        {t('createdByOn', {
          creationDate,
          creator: creatorToDisplay,
        })}
      </Typography>
      {
        (lastSavedDate && lastEditor) && (
          <Typography>
            {t('lastEditedByOn', {
              lastEditor: lastEditorToDisplay,
              lastSavedDate,
            })}
          </Typography>
        )
      }
    </>
  );
}

WhoAndWhenFormSection.propTypes = {
  creationDate: PropTypes.string.isRequired,
  creator: PropTypes.string.isRequired,
  lastEditor: PropTypes.string.isRequired,
  lastSavedDate: PropTypes.string.isRequired,
  t: PropTypes.func.isRequired,
};

export default WhoAndWhenFormSection;
