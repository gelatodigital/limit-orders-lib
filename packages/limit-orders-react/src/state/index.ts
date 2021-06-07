import gapplication from "./gapplication/reducer";
import guser from "./guser/reducer";
import gtransactions from "./gtransactions/reducer";
import gorder from "./gorder/reducer";
import glists from "./glists/reducer";
import gmulticall from "./gmulticall/reducer";
import { configureStore, getDefaultMiddleware } from "@reduxjs/toolkit";
import { load, save } from "redux-localstorage-simple";

const PERSISTED_KEYS: string[] = ["guser", "gtransactions", "glists"];

export const gelatoReducers = {
  gapplication,
  guser,
  gtransactions,
  gorder,
  gmulticall,
  glists,
};

const store = configureStore({
  reducer: {
    gapplication,
    guser,
    gtransactions,
    gorder,
    gmulticall,
    glists,
  },
  middleware: [
    // ...getDefaultMiddleware({ thunk: false }),
    save({ states: PERSISTED_KEYS, debounce: 1000 }),
  ],
  preloadedState: load({ states: PERSISTED_KEYS }),
});

export default store;

export type AppState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
