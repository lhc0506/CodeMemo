import React, { useState } from "react";
import { useSelector } from "react-redux";

function NewMemo() {
  const [contents, setContents] = useState("");
  const data = useSelector((state) => state.memo.newMemo);
  const handleOnClick = () => {
    vscode.postMessage({
      data,
      contents,
      command: "save",
    });
  };

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
          <button onClick={handleOnClick}>Save</button>
          </div>
      </div>
    </>
  );
}

export default NewMemo;
