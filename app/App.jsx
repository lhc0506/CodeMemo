import React, { useState, useEffect } from "react";
import MemoContainer from "./memo/MemoContainer";
import NewMemo from "./memo/NewMemo";
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

function App() {
  const [memoData, setMemoData] = useState();
  const [focusIndex, setFocusIndex] = useState();
  const [newMemo, setNewMemo] = useState();
  const [type, setType] = useState("board");

  useEffect(() => {
    const onUpdate = (event) => {
      switch (event.data.command) {
        case "update":
          setMemoData(event.data.data.memos);
          setFocusIndex(event.data.data.focus);
          break;
        case "create":
          setNewMemo(event.data.data);
          setType("create");
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
      {type === "create" && <NewMemo data={newMemo}/>}
    </div>
  );
}

export default App;
