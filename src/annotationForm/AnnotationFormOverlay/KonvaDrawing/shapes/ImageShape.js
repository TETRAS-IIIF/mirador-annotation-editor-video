import React, { useEffect, useRef, useState } from 'react';
import PropTypes, { number } from 'prop-types';
import { Image, Transformer } from 'react-konva';

/**
 * Represents a image shape component.
 * @returns {JSX.Element} The TextNode component.
 */
function ImageShape({
  activeTool,
  displayMode,
  handleDragEnd,
  handleDragStart,
  isSelected,
  onShapeClick,
  onTransform,
  shape,
}) {
  const imageRef = useRef(null);
  const trRef = useRef(null);
  const [image, setImage] = useState(null);

  useEffect(() => {
    if (isSelected && trRef.current && imageRef.current) {
      trRef.current.nodes([imageRef.current]);
      trRef.current.getLayer()
        .batchDraw();
    }
  }, [isSelected, image]);

  useEffect(() => {
    const img = new window.Image();
    img.src = shape.url;
    img.onload = () => {
      setImage(img);
    };
  }, [shape.url]);
  /**
   * Handles the click event on the shape by invoking the provided callback function.
   * @function handleClick
   *- The shape object representing the properties of the clicked shape.
   * @returns {void}
   */
  const handleClick = () => {
    onShapeClick(shape);
  };

  return (
    <>
      <Image
        ref={imageRef}
        scaleX={shape.scaleX}
        scaleY={shape.scaleY}
        rotation={shape.rotation}
        x={shape.x}
        y={shape.y}
        image={image}
        id={shape.id}
        draggable={activeTool === 'cursor' || activeTool === 'edit'}
        onClick={handleClick}
        onMousedown={handleClick}
        onTransform={onTransform}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
      />

      {isSelected && (
        <Transformer
          rotateEnabled={displayMode !== 'image'}
          ref={trRef}
          visible={activeTool === 'edit'}
        />
      )}
    </>
  );
}

ImageShape.propTypes = {
  activeTool: PropTypes.string.isRequired,
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
    lines: PropTypes.arrayOf({
      points: PropTypes.arrayOf(number),
      stroke: PropTypes.string,
      strokeWidth: PropTypes.number,
      x: PropTypes.number,
      y: PropTypes.number,
    }),
    rotation: PropTypes.number,
    scaleX: PropTypes.number,
    scaleY: PropTypes.number,
    stroke: PropTypes.string,
    strokeWidth: PropTypes.number,
    type: PropTypes.string,
    url: PropTypes.string,
    width: PropTypes.number,
    x: PropTypes.number,
    y: PropTypes.number,
  }).isRequired,
};
export default ImageShape;
