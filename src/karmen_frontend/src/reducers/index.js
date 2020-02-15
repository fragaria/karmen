import { combineReducers } from "redux";
import gcodes from "./gcodes";
import preferences from "./preferences";
import printers from "./printers";
import printjobs from "./printjobs";
import users from "./users";

export default combineReducers({
  gcodes,
  preferences,
  printers,
  printjobs,
  users
});
