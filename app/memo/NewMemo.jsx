import React, { useState } from "react";
import PropTypes from "prop-types";

function NewMemo({ data, handleOnClick }) {
  const [contents, setContents] = useState("");

  return (
    <>
      <div className="newMemoContainer">
        <h2>New Memo</h2>
        <div>file: {data.path}</div>
        <div>position: line {data.line}</div>
        <div>notes:</div>
          <div>
            <textarea value={contents} id="notes" maxLength="100" autoFocus placeholder="Write your memo" onChange={(event) => setContents(event.target.value) }></textarea>
          </div>
          <div className="buttonContainer">
          <button onClick={() => handleOnClick(data, contents)}>Save</button>
          </div>
      </div>
    </>
  );
}

export default NewMemo;

NewMemo.propTypes = {
  data: PropTypes.object.isRequired,
  handleOnClick: PropTypes.func.isRequired,
}
