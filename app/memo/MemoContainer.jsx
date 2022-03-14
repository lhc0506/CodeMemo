import React, { useEffect, useRef, useState } from "react";
import Memo from "./Memo";
import PropTypes from "prop-types";
import { vscodeFunctions } from "./utils";

const showAllMemos = (memos, focus) => {
  return memos?.map((memo, index) => {
    return <Memo data={memo} key={memo.id} index={index} isFocus={index === focus} left={memo.x} top={memo.y} id={memo.id} vscodeFunc={vscodeFunctions}/>;
  });
};

const showFiles = (files) => {
  return files?.map((file) => {
    return <option value={file} key={file}>{file}</option>;
  });
};

const showMemosInFile = (memos, fileName) => {
  const memosInFile = memos.filter((memo) => memo.path.endsWith(fileName));
  return memosInFile.map((memoInFile) => {
    const index = memos.findIndex((memo) => memo === memoInFile);
    return <Memo data={memoInFile} key={memoInFile.id} index={index} left={memoInFile.x} top={memoInFile.y} id={memoInFile.id} vscodeFunc={vscodeFunctions} />;
  });
};

function MemoContainer({ memoData, focus }) {
  const [fileOption, setFileOption] = useState("all");
  const[files, setFiles] = useState();
  const fileOptionRef = useRef(null);
  const pathSet = new Set();

  useEffect(() => {
    vscodeFunctions.loadData();
  }, []);

  useEffect(() => {
    if (!memoData) return;

    memoData.forEach((memo) => {
      const pathArray = memo.path.split("/");
      pathSet.add(pathArray[pathArray.length - 2] + "/" +pathArray[pathArray.length - 1]);
    });

    setFiles(Array.from(pathSet));
  }, [memoData]);

  const handleOnChange = (event) => {
    setFileOption(event.target.value);
  };

  const drop = (event) => {
    event.preventDefault();
    const index = event.dataTransfer.getData("Index");
    const offsetX = event.dataTransfer.getData("OffsetX");
    const offsetY = event.dataTransfer.getData("OffsetY");
    const rect = event.target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const xCoordinate = x - offsetX;
    const yCoordinate = y - offsetY;
    vscodeFunctions.dragMemo(index, xCoordinate, yCoordinate);
  }

  const drageOver = (event) => {
    event.preventDefault();
  }

  return (
    <>
      <select name="files" id="file-select" ref={fileOptionRef} onChange={handleOnChange}>
        <option value="all">All</option>
        {showFiles(files)}
      </select>
      {fileOption === "all" && (
        <div
          className="memoContainer"
          onDragOver={drageOver}
          onDrop={drop}
        >
          {showAllMemos(memoData, focus)}
        </div>
      )}
      {fileOption !== "all" && (
        <div
          className="memoContainer"
          onDragOver={drageOver}
          onDrop={drop}
        >
          {showMemosInFile(memoData, fileOption)}
        </div>
      )}
    </>
  );
}

export default MemoContainer;

MemoContainer.propTypes = {
  memoData: PropTypes.array,
  focus: PropTypes.any,
};
