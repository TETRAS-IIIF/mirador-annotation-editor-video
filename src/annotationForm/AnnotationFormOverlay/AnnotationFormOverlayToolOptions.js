import { Button, Grid, TextField } from '@mui/material';
import Typography from '@mui/material/Typography';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import { v4 as uuidv4 } from 'uuid';
import {
  isShapesTool,
  KONVA_MODE,
  objToRgba,
  OVERLAY_TOOL,
  rgbaToObj,
  SHAPES_TOOL,
} from './KonvaDrawing/KonvaUtils';
import ColorPicker from './KonvaDrawing/shapes/ColorPicker';
import ImageFormField from './ImageFormField';

const StyledDivButtonImage = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: '5px',
}));

/** All the tools options for the overlay options */
function AnnotationFormOverlayToolOptions({
  currentShape,
  displayMode,
  setToolState,
  t,
  toolState,
}) {
  // set toolOptionsValue
  const [toolOptions, setToolOptions] = useState({
    colorPopoverOpen: false,
    currentColorType: null,
    lineWeightPopoverOpen: false,
    popoverAnchorEl: null,
    popoverLineWeightAnchorEl: null,
  });

  // Set unused default color to avoid error on render
  const currentColor = toolOptions.currentColorType ? rgbaToObj(toolState[toolOptions.currentColorType]) : 'rgba(255, 0, 0, 0.5)';

  // Fonction to manage option displaying
  /** */
  const openChooseLineWeight = (e) => {
    setToolOptions({
      ...toolOptions,
      lineWeightPopoverOpen: true,
      popoverLineWeightAnchorEl: e.currentTarget,
    });
  };

  /** */
  const handleLineWeightSelect = (e) => {
    setToolOptions({
      ...toolOptions,
      lineWeightPopoverOpen: false,
      popoverLineWeightAnchorEl: null,
    });
    setToolState({
      ...toolState,
      strokeWidth: e.currentTarget.value,
    });
  };

  /** Close color popover window */
  const closeChooseColor = (e) => {
    setToolOptions({
      ...toolOptions,
      colorPopoverOpen: false,
      currentColorType: null,
      popoverAnchorEl: null,
    });
  };

  /** */
  const openChooseColor = (e) => {
    setToolOptions({
      ...toolOptions,
      colorPopoverOpen: true,
      currentColorType: e.currentTarget.value,
      popoverAnchorEl: e.currentTarget,
    });
  };

  /** */
  const handleCloseLineWeight = (e) => {
    setToolOptions({
      ...toolOptions,
      lineWeightPopoverOpen: false,
      popoverLineWeightAnchorEl: null,
    });
  };

  /**  closed mode change */
  const changeClosedMode = (e) => {
    setToolState({
      ...toolState,
      closedMode: e.currentTarget.value,
    });
  };

  /** Update color : fillColor or strokeColor */
  const updateColor = (color) => {
    setToolState({
      ...toolState,
      [toolOptions.currentColorType]: objToRgba(color.rgb),
    });
  };

  /** Handle text change from AnnotationFormOverlayToolOption * */
  const handleTextChange = (e) => {
    const text = e.target.value;
    setToolState(
      {
        ...toolState,
        text,
      },
    );
  };

  /** Handle Image Change * */
  const handleImgChange = (newUrl, imgRef) => {
    setToolState({
      ...toolState,
      image: {
        ...toolState.image,
        id: newUrl,
      },
    });
  };
  /** Handle Image into toolstate * */
  const addImage = () => {
    const data = {
      id: toolState?.image?.id,
      uuid: uuidv4(),
    };

    setToolState({
      ...toolState,
      image: { id: null },
      imageEvent: data,
    });
  };

  const showImageTool = false;

  return (
    <div>
      {
        (displayMode === KONVA_MODE.DRAW && isShapesTool(toolState.activeTool)) && (
          <Grid container>
            <ColorPicker
              currentColor={currentColor}
              changeClosedMode={changeClosedMode}
              closeChooseColor={closeChooseColor}
              handleCloseLineWeight={handleCloseLineWeight}
              handleLineWeightSelect={handleLineWeightSelect}
              openChooseColor={openChooseColor}
              openChooseLineWeight={openChooseLineWeight}
              updateColor={updateColor}
              t={t}
              toolOptions={toolOptions}
              toolState={toolState}
            />
          </Grid>
        )
      }
      {
        toolState.activeTool === OVERLAY_TOOL.TEXT && (
          <Grid container direction="column" spacing={1}>
            <Grid item>
              <Typography variant="overline">
                {t('text')}
              </Typography>
            </Grid>
            {currentShape ? (
              <>
                <Grid item>
                  <TextField
                    value={toolState.text}
                    placeholder={t('text')}
                    fullWidth
                    onChange={handleTextChange}
                  />
                </Grid>
                <Grid item>
                  <ColorPicker
                    changeClosedMode={changeClosedMode}
                    closeChooseColor={closeChooseColor}
                    currentColor={currentColor}
                    handleCloseLineWeight={handleCloseLineWeight}
                    handleLineWeightSelect={handleLineWeightSelect}
                    openChooseColor={openChooseColor}
                    openChooseLineWeight={openChooseLineWeight}
                    t={t}
                    toolOptions={toolOptions}
                    toolState={toolState}
                    updateColor={updateColor}
                  />
                </Grid>
              </>
            ) : (
              <Grid item>
                <Typography>{t('click_on_canvas_to_write')}</Typography>
              </Grid>
            )}
          </Grid>
        )
      }
      {
        showImageTool && (
          <>
            <Typography variant="overline">
              {t('add_image_from_url')}
            </Typography>
            <Grid container>
              <ImageFormField
                xs={8}
                imageUrl={toolState.image.id}
                onChange={handleImgChange}
                t={t}
              />
            </Grid>
            <StyledDivButtonImage>
              <Button variant="contained" onClick={addImage}>
                <AddPhotoAlternateIcon />
              </Button>
            </StyledDivButtonImage>
          </>
        )
      }
      {
        toolState.activeTool === SHAPES_TOOL.POLYGON && (
          <Typography>
            {t('pressEscapeToFinish')}
          </Typography>
        )
      }
    </div>
  );
}

AnnotationFormOverlayToolOptions.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  currentShape: PropTypes.object.isRequired,
  displayMode: PropTypes.string.isRequired,
  setToolState: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  toolState: PropTypes.shape({
    activeTool: PropTypes.string.isRequired,
    closedMode: PropTypes.bool.isRequired,
    fillColor: PropTypes.string.isRequired,
    image: PropTypes.shape({
      id: PropTypes.string,
    }),
    strokeColor: PropTypes.string.isRequired,
    strokeWidth: PropTypes.number.isRequired,
    text: PropTypes.string,
    textBody: PropTypes.string,
    updateColor: PropTypes.func.isRequired,
  }).isRequired,
};

export default AnnotationFormOverlayToolOptions;
