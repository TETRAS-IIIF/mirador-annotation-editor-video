import TextFieldsIcon from '@mui/icons-material/TextFields';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import DataObjectIcon from '@mui/icons-material/DataObject';
import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { styled } from '@mui/material/styles';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { OVERLAY_TOOL } from './AnnotationFormOverlay/KonvaDrawing/KonvaUtils';

export const TEMPLATE = {
  IIIF_TYPE: 'iiif',
  TAGGING_TYPE: 'tagging',
  TEXT_TYPE: 'text',
};

// TODO Move in MediaUtils
export const MEDIA_TYPES = {
  AUDIO: 'Audio',
  IMAGE: 'Image',
  UNKNOWN: 'Unknown',
  VIDEO: 'Video',
};

/** Return template type * */
export const getTemplateType = (t, templateType) => TEMPLATE_TYPES(t)
  .find(
    (type) => type.id === templateType,
  );

/**
 * List of the template types supported
 */
export const TEMPLATE_TYPES = (t) => [
  {
    description: t('textual_note_with_target'),
    icon: <TextFieldsIcon />,
    id: TEMPLATE.TEXT_TYPE,
    isCompatibleWithTemplate: (mediaType) => {
      if (mediaType === MEDIA_TYPES.IMAGE) return true;
      return false;
    },
    label: t('note'),
  },
  {
    description: t('tag_with_target'),
    icon: <LocalOfferIcon fontSize="small" />,
    id: TEMPLATE.TAGGING_TYPE,
    isCompatibleWithTemplate: (mediaType) => {
      if (mediaType === MEDIA_TYPES.IMAGE) return true;
      return false;
    },
    label: t('tag'),
  },
  {
    description: t('edit_iiif_json_code'),
    icon: <DataObjectIcon fontSize="small" />,
    id: TEMPLATE.IIIF_TYPE,
    isCompatibleWithTemplate: (mediaType) => {
      if (mediaType === MEDIA_TYPES.IMAGE) return true;
      return false;
    },
    label: t('expert_mode'),
  },
];
export const DEFAULT_TOOL_STATE = {
  activeTool: OVERLAY_TOOL.SHAPE,
  closedMode: 'closed',
  fillColor: 'rgba(83,162, 235, 0.5)',
  image: { id: '' },
  imageEvent: null,
  strokeColor: 'rgba(20,82,168,1)',
  strokeWidth: 2,
};

export const IMAGE_TOOL_STATE = {
  activeTool: OVERLAY_TOOL.IMAGE,
  closedMode: 'closed',
  fillColor: 'rgba(83,162, 235, 0.5)',
  image: { id: '' },
  imageEvent: null,
  strokeColor: 'rgba(20,82,168,1)',
  strokeWidth: 2,
};

/**
 * Specific Tool state for the target SVG
 * @param imageZoom
 * @returns {{activeTool: string, closedMode: string, image: {id: null}, imageEvent: null,
 * strokeColor: string, strokeWidth: number}}
 */
export function getTargetSVGToolState(imageZoom) {
  return {
    activeTool: OVERLAY_TOOL.SHAPE,
    closedMode: 'closed',
    image: { id: null },
    imageEvent: null,
    strokeColor: 'rgba(255,0, 0, 0.5)',
    strokeWidth: 8 * imageZoom,
  };
}

export const TARGET_VIEW = 'target';
export const OVERLAY_VIEW = 'layer';
export const TAG_VIEW = 'tag';
export const MANIFEST_LINK_VIEW = 'link';

/** Split a second to { hours, minutes, seconds }  */
export function secondsToHMSarray(secs) {
  const h = Math.floor(secs / 3600);
  return {
    hours: h,
    minutes: Math.floor(secs / 60) - h * 60,
    seconds: secs % 60,
  };
}

/**
 * Checks if a given string is a valid URL.
 * @returns {boolean} - Returns true if the string is a valid URL, otherwise false.
 */
export const isValidUrl = (string) => {
  if (string === '' || string === undefined || string === null) {
    return true;
  }
  try {
    // eslint-disable-next-line no-new
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

/**
 * Get the current date in locale string format
 * @returns {string}
 */
function getCurrentDateLocaleString() {
  return new Date().toLocaleString([navigator.language], {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

/**
 * Save the annotation in the storage adapter
 * @param canvasId
 * @param storageAdapter
 * @param receiveAnnotation
 * @param annotation
 * @returns {Promise<void>}
 */
export async function saveAnnotationInStorageAdapter(
  canvasId,
  storageAdapter,
  receiveAnnotation,
  annotation,
) {
  if (annotation?.maeData) {
    if (annotation.id) {
      // eslint-disable-next-line no-param-reassign
      annotation.lastSavedDate = getCurrentDateLocaleString();
      // eslint-disable-next-line no-param-reassign
      annotation.lastEditor = storageAdapter.getStorageAdapterUser();
      console.log('Annotation to update', annotation);
      storageAdapter.update(annotation)
        .then((annoPage) => {
          receiveAnnotation(canvasId, storageAdapter.annotationPageId, annoPage);
        });
    } else {
      // eslint-disable-next-line no-param-reassign
      annotation.id = `${canvasId}/annotation/${uuidv4()}`;
      // eslint-disable-next-line no-param-reassign
      annotation.creationDate = getCurrentDateLocaleString();
      // eslint-disable-next-line no-param-reassign
      annotation.creator = storageAdapter.getStorageAdapterUser();
      if (annotation?.maeData?.manifestNetwork) {
        // Ugly tricks to solve manifest template annotation issue on creation
        // For more see NetworkCommentTemplate:saveFunction
        annotation.id = `${annotation.id}#${annotation.maeData.manifestNetwork}`;
      }
      console.log('Annotation to create', annotation);
      storageAdapter.create(annotation)
        .then((annoPage) => {
          receiveAnnotation(canvasId, storageAdapter.annotationPageId, annoPage);
        });
    }
  }
}

export const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  '&:first-of-type': {
    borderRadius: theme.shape.borderRadius,
  },
  '&:not(:first-of-type)': {
    borderRadius: theme.shape.borderRadius,
  },
  border: 'none',
  margin: theme.spacing(0.5),
}));
