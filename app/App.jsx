import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import MemoContainer from "./memo/MemoContainer";
import NewMemo from "./memo/NewMemo";
import { createMode } from "./memoSlice";

function App() {
  const [memoData, setMemoData] = useState();
  const dispatch = useDispatch();
  const type = useSelector((state) => state.memo.type);

  useEffect(() => {
    const onUpdate = (event) => {
      switch (event.data.command) {
        case "update":
          setMemoData(event.data.data);
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
      {type === "board" && <MemoContainer memoData={memoData}/>}
      {type === "create" && <NewMemo />}
    </div>
  );
}

export default App;
