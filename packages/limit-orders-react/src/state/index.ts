import gapplication from "./gapplication/reducer";
import guser from "./guser/reducer";
import gorder from "./gorder/reducer";
import glists from "./glists/reducer";
import gmulticall from "./gmulticall/reducer";
import { configureStore } from "@reduxjs/toolkit";
import { load, save } from "redux-localstorage-simple";

const PERSISTED_KEYS: string[] = ["guser", "glists"];

export const gelatoReducers = {
  gapplication,
  guser,
  gorder,
  gmulticall,
  glists,
};

const store = configureStore({
  reducer: gelatoReducers,
  middleware: [
    // ...getDefaultMiddleware({ thunk: false }),
    save({ states: PERSISTED_KEYS, debounce: 1000 }),
  ],
  preloadedState: load({ states: PERSISTED_KEYS }),
});

export default store;

export type AppState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
