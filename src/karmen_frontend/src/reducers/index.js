import { combineReducers } from 'redux';
import printers from './printers';
import users from './users';

export default combineReducers({
 printers,
 users,
});