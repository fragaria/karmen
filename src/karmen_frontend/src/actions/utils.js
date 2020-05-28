// inspired by https://github.com/machadogj/redux-thunk-actions/blob/master/src/index.js

const createHttpActionFactory = (type) => {
  return (payload) => ({
    type,
    payload,
  });
};

const isPromise = (p) => {
  return p && p.then && p.catch;
};

export const createHttpAction = (
  name,
  func,
  { swallowErrors = false } = {}
) => {
  return (...args) => (dispatch, getState, extra) => {
    let result;
    dispatch(createHttpActionFactory(`${name}_STARTED`)());
    // when action is successful...
    const succeeded = (result) => {
      // ...fire success only if http status code is considered a success
      if (
        result &&
        result.status &&
        result.successCodes &&
        result.successCodes.indexOf(result.status) > -1
      ) {
        dispatch(createHttpActionFactory(`${name}_SUCCEEDED`)(result));
      }
      // ... but always fire end
      dispatch(createHttpActionFactory(`${name}_ENDED`)(result));
      return result;
    };
    // when action is not successful because it throws...
    const failed = (err) => {
      // ... fire fail and end ...
      dispatch(createHttpActionFactory(`${name}_FAILED`)(err));
      dispatch(createHttpActionFactory(`${name}_ENDED`)(err));

      // ... if raise is requested, bubble the error up
      if (!swallowErrors) {
        throw err;
      }
      // ... otherwise, return the result
      return result;
    };

    // handling of sync cases
    try {
      result = func(...args, { getState, dispatch });
    } catch (error) {
      return failed(error);
    }
    // handling of async cases
    if (isPromise(result)) {
      return result.then(succeeded, failed);
    }
    return succeeded(result);
  };
};
