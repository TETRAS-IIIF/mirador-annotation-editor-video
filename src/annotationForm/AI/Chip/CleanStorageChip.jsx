import React from 'react';
import { Chip } from '@mui/material';
import { DeleteOutline } from '@mui/icons-material';

/** Chip that triggers translation of annotations on the current canvas. */
export default function CleanStorageChip() {

  /**
   * Clean local storage
   */
  const cleanStorage = () => {
    localStorage.removeItem('mirador_llm_conversations');
  };

  return (
    <Chip
      icon={<DeleteOutline fontSize="small" />}
      label="Clean storage"
      onClick={cleanStorage}
      disabled={false}
      clickable
      size="small"
      variant="outlined"
      color="primary"
    />
  );
}
