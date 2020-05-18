// inspired by https://github.com/machadogj/redux-thunk-actions/blob/master/src/index.js

const createActionFactory = (type) => {
  return (payload) => ({
    type,
    payload,
  });
};

const isPromise = (p) => {
  return p && p.then && p.catch;
};

export const createThunkedAction = (
  name,
  func,
  { raiseErrors = false } = {}
) => {
  return (...args) => (dispatch, getState, extra) => {
    let result;
    dispatch(createActionFactory(`${name}_STARTED`)());
    // when action is successful...
    const succeeded = (result) => {
      // ...fire success only if http status code is considered a success
      if (
        result &&
        result.status &&
        result.successCodes &&
        result.successCodes.indexOf(result.status) > -1
      ) {
        dispatch(createActionFactory(`${name}_SUCCEEDED`)(result));
      }
      // ... but always fire end
      dispatch(createActionFactory(`${name}_ENDED`)(result));
      return result;
    };
    // when action is not successful because it throws...
    const failed = (err) => {
      // ... fire fail and end ...
      dispatch(createActionFactory(`${name}_FAILED`)(err));
      dispatch(createActionFactory(`${name}_ENDED`)(err));

      // ... if raise is requested, bubble the error up
      if (raiseErrors) {
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
