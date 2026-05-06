import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Box, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions, Button,
} from '@mui/material';

/**
 * Strips HTML tags from a string, returning plain text.
 * @param {string} html - The HTML string to strip.
 * @returns {string} Plain text content.
 */
const stripHtml = (html) => {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
};

/**
 * Extracts the main text value from an annotation body.
 * Handles both array and object body formats.
 * @param {Array|Object} body - The annotation body.
 * @returns {string} The extracted text value.
 */
const extractTextValue = (body) => {
  if (!body) return '';
  return Array.isArray(body)
    ? body.find((b) => b.purpose !== 'tagging')?.value || body[0]?.value || ''
    : body?.value || '';
};

/**
 * A confirmation dialog that guards against accidentally overwriting
 * existing annotation content with AI-generated text.
 */
export default function OverwriteConfirmDialog({
  currentValue,
  onApply,
  children,
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(null);

  /**
     * Trigger function passed to children via render prop.
     * If the annotation already has content, opens the confirmation dialog.
     * Otherwise, applies the annotation immediately.
     * @param {Object} aiAnnotation - The AI-generated annotation object.
     * @param {string} [aiTagLabel='IA Generated'] - The tag label to attach.
     */
  const trigger = useCallback((aiAnnotation, aiTagLabel = 'IA Generated') => {
    const existingBody = stripHtml(currentValue);
    if (existingBody?.trim()) {
      setPending({ aiAnnotation, aiTagLabel });
      setOpen(true);
    } else {
      onApply(aiAnnotation, aiTagLabel);
    }
  }, [currentValue, onApply]);

  /**
     * Confirms overwrite — applies the pending annotation and closes the dialog.
     */
  const handleConfirm = () => {
    if (pending) onApply(pending.aiAnnotation, pending.aiTagLabel);
    setOpen(false);
    setPending(null);
  };

  /**
     * Cancels the overwrite — discards the pending annotation and closes the dialog.
     */
  const handleCancel = () => {
    setOpen(false);
    setPending(null);
  };

  return (
    <>
      {children(trigger)}

      <Dialog
        open={open}
        onClose={handleCancel}
        aria-labelledby="overwrite-dialog-title"
        aria-describedby="overwrite-dialog-description"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="overwrite-dialog-title">
          Overwrite existing content?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="overwrite-dialog-description">
            This annotation already has content. Applying an AI-generated result will
            overwrite the existing text. This action cannot be undone.
          </DialogContentText>

          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            mt: 2,
          }}
          >
            <Box>
              <DialogContentText
                variant="caption"
                color="text.secondary"
                sx={{
                  fontWeight: 600,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                }}
              >
                Current content
              </DialogContentText>
              <Box
                sx={{
                  bgcolor: 'action.hover',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  color: 'text.primary',
                  fontSize: '0.875rem',
                  mt: 0.5,
                  p: 1.5,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {stripHtml(currentValue)}
              </Box>
            </Box>

            <Box>
              <DialogContentText
                variant="caption"
                color="text.secondary"
                sx={{
                  fontWeight: 600,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                }}
              >
                New AI-generated content
              </DialogContentText>
              <Box
                sx={{
                  bgcolor: 'success.light',
                  border: '1px solid',
                  borderColor: 'success.main',
                  borderRadius: 1,
                  color: 'success.contrastText',
                  fontSize: '0.875rem',
                  mt: 0.5,
                  p: 1.5,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {stripHtml(extractTextValue(pending?.aiAnnotation?.body))}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirm} color="error" variant="contained" autoFocus>
            Overwrite
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

OverwriteConfirmDialog.propTypes = {
  children: PropTypes.func.isRequired,
  currentValue: PropTypes.string,
  onApply: PropTypes.func.isRequired,
};

OverwriteConfirmDialog.defaultProps = {
  currentValue: '',
};
