import React, { useEffect, useCallback, useState } from "react";
import Memo from "./Memo";
import PropTypes from "prop-types";
import { useDrop } from "react-dnd";

function MemoContainer({ memoData, focus, setMemo }) {
  useEffect(() => {
    vscode.postMessage({
      command: "load",
    });
  }, []);

  const [boxes, setBoxes] = useState({
    a: { top: 20, left: 80, title: 'Drag me around' },
    b: { top: 180, left: 20, title: 'Drag me too' },
  });
  const moveBox = useCallback((index, x, y) => {
    vscode.postMessage({
      command: "drag",
      index,
      x,
      y,
    });
  }, [setMemo, memoData]);
  
  const [, drop] = useDrop(() => ({
      accept: "memo",
      drop(item, monitor) {
          const delta = monitor.getDifferenceFromInitialOffset();
          const left = Math.round(item.x + delta.x);
          const top = Math.round(item.y + delta.y);
          moveBox(item.index, left, top);
          return undefined;
      },
  }), [moveBox]);

  const makeMemos = (memos) => {
    return memos?.map((memo, index) => {
      return <Memo data={memo} key={memo.id} index={index} isFocus={index === focus} left={memo.x} top={memo.y} id={memo.id}></Memo>
    });
  };

  return (
    <>
      <div className="memoContainer" ref={drop}>{makeMemos(memoData)}</div>
    </>
  )
}

export default MemoContainer;

MemoContainer.propTypes = {
  memoData: PropTypes.array,
  focus: PropTypes.any,
  setMemo: PropTypes.func,
};
