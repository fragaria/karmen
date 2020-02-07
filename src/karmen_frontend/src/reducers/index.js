import { combineReducers } from "redux";
import gcodes from "./gcodes";
import printers from "./printers";
import printjobs from "./printjobs";
import users from "./users";

export default combineReducers({
  gcodes,
  printers,
  printjobs,
  users
});
