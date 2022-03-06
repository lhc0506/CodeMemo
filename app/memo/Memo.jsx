import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { HexColorPicker } from "react-colorful";

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
    vscode.postMessage({
      command: "changeColor",
      index,
      color,
    })
  },[color])

  const clickColorOutside = event => {
    if (colorRef.current && !colorRef.current.contains(event.target)) {
      setShowColor(false);
    }
  };

  if (isFocus) {
    inputFocus.current.focus();
  }

  const { id, path, line, contents, x, y } = data;
  const handleDeleteButton = () => {
    vscode.postMessage({
      command: "delete",
      index,
    });
  }

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
  }

  return (
    <div className="memo">
      <div className="color" onClick={handleShowColorButton}>color</div>
      <div className="delete" onClick={handleDeleteButton}>X</div>
      <div className="link" onClick={handleLinkButton}>go to Code</div>
      {showColor && <div className="color" ref={colorRef}><HexColorPicker color={color} onChange={setColor} /></div>}
      <textarea id={id} defaultValue={contents} onChange={handleOnChange} ref={inputFocus} style={{backgroundColor: data.color}}></textarea>
    </div>
  );
}

export default Memo;

Memo.propTypes = {
  data: PropTypes.object,
  index: PropTypes.number.isRequired,
  isFocus: PropTypes.bool.isRequired,
};
