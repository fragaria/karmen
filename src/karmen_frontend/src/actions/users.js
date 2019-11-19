import { createActionThunk } from 'redux-thunk-actions';
import { checkCurrentLoginState } from '../services/backend';


export const loadUserState = createActionThunk('LOAD_USER_STATE', () => {
  return checkCurrentLoginState();
});