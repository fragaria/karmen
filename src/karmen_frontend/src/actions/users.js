import { createActionThunk } from 'redux-thunk-actions';
import * as backend from '../services/backend';

export const loadUserState = createActionThunk('USER_LOAD_STATE', () => {
  return backend.checkCurrentLoginState();
});

export const setCurrentState = (currentState) => (dispatch) => {
  const user = backend.getUser();
  if (user.hasFreshToken && currentState === "fresh-token-required") {
    return;
  }
  dispatch({
    type: "USER_SET_CURRENT_STATE",
    payload: {
      currentState: currentState
    }
  });
}

export const authenticate = createActionThunk('USER_AUTHENTICATE', (username, password) => {
  return backend.authenticate(username, password);
});

export const changePassword = createActionThunk('USER_CHANGE_PASSWORD', (password, new_password, new_password_confirmation) => {
  return backend.changePassword(password, new_password, new_password_confirmation);
});

export const clearUserIdentity = createActionThunk('USER_CLEAR', () => {
  backend.setAccessToken(null);
  backend.setRefreshToken(null);
});

export const setTokenFreshness = createActionThunk('USER_SET_TOKEN_FRESHNESS', (isFresh) => {
  return {
    isFresh
  };
});

export const loadUserApiTokens = createActionThunk('USER_LOAD_API_TOKENS', () => {
  return backend.loadApiTokens();
});

export const deleteUserApiToken = createActionThunk('USER_DELETE_API_TOKEN', (jti) => {
  return backend.deleteApiToken(jti)
    .then((status) => {
      if (status !== 204) {
        jti = null;
      }
      return {jti}
    });
});