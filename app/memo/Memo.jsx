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

  const handleDeleteButton = () => {
    vscode.postMessage({
      command: "delete",
      index,
    });
  };

  const handleInput = (event) => {
    debouncedPostMessage(index, event.target.innerHTML);
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

  const handleBoldButton = () => {
    document.execCommand("bold");
  };

  const handleStrikeButton = () => {
    document.execCommand("strikeThrough");
  };

  if (isFocus) {
    selectedMemo.current.focus();
  }

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
      <div className="memoHeader">
        <div className="color" onClick={handleShowColorButton}>color</div>
        <div className="bold" onClick={handleBoldButton}>B</div>
        <div className="strike" onClick={handleStrikeButton}>S</div>
        <div className="delete" onClick={handleDeleteButton}>X</div>
        <div className="link" onClick={handleLinkButton}>go to Code</div>
      </div>
      {showColor && (
        <div className="color" ref={colorRef}>
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
  index: PropTypes.number.isRequired,
  isFocus: PropTypes.bool.isRequired,
};
