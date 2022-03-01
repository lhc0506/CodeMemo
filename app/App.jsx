import React, { useState, useEffect } from "react";
import Memo from "./Memo";

function App() {
  const [memoData, setMemoData] = useState();
  const [newMemo, setNewMemo] = useState(false);
  useEffect(() => {
    vscode.postMessage({
      type: "load",
    });
    const onUpdate = (event) => {
      switch (event.data.command) {
        case "update":
          setMemoData(event.data.data);
          break;
        case "load":
          setNewMemo(true);
      }
    };
    window.addEventListener("message", onUpdate);
    return () => window.removeEventListener("message", onUpdate);
  }, []);

  const makeMemos = (memos) => {
    return memos.map((memo, index) => {
      return <Memo data={memo} key={memo.id} index={index}></Memo>
    });
  };

  return (
    <div className="App">
      <div>hello world! 헤헿</div>
      {memoData && makeMemos(memoData)}
      {newMemo && <div>save메모합니다!</div>}
    </div>
  );
}

export default App;
