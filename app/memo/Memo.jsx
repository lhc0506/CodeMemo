import React from "react";
import PropTypes from "prop-types";

function Memo({ data }) {
  const { id, path, line, contents, x, y } = data;

  return (
    <div style={{ position: "relative", display: "inline-block"}}>
      <button style={{
        position: "absolute",
        width: "20px",
        height: "20px",
        top: 0,
        right: 0
      }}>
        save
      </button>
      <textarea id={id} defaultValue={contents}></textarea>
    </div>
  );
}

export default Memo;

Memo.propTypes = {
  data: PropTypes.object,
};
