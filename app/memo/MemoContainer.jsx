import React, { useEffect } from "react";
import Memo from "./Memo";
import PropTypes from "prop-types";

function MemoContainer({ memoData }) {
  useEffect(() => {
    vscode.postMessage({
      command: "load",
    });
  }, []);

  const makeMemos = (memos) => {
    return memos?.map((memo, index) => {
      return <Memo data={memo} key={memo.id} index={index}></Memo>
    });
  };

  return (
    <>
      <div>{makeMemos(memoData)}</div>
    </>
  )
}

export default MemoContainer;

MemoContainer.propTypes = {
  memoData: PropTypes.array,
};
