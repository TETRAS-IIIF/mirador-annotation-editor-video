import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Arrow, Transformer } from 'react-konva';

/**
 * Represents a arrow node component.
 * @returns {JSX.Element} The TextNode component.
 */function ArrowNode({
  onShapeClick,
  baseStrokeWidth,
  shape,
  activeTool,
  isSelected,
  onTransform,
  handleDragEnd,
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

  /**
   * Handles the click event on the shape by invoking the provided callback function.
   * @function handleClick
   *- The shape object representing the properties of the clicked shape.
   * @returns {void}
   */
  const handleClick = () => {
    onShapeClick(shape);
  };

  const strokeWidth = baseStrokeWidth + shape.strokeWidth;

  return (
    <>
      <Arrow
        ref={shapeRef}
        fill={shape.fill}
        scaleX={shape.scaleX}
        scaleY={shape.scaleY}
        rotation={shape.rotation}
        x={shape.x}
        y={shape.y}
        stroke={shape.stroke}
        strokeWidth={strokeWidth}
        points={shape.points}
        id={shape.id}
        draggable={activeTool === 'cursor' || activeTool === 'edit'}
        onClick={handleClick}
        onMousedown={handleClick}
        pointerLength={shape.pointerLength}
        pointerWidth={shape.pointerWidth}
        onTransform={onTransform}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragEnd}
      />
      <Transformer
        ref={trRef}
        visible={activeTool === 'edit' && isSelected}
      />
    </>
  );
}

ArrowNode.propTypes = {
  activeTool: PropTypes.string.isRequired,
  baseStrokeWidth: PropTypes.number.isRequired,
  handleDragEnd: PropTypes.func.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onShapeClick: PropTypes.func.isRequired,
  onTransform: PropTypes.func.isRequired,
  shape: PropTypes.shape({
    fill: PropTypes.string,
    id: PropTypes.string,
    pointerLength: PropTypes.number,
    pointerWidth: PropTypes.number,
    points: PropTypes.arrayOf(PropTypes.number),
    rotation: PropTypes.number,
    scaleX: PropTypes.number,
    scaleY: PropTypes.number,
    stroke: PropTypes.string,
    strokeWidth: PropTypes.number,
    type: PropTypes.string,
    url: PropTypes.string,
    x: PropTypes.number,
    y: PropTypes.number,
  }).isRequired,
};

export default ArrowNode;
