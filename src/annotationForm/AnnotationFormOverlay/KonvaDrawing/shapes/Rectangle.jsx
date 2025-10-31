import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Rect, Transformer } from 'react-konva';
import { KONVA_MODE } from '../KonvaUtils';

/**
 * Represents a rectangle node component.
 * @returns {JSX.Element} The TextNode component.
 */
function Rectangle({
  activeTool,
  displayMode,
  handleDragEnd,
  handleDragStart,
  isSelected,
  onShapeClick,
  onTransform,
  shape,
}) {
  const shapeRef = useRef();
  const trRef = useRef();
  useEffect(() => {
    if (trRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()
        .batchDraw();
    }
  }, [isSelected]);


    useEffect(() => {
        const node = shapeRef.current;
        if (!node) return;
        // ensure node reflects latest props even if reconcilation is skipped
        node.setAttrs({ strokeWidth: shape.strokeWidth, stroke: shape.stroke, fill: shape.fill });
        node.getLayer()?.batchDraw();
    }, [shape.strokeWidth, shape.stroke, shape.fill]);

  /**
   * Handles the click event on the shape by invoking the provided callback function.
   * @function handleClick
   *- The shape object representing the properties of the clicked shape.
   * @returns {void}
   */
  const handleClick = () => {
    onShapeClick(shape);
  };

  console.log("shape strokeWidth", shape.strokeWidth);
  console.log("shape", shape);
  console.log("shapeRef",shapeRef)
  return (
    <>
      <Rect
          key={`${shape.id}-${shape.strokeWidth}`}
          dashEnabled={displayMode === KONVA_MODE.TARGET}
        draggable={activeTool === 'cursor' || activeTool === 'edit'}
        fill={shape.fill}
        height={shape.height}
        id={shape.id}
        onClick={handleClick}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        onMouseDown={handleClick}
        onTransform={onTransform}
        ref={shapeRef}
        scaleX={shape.scaleX}
        scaleY={shape.scaleY}
        stroke={shape.stroke}
        strokeScaleEnabled={false}
        strokeWidth={shape.strokeWidth}
        width={shape.width}
        x={shape.x || 0}
        y={shape.y || 0}
      />
      <Transformer
        rotateEnabled={displayMode !== 'target'}
        ref={trRef}
        visible={activeTool === 'edit' && isSelected}
      />
    </>
  );
}

Rectangle.propTypes = {
  activeTool: PropTypes.string.isRequired,
  baseStrokeWidth: PropTypes.number.isRequired,
  displayMode: PropTypes.string.isRequired,
  handleDragEnd: PropTypes.func.isRequired,
  handleDragStart: PropTypes.func.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onShapeClick: PropTypes.func.isRequired,
  onTransform: PropTypes.func.isRequired,
  shape: PropTypes.shape({
    fill: PropTypes.string,
    height: PropTypes.number,
    id: PropTypes.string,
    rotation: PropTypes.number,
    scaleX: PropTypes.number,
    scaleY: PropTypes.number,
    stroke: PropTypes.string,
    strokeWidth: PropTypes.number,
    text: PropTypes.string,
    type: PropTypes.string,
    width: PropTypes.number,
    x: PropTypes.number,
    y: PropTypes.number,
  }).isRequired,

};

export default Rectangle;
