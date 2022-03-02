import React from "react";
import PropTypes from "prop-types";

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

function Memo({ data, index }) {
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

  return (
    <div className="memo">
      <div className="delete" onClick={handleDeleteButton}>X</div>
      <div className="link" onClick={handleLinkButton}>go to Code</div>
      <textarea id={id} defaultValue={contents} onChange={handleOnChange}></textarea>
    </div>
  );
}

export default Memo;

Memo.propTypes = {
  data: PropTypes.object,
  index: PropTypes.number.isRequired,
};
