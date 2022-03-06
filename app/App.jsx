import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import MemoContainer from "./memo/MemoContainer";
import NewMemo from "./memo/NewMemo";
import { createMode } from "./memoSlice";
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

function App() {
  const [memoData, setMemoData] = useState();
  const [focusIndex, setFocusIndex] = useState();
  const dispatch = useDispatch();
  const type = useSelector((state) => state.memo.type);

  useEffect(() => {
    const onUpdate = (event) => {
      switch (event.data.command) {
        case "update":
          setMemoData(event.data.data.memos);
          setFocusIndex(event.data.data.focus);
          break;
        case "create":
          dispatch(createMode(event.data.data));
      }
    };

    window.addEventListener("message", onUpdate);

    return () => window.removeEventListener("message", onUpdate);
  }, []);

  return (
    <div className="App">
      {type === "board" && <DndProvider backend={HTML5Backend}>
        <MemoContainer memoData={memoData} focus={focusIndex} setMemo={setMemoData}/>
      </DndProvider>}
      {type === "create" && <NewMemo />}
    </div>
  );
}

export default App;
