import gapplication, { ApplicationState } from "./gapplication/reducer";
import guser, { UserState } from "./guser/reducer";
import gorder, { OrderState } from "./gorder/reducer";
import glists, { ListsState } from "./glists/reducer";
import gmulticall, { MulticallState } from "./gmulticall/reducer";
import { AnyAction, Dispatch } from "@reduxjs/toolkit";

export const gelatoReducers = {
  gapplication,
  guser,
  gorder,
  gmulticall,
  glists,
};

export type AppState = {
  gapplication: ApplicationState;
  guser: UserState;
  gorder: OrderState;
  gmulticall: MulticallState;
  glists: ListsState;
};

export type AppDispatch = Dispatch<AnyAction>;
