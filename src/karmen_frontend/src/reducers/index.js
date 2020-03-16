import { combineReducers } from "redux";
import gcodes from "./gcodes";
import me from "./users-me";
import organizations from "./organizations";
import preferences from "./preferences";
import printers from "./printers";
import printjobs from "./printjobs";
import users from "./users";
import webcams from "./webcams";

export default combineReducers({
  gcodes,
  me,
  organizations,
  preferences,
  printers,
  printjobs,
  users,
  webcams
});
