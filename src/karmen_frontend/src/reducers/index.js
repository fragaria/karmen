import { combineReducers } from "redux";
import printers from "./printers";
import printjobs from "./printjobs";
import users from "./users";

export default combineReducers({
  printers,
  printjobs,
  users
});
