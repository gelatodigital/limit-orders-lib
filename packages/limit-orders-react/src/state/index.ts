import gapplication from "./gapplication/reducer";
import guser from "./guser/reducer";
import gorder from "./gorder/reducer";
import glists from "./glists/reducer";
import gmulticall from "./gmulticall/reducer";
import { configureStore } from "@reduxjs/toolkit";

export const gelatoReducers = {
  gapplication,
  guser,
  gorder,
  gmulticall,
  glists,
};

const store = configureStore({
  reducer: gelatoReducers,
});

export default store;

export type AppState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
