import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { HexColorPicker } from "react-colorful";
import { vscodeFunctions } from "./utils";

function debounce(fn, wait) {
  let lastTimeoutId = null;

  return (...args) => {
    if (lastTimeoutId) {
      clearTimeout(lastTimeoutId);
      lastTimeoutId = null;
    }
    lastTimeoutId = setTimeout(() => {
      fn(...args);
      lastTimeoutId = null;
    }, wait);
  };
}

function Memo({ data, index, isFocus, vscodeFunc }) {
  const { id, path, line, contents, x, y, width, height, zIndex } = data;
  const selectedMemo = useRef(null);
  const colorRef = useRef(null);
  const [showColor, setShowColor] = useState(false);
  const [color, setColor] = useState("#b32aa9");
  const defaultValue = useRef(contents);

  useEffect(() => {
    document.addEventListener("mousedown", clickColorOutside);

    return () => {
      document.removeEventListener("mousedown", clickColorOutside);
    };
  },[]);

  useEffect(() => {
    if (showColor) {
      debounce(vscodeFunc.changeColor(index, color), 300);
    }
  }, [color]);

  const clickColorOutside = event => {
    if (colorRef.current && !colorRef.current.contains(event.target)) {
      setShowColor(false);
    }
  };

  const handleDeleteButton = () => {
    vscodeFunc.deleteMemo(index);
  };

  const handleInput = (event) => {
    debounce(vscodeFunc.update(index, event.target.innerHTML), 300);
  };

  const handleLinkButton = () => {
    vscodeFunc.linkToCode(path, line, id);
  };

  const handleShowColorButton = () => {
    setShowColor(true);
  };

  const handleResize = (event) => {
    const { offsetWidth, offsetHeight } = event.target;
    if (width !== offsetWidth || height !== offsetHeight) {
      vscodeFunc.resize(index, offsetWidth, offsetHeight);
    }
  };

  const handleBoldButton = () => {
    document.execCommand("bold");
  };

  const handleStrikeButton = () => {
    document.execCommand("strikeThrough");
  };

  const handleDrag = (event) => {
    event.dataTransfer.setData("Index", index);
    event.dataTransfer.setData("OffsetX", event.nativeEvent.offsetX);
    event.dataTransfer.setData("OffsetY", event.nativeEvent.offsetY);
    event.target.style.opacity = "0.4";
  };

  const handleDrop = (event) => {
    event.stopPropagation();
    const index = event.dataTransfer.getData("Index");
    const offsetX = event.dataTransfer.getData("OffsetX");
    const offsetY = event.dataTransfer.getData("OffsetY");
    const memoContainer = document.querySelector(".memoContainer");
    const rect = memoContainer.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const xCoordinate = x - offsetX;
    const yCoordinate = y - offsetY;
    vscodeFunctions.dragMemo(index, xCoordinate, yCoordinate);
  };

  if (isFocus) {
    selectedMemo.current?.focus();
  }

  return (
    <div
      className="memo"
      style={{
        zIndex,
        left: x,
        top: y,
        backgroundColor: data.color,
      }}
      draggable="true"
      onDragStart={handleDrag}
      onDragEnd={(event) => event.target.style.opacity = "1"}
      onDrop={handleDrop}
      id={"drag" + id}
    >
      <div className="memoHeader">
        <div className="color" onClick={handleShowColorButton}>color</div>
        <div className="bold" onClick={handleBoldButton}>B</div>
        <div className="strike" onClick={handleStrikeButton}>S</div>
        <div className="delete" onClick={handleDeleteButton}>X</div>
        <div className="link" onClick={handleLinkButton}>go to Code</div>
      </div>
      {showColor && (
        <div className="color" ref={colorRef} title="color">
          <HexColorPicker color={color} onChange={setColor} />
        </div>
      )}
      <div
        className="contents"
        id={id}
        contentEditable
        dangerouslySetInnerHTML={{ __html: defaultValue.current }}
        onMouseUp={handleResize}
        onInput={handleInput}
        ref={selectedMemo}
        style={{
          backgroundColor: data.color,
          width,
          height,
        }}
      />
    </div>
  );
}

export default Memo;

Memo.propTypes = {
  data: PropTypes.object,
  index: PropTypes.number,
  isFocus: PropTypes.bool.isRequired,
  vscodeFunc: PropTypes.object.isRequired,
};
