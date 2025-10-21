import React, {
  forwardRef, useContext, useState,
} from 'react';
import PropTypes from 'prop-types';
import DeleteIcon from '@mui/icons-material/DeleteForever';
import EditIcon from '@mui/icons-material/Edit';
import ToggleButton from '@mui/material/ToggleButton';
import SettingsIcon from '@mui/icons-material/Settings';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import flatten from 'lodash/flatten';
import { Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import InfoIcon from '@mui/icons-material/Info';
import AnnotationActionsContext from './AnnotationActionsContext';
import WhoAndWhenFormSection, { TOOLTIP_MODE } from './annotationForm/WhoAndWhenFormSection';

const CanvasListItem = forwardRef((rawProps, ref) => {
  const [isHovering, setIsHovering] = useState(false);
  const context = useContext(AnnotationActionsContext);
  const { t } = useTranslation();

  const {
    children,
    annotationid,
    annotationEditCompanionWindowIsOpened,
    tReady,
    t: _t,
    i18n,
    ...props
  } = rawProps;

  /**
     * Deletes the current annotation from all canvases.
     *
     * Iterates over each canvas, retrieves its storage adapter,
     * calls `adapter.delete(annotationid)`, then updates
     * the annotation page in the global Mirador store through `receiveAnnotation`.
     *
     * Side effects:
     * - Removes the annotation from persistent storage (via adapter)
     * - Dispatches an update to refresh the annotations in state
     */
  const handleDelete = () => {
    const { canvases, receiveAnnotation, storageAdapter } = context;
    canvases.forEach((canvas) => {
      const adapter = storageAdapter(canvas.id);
      adapter.delete(annotationid).then((annoPage) => {
        receiveAnnotation(canvas.id, adapter.annotationPageId, annoPage);
      });
    });
  };

  /**
     * Opens the annotation editing panel for the current annotation.
     *
     * Creates or focuses a companion window of type `'annotationCreation'`
     * positioned to the right of the viewer, providing editing controls
     * for the annotation identified by `annotationid`.
     */
  const handleEdit = () => {
    const { addCompanionWindow } = context;
    addCompanionWindow('annotationCreation', { annotationid, position: 'right' });
  };

  /**
     * Determines if the annotation corresponding to `annotationid`
     * is user-editable within the current viewer context.
     *
     * Searches all canvases for annotations containing `maeData` metadata.
     * Returns `true` if the target annotation is among those editable items.
     *
     * @returns {boolean} Whether the annotation is editable by the user.
     */
  const editable = () => {
    const { annotationsOnCanvases, canvases } = context;
    const annoIds = canvases.map((canvas) => {
      if (annotationsOnCanvases[canvas.id]) {
        return flatten(
          Object.entries(annotationsOnCanvases[canvas.id]).map(([, value]) => {
            if (value.json && value.json.items) {
              return value.json.items.filter((item) => item.maeData).map((item) => item.id);
            }
            return [];
          }),
        );
      }
      return [];
    });
    return flatten(annoIds).includes(annotationid);
  };

  return (
    <div
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className="mirador-annotation-list-item"
      data-testid="mirador-annotation-list-item"
      ref={ref}
    >
      {(isHovering && editable()) && (
        <div>
          <ToggleButtonGroup
            aria-label="annotation tools"
            size="small"
            style={{
              backgroundColor: 'white',
              position: 'absolute',
              right: 0,
              zIndex: 10000,
            }}
          >
            {context.config?.debug && (
            <Tooltip title={t('debugAnnotation')}>
              <span>
                <ToggleButton
                  aria-label="Debug"
                  onClick={() => console.log(annotationid)}
                  value="debug"
                >
                  <SettingsIcon />
                </ToggleButton>
              </span>
            </Tooltip>
            )}

            {!!context && !!annotationid && !!context?.annotationsOnCanvases && (
            <Tooltip
              title={(
                <WhoAndWhenFormSection
                  creator={context.creator}
                  creationDate={context.creationDate}
                  lastEditor={context.lastEditor}
                  lastSavedDate={context.lastSavedDate}
                  displayMode={TOOLTIP_MODE}
                  t={t}
                />
                                )}
            >
              <span>
                <ToggleButton aria-label="Metadata" value="metadata">
                  <InfoIcon />
                </ToggleButton>
              </span>
            </Tooltip>
            )}

            {context.config?.annotation?.readonly !== true && [
              <Tooltip title={t('edit_annotation')} key="edit">
                <span>
                  <ToggleButton
                    aria-label="Edit"
                    onClick={
                          context.windowViewType === 'single'
                            ? handleEdit
                            : context.toggleSingleCanvasDialogOpen
                      }
                    value="edit"
                    disabled={!context.annotationEditCompanionWindowIsOpened}
                  >
                    <EditIcon />
                  </ToggleButton>
                </span>
              </Tooltip>,

              <Tooltip title={t('deleteAnnotation')} key="delete">
                <span>
                  <ToggleButton
                    aria-label="Delete"
                    onClick={handleDelete}
                    value="delete"
                    disabled={!context.annotationEditCompanionWindowIsOpened}
                  >
                    <DeleteIcon />
                  </ToggleButton>
                </span>
              </Tooltip>,
            ]}
          </ToggleButtonGroup>
        </div>
      )}
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <li {...props}>
        {children}
      </li>
    </div>
  );
});

CanvasListItem.propTypes = {
  annotationEditCompanionWindowIsOpened: PropTypes.bool.isRequired,
  annotationid: PropTypes.string.isRequired,
  children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]).isRequired,
};

export default CanvasListItem;
