import { configureStore } from "@reduxjs/toolkit";
import memoReducer from "./memoSlice";

export const store = configureStore({
  reducer: {
    memo: memoReducer,
  },
});
