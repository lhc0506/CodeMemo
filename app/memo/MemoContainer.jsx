import React, { useEffect, useCallback, useRef, useState } from "react";
import Memo from "./Memo";
import PropTypes from "prop-types";
import { useDrop } from "react-dnd";

const showAllMemos = (memos, focus) => {
  return memos?.map((memo, index) => {
    return <Memo data={memo} key={memo.id} index={index} isFocus={index === focus} left={memo.x} top={memo.y} id={memo.id}></Memo>
  });
};

const showFiles = (files) => {
  return files?.map((file) => {
    return <option value={file} key={file}>{file}</option>
  });
};

const showMemosInFile = (memos, fileName) => {
  const memosInFile = memos.filter((memo) => memo.path.endsWith(fileName));
  return memosInFile.map((memoInFile) => {
    const index = memos.findIndex((memo) => memo === memoInFile);
    return <Memo data={memoInFile} key={memoInFile.id} index={index} left={memoInFile.x} top={memoInFile.y} id={memoInFile.id}></Memo>
  });
};

function MemoContainer({ memoData, focus, setMemo }) {
  const [fileOption, setFileOption] = useState("all");
  const[files, setFiles] = useState();
  const fileOptionRef = useRef(null);
  const pathSet = new Set();
  useEffect(() => {
    vscode.postMessage({
      command: "load",
    });
  }, []);

  const moveBox = useCallback((index, x, y) => {
    vscode.postMessage({
      command: "drag",
      index,
      x,
      y,
    });
  }, [setMemo, memoData]);

  useEffect(() => {
    if (!memoData) return;

    memoData.forEach((memo) => {
      const pathArray = memo.path.split("/");
      pathSet.add(pathArray[pathArray.length - 2] + "/" +pathArray[pathArray.length - 1]);
    });

    setFiles(Array.from(pathSet));
  }, [memoData]);

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



  const handleOnChange = (event) => {
    setFileOption(event.target.value);
  };

  return (
    <>
      <select name="files" id="file-select" ref={fileOptionRef} onChange={handleOnChange}>
        <option value="all">All</option>
        {showFiles(files)}
      </select>
      {fileOption === "all" && <div className="memoContainer" ref={drop}>{showAllMemos(memoData, focus)}</div>}
      {fileOption !== "all" && <div className="memoContainer" ref={drop}>{showMemosInFile(memoData, fileOption)}</div>}
    </>
  );
}

export default MemoContainer;

MemoContainer.propTypes = {
  memoData: PropTypes.array,
  focus: PropTypes.any,
  setMemo: PropTypes.func,
};
