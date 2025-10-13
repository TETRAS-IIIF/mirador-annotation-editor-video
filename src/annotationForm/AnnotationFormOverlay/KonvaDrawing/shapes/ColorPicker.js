import {
  ClickAwayListener,
  Divider,
  Grid,
  MenuItem,
  MenuList,
  Popover,
  Tooltip,
} from '@mui/material';
import Typography from '@mui/material/Typography';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import StrokeColorIcon from '@mui/icons-material/BorderColor';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import LineWeightIcon from '@mui/icons-material/LineWeight';
import FormatColorFillIcon from '@mui/icons-material/FormatColorFill';
import { SketchPicker } from 'react-color';
import React from 'react';
import { styled } from '@mui/material/styles';
import * as Proptypes from 'prop-types';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { defaultLineWeightChoices, OVERLAY_TOOL } from '../KonvaUtils';

/** Display color picker and border * */
export default function ColorPicker({
  closeChooseColor,
  currentColor,
  handleCloseLineWeight,
  handleLineWeightSelect,
  openChooseColor,
  openChooseLineWeight,
  toolOptions,
  toolState,
  updateColor,
}) {
  const { t } = useTranslation();

  return (
    <Grid container spacing={1}>
      <Grid item size={{ xs: 12 }}>
        <Typography variant="overline">
          {t('style')}
        </Typography>
      </Grid>

      <Grid item size={{ xs: 12 }}>
        <ToggleButtonGroup aria-label={t('style_selection')} size="small">
          {toolState.activeTool !== OVERLAY_TOOL.TEXT && [
            <ToggleButton
              key="strokeColor"
              value="strokeColor"
              aria-label={t('border_color')}
              onClick={openChooseColor}
            >
              <Tooltip title={t('border_color')}>
                <span>
                  <StrokeColorIcon style={{ fill: toolState.strokeColor }} />
                </span>
              </Tooltip>
              <ArrowDropDownIcon />
            </ToggleButton>,
            <ToggleButton
              key="lineWeight"
              value="lineWeight"
              aria-label={t('line_weight')}
              onClick={openChooseLineWeight}
            >
              <Tooltip title={t('line_weight')}>
                <span>
                  <LineWeightIcon />
                </span>
              </Tooltip>
              <ArrowDropDownIcon />
            </ToggleButton>,
          ]}

          <ToggleButton
            value="fillColor"
            aria-label={t('fill_color')}
            onClick={openChooseColor}
          >
            <Tooltip title={t('fill_color')}>
              <span>
                <FormatColorFillIcon style={{ fill: toolState.fillColor }} />
              </span>
            </Tooltip>
            <ArrowDropDownIcon />
          </ToggleButton>
        </ToggleButtonGroup>
      </Grid>

      <Popover
        open={toolOptions.lineWeightPopoverOpen}
        anchorEl={toolOptions.popoverLineWeightAnchorEl}
      >
        <div>
          <ClickAwayListener onClickAway={handleCloseLineWeight}>
            <MenuList autoFocus role="listbox">
              {defaultLineWeightChoices.map((option) => (
                <MenuItem
                  key={option}
                  onClick={handleLineWeightSelect}
                  value={option}
                  selected={option === toolState.strokeWidth}
                  role="option"
                  aria-selected={option === toolState.strokeWidth}
                >
                  {option}
                </MenuItem>
              ))}
            </MenuList>
          </ClickAwayListener>
        </div>
      </Popover>

      <Popover
        open={toolOptions.colorPopoverOpen}
        anchorEl={toolOptions.popoverAnchorEl}
        onClose={closeChooseColor}
      >
        <SketchPicker
          disableAlpha={false}
          color={currentColor}
          onChange={updateColor}
        />
      </Popover>
    </Grid>
  );
}

const StyledDivider = styled(Divider)(({ theme }) => ({
  margin: theme.spacing(1, 0.5),
}));

ColorPicker.propTypes = {
  closeChooseColor: Proptypes.func.isRequired,
  currentColor: Proptypes.string.isRequired,
  handleCloseLineWeight: Proptypes.func.isRequired,
  handleLineWeightSelect: Proptypes.func.isRequired,
  openChooseColor: Proptypes.func.isRequired,
  openChooseLineWeight: Proptypes.func.isRequired,
  toolOptions: Proptypes.shape({
    colorPopoverOpen: PropTypes.bool,
    currentColorType: PropTypes.any,
    lineWeightPopoverOpen: PropTypes.bool,
    popoverAnchorEl: PropTypes.any,
    popoverLineWeightAnchorEl: PropTypes.any,
  }).isRequired,
  toolState: PropTypes.shape({
    activeTool: PropTypes.string.isRequired,
    closedMode: PropTypes.string.isRequired,
    fillColor: PropTypes.string,
    image: PropTypes.shape({
      id: PropTypes.string,
    }),
    strokeColor: PropTypes.string.isRequired,
    strokeWidth: PropTypes.number.isRequired,
    text: PropTypes.string,
    textBody: PropTypes.string,
    updateColor: PropTypes.func,
  }).isRequired,
  updateColor: Proptypes.func.isRequired,
};
