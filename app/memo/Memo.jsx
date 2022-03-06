import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { HexColorPicker } from "react-colorful";
import { useDrag } from "react-dnd";

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

const debouncedPostMessage = debounce((index, contents) => vscode.postMessage({
  command: "update",
  index,
  contents,
}), 300);

function Memo({ data, index, isFocus }) {
  const { id, path, line, contents, x, y, width, height } = data;
  const inputFocus = useRef(null);
  const colorRef = useRef(null);
  const [showColor, setShowColor] = useState(false);
  const [color, setColor] = useState("#b32aa9");
  useEffect(() => {
    document.addEventListener("mousedown", clickColorOutside);

    return () => {
      document.removeEventListener("mousedown", clickColorOutside);
    };
  },[]);

  useEffect(() => {
    if (showColor) {
      vscode.postMessage({
        command: "changeColor",
        index,
        color,
      });
    }
  }, [color]);

  const clickColorOutside = event => {
    if (colorRef.current && !colorRef.current.contains(event.target)) {
      setShowColor(false);
    }
  };

  const [{ isDragging }, drag] = useDrag(() => ({
    type: "memo",
    item: { index, x, y },
    collect: (monitor) => ({
        isDragging: monitor.isDragging(),
    }),
  }), [index, x, y]);

  if (isFocus) {
    inputFocus.current.focus();
  }

  const handleDeleteButton = () => {
    vscode.postMessage({
      command: "delete",
      index,
    });
  };

  const handleOnChange = (event) => {
    debouncedPostMessage(index, event.target.value);
  };

  const handleLinkButton = () => {
    vscode.postMessage({
      command: "link",
      path,
      line,
    });
  };

  const handleShowColorButton = () => {
    setShowColor(true);
  };

  const handleResize = (event) => {
    const { offsetWidth, offsetHeight } = event.target;
    if (width !== offsetWidth || height !== offsetHeight) {
      vscode.postMessage({
        command: "resize",
        index,
        width: offsetWidth,
        height: offsetHeight,
      });
    }
  };

  return (
    <div
      className="memo"
      ref={drag}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: "move",
        left: `${x}px`,
        top: `${y}px`,
        backgroundColor: data.color,
      }}
    >
      <div className="color" onClick={handleShowColorButton}>color</div>
      <div className="delete" onClick={handleDeleteButton}>X</div>
      <div className="link" onClick={handleLinkButton}>go to Code</div>
      {showColor && (
        <div className="color" ref={colorRef}>
          <HexColorPicker color={color} onChange={setColor} />
        </div>
      )}
      <textarea
        id={id}
        defaultValue={contents}
        onChange={handleOnChange}
        onMouseUp={handleResize}
        ref={inputFocus}
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
  index: PropTypes.number.isRequired,
  isFocus: PropTypes.bool.isRequired,
};
