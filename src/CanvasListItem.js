import React, {
  forwardRef, useContext, useMemo, useState,
} from 'react';
import PropTypes from 'prop-types';
import DeleteIcon from '@mui/icons-material/DeleteForever';
import EditIcon from '@mui/icons-material/Edit';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import flatten from 'lodash/flatten';
import AnnotationActionsContext from './AnnotationActionsContext';

// TODO missing TRAD
const CanvasListItem = forwardRef((props, ref) => {
  const [isHovering, setIsHovering] = useState(false);
  const context = useContext(AnnotationActionsContext);

  const annotationData = useMemo(() => {
    const { annotationid } = props;
    const {
      canvases,
      annotationsOnCanvases,
    } = context;
    let annotation;
    canvases.some((canvas) => {
      if (annotationsOnCanvases[canvas.id]) {
        Object.entries(annotationsOnCanvases[canvas.id])
          .forEach(([key, value]) => {
            if (value.json && value.json.items) {
              annotation = value.json.items.find((anno) => anno.id === annotationid);
              if (annotation) {
                return annotation;
              }
            }
          });
      }
      return (annotation);
    });
    return annotation;
  }, [props.annotationid]);

  /**
   * Function to handle mouse hover event.
   * @function handleMouseHover
   * @returns {void}
   */
  const handleMouseHover = () => {
    setIsHovering(!isHovering);
  };
  /**
   * Handle deletion of annotation.
   * @function
   * @name handleDelete
   * @returns {void}
   */
  const handleDelete = () => {
    const {
      canvases,
      receiveAnnotation,
      storageAdapter,
    } = context;
    const { annotationid } = props;
    canvases.forEach((canvas) => {
      const adapter = storageAdapter(canvas.id);
      adapter.delete(annotationid)
        .then((annoPage) => {
          receiveAnnotation(canvas.id, adapter.annotationPageId, annoPage);
        });
    });
  };
  /**
   * Handles editing of an annotation.
   * @function handleEdit
   * @returns {void}
   */
  const handleEdit = () => {
    const {
      addCompanionWindow,
    } = context;
    const { annotationid } = props;

    addCompanionWindow('annotationCreation', {
      annotationid,
      position: 'right',
    });
  };
  /**
   * Checks if a given annotation ID is editable.
   * @returns {boolean} Returns true if the annotation ID is editable, false otherwise.
   */
  const editable = () => {
    const {
      annotationsOnCanvases,
      canvases,
    } = context;
    const { annotationid } = props;
    const annoIds = canvases.map((canvas) => {
      if (annotationsOnCanvases[canvas.id]) {
        return flatten(Object.entries(annotationsOnCanvases[canvas.id])
          .map(([key, value]) => {
            if (value.json && value.json.items) {
              return value.json.items.filter((item) => item.maeData)
                .map((item) => item.id);
            }
            return [];
          }));
      }
      return [];
    });
    return flatten(annoIds)
      .includes(annotationid);
  };

  console.log('AnnotationData:', annotationData);

  const { t } = context;

  console.log('Props', props);
  console.log('props.children', props.children);

  return (
    <div
      onMouseEnter={handleMouseHover}
      onMouseLeave={handleMouseHover}
      className="mirador-annotation-list-item"
      ref={ref}
    >
      {isHovering && editable() && (
        <div
          style={{
            position: 'relative',
            top: -20,
            zIndex: 10000,
          }}
        >
          <ToggleButtonGroup
            aria-label="annotation tools"
            size="small"
            style={{
              backgroundColor: 'white',
              position: 'absolute',
              right: 0,
            }}
            disabled={!context.annotationEditCompanionWindowIsOpened}
          >
            <ToggleButton
              aria-label="Edit"
              onClick={context.windowViewType === 'single' ? handleEdit : context.toggleSingleCanvasDialogOpen}
              value="edit"
            >
              <EditIcon />
            </ToggleButton>
            <ToggleButton
              aria-label="Delete"
              onClick={handleDelete}
              value="delete"
            >
              <DeleteIcon />
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
      )}
      {
        annotationData?.creator && (
          <>
            {annotationData.creator}
            {', '}
            {annotationData.creationDate}
          </>
        )

      }
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <li {...props}>
        {props.children}
      </li>
    </div>
  );
});

CanvasListItem.propTypes = {
  annotationEditCompanionWindowIsOpened: PropTypes.bool.isRequired,
  annotationid: PropTypes.string.isRequired,
  children: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.node,
  ]).isRequired,
};

export default CanvasListItem;
