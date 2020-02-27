import { combineReducers } from "redux";
import gcodes from "./gcodes";
import organizations from "./organizations";
import preferences from "./preferences";
import printers from "./printers";
import printjobs from "./printjobs";
import users from "./users";

export default combineReducers({
  gcodes,
  organizations,
  preferences,
  printers,
  printjobs,
  users
});
