import { createStore, applyMiddleware, compose } from "redux";
import thunk from "redux-thunk";
import createSentryMiddleware from "redux-sentry-middleware";

import rootReducer from "./reducers";
import { Sentry } from "./sentry";

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const sentry = createSentryMiddleware(Sentry, {
  getUserContext: (state) => {
    return state.me;
  },
});

export default function configureStore(
  initialState = {},
  reducer = rootReducer
) {
  return createStore(
    reducer,
    initialState,
    composeEnhancers(applyMiddleware(thunk, sentry))
  );
}
