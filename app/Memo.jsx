import React from "react";
import PropTypes from "prop-types";

function Memo({ data }) {
  const { id, path, line, contents, x, y } = data;
  return <textarea id={id} defaultValue={contents}></textarea>
}

export default Memo;

Memo.propTypes = {
  data: PropTypes.object,
};
