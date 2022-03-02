import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  type: "board",
  newMemo: null,
};

export const memoSlice = createSlice({
  name: "memo",
  initialState,
  reducers: {
    createMode: (state, action) => {
      state.type = "create";
      state.newMemo = action.payload;
    },
  },
});

export const { createMode } = memoSlice.actions;

export default memoSlice.reducer;
