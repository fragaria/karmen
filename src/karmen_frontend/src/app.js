import React, { useEffect, useState, useRef } from "react";
import { Provider, connect } from "react-redux";
import {
  BrowserRouter,
  Switch,
  Route,
  useLocation,
  useHistory,
} from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { ErrorBoundary } from "react-error-boundary";
import * as Sentry from "@sentry/browser";

import Heartbeat from "./components/heartbeat";
import Menu from "./components/menu";
import Loader from "./components/utils/loader";
import CatchLoginTokenFromUrl from "./components/gateways/catch-login-token-from-url";
import AuthenticatedRoute from "./components/authenticated-route";
import UnauthenticatedRoute from "./components/unauthenticated-route";
import ForceLogoutRoute from "./components/force-logout-route";

import Login from "./routes/unauthorized/login";
import Register from "./routes/unauthorized/register";
import RegisterConfirmation from "./routes/unauthorized/register-confirmation";
import RequestPasswordReset from "./routes/unauthorized/request-password-reset";
import ResetPassword from "./routes/unauthorized/reset-password";
import OrganizationRoot from "./routes/organizations/organization-root";
import OrganizationSettings from "./routes/organizations/organization-settings";
import OrganizationProperties from "./routes/organizations/organization-properties";
import AddPrinter from "./routes/organizations/add-printer";
import AddUser from "./routes/organizations/add-user";
import PrinterList from "./routes/printers/printer-list";
import PrinterDetail from "./routes/printers/printer-detail";
import PrinterSettings from "./routes/printers/printer-settings";
import GcodeList from "./routes/gcodes/gcode-list";
import GcodeDetail from "./routes/gcodes/gcode-detail";
import AddGcode from "./routes/gcodes/add-gcode";
import AddApiToken from "./routes/user/add-api-token";
import UserPreferences from "./routes/user/user-preferences";
import ManageOrganizations from "./routes/manage-organizations";
import AddOrganization from "./routes/add-organization";
import NoOrganization from "./routes/no-organization";
import Page404 from "./routes/page404";
import AppRoot from "./routes/app-root";
import configureStore from "./store";
import { HttpError, OfflineError } from "./errors";

import {
  loadUserFromLocalStorage,
  clearUserIdentity,
} from "./actions/users-me";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    const fragment = pathname.split("/").pop();
    if (fragment && !fragment.startsWith("tab-")) {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
};

/**
 * An error boundary fallback component to render when app error occures.
 * This catches in-app rendering errors - e.g. those that would make the React
 * app fall apart. It won't catch uncaught async issues for example.
 */
const ErrorFallback = ({ error, componentStack, resetErrorBoundary }) => {
  let sentryEventId;

  Sentry.withScope((scope) => {
    scope.setExtras(error);
    sentryEventId = Sentry.captureException(error);
  });

  return (
    <div role="alert" className="content">
      <div className="container text-center">
        <h1 className="main-title text-center">Something didn't go well</h1>
        <p>
          We're sorry, but there has been an error in the application.
          <br />
          Our engineers were already notified and will fix it as soon as
          possible.
        </p>
        <div className="cta-box">
          <button className="btn" type="reset" onClick={resetErrorBoundary}>
            Try again
          </button>
          {sentryEventId && (
            <button
              className="btn btn-plain"
              onClick={() =>
                Sentry.showReportDialog({ eventId: sentryEventId })
              }
            >
              Submit error report
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * This is a general handler for uncaught promise rejections. It will be attached to
 * window object when <AppErrorGuard> renders, see below.
 */
const rejectionErrorHandler = (event) => {
  const err = event.reason;
  // log the error to console so that it can be debugged (there's no traceback
  // otherwise)
  console.error('Unhandler error', err);

  if (err instanceof HttpError) {
    switch (err.response.status) {
      case 401:
        return toast(
          <>
            <div className="toast-main">
              We couldn't verify you identity. Please log in again.
            </div>
            <p>
              This usually happens when your session expires after long period
              of inactivity.
            </p>
          </>,
          { autoClose: 8000, toastId: "HttpError401" }
        );
      case 403:
        return toast(
          <>
            <div className="toast-main">
              You're not allowed to display this page.
            </div>
            <p>Make sure your account has all the required permissions.</p>
          </>,
          { autoClose: false, toastId: "HttpError403" }
        );
      default:
        return toast(
          <p>
            <div className="toast-main">Something didn't go well.</div>
            <p>
              We're sorry, but there has been some trouble talking to our
              servers. Our engineers were already notified and will fix it as
              soon as possible.
            </p>
          </p>,
          { autoClose: false, toastId: "HttpErrorOther" }
        );
    }
  } else if (err instanceof OfflineError) {
    // This is OK.
    return;
  }

  toast(
    <>
      <div className="toast-main">Something didn't go well.</div>
      <p>
        We're sorry, but there has been an error in the application. Our
        engineers were already notified and will fix it as soon as possible.
      </p>
    </>,
    { autoClose: false, toastId: "GeneralPromiseError" }
  );
};

/**
 * A general script error handler. It will be called for uncaught general
 * scripting errors. It is attached as window event handler once the
 * <AppErrorGuard> renders, see below.
 */
const generalErrorHandler = (event) => {
  toast(
    <>
      <div className="toast-main">That's an error!</div>
      <p>Yep, there's been some problem on our end. Sorry!</p>
    </>,
    { autoClose: false, toastId: "GeneralAppError" }
  );
};

/** General error handling not covered by AppErrorBoundary. */
export const AppErrorGuard = ({ children }) => {
  useEffect(() => {
    // Attach handler for uncaught promise rejections.
    window.addEventListener("unhandledrejection", rejectionErrorHandler);
    // Attach general error handler.
    window.addEventListener("error", generalErrorHandler);

    // Cleanup
    return () => {
      window.removeEventListener("unhandledrejection", rejectionErrorHandler);
      window.removeEventListener("error", generalErrorHandler);
    };
  });

  return <>{children}</>;
};

/** A react error boundary handler. */
export const AppErrorBoundary = ({ children, location, history }) => {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // This little trick forces the current route to re-render.
        history.push("/");
        history.goBack();
      }}
      key={location.pathname}
    >
      {children}
    </ErrorBoundary>
  );
};

const AppRouter = ({ userState, logout }) => {
  const location = useLocation();
  const history = useHistory();

  return (
    <main className="main">
      <AppErrorBoundary location={location} history={history}>
        <Switch>
          <Route path="/page-404" exact component={Page404} />
          <UnauthenticatedRoute
            userState={userState}
            path="/login"
            exact
            component={Login}
          />
          <UnauthenticatedRoute
            userState={userState}
            path="/register"
            exact
            component={Register}
          />
          <ForceLogoutRoute
            userState={userState}
            logout={logout}
            path="/confirmation"
            exact
            component={RegisterConfirmation}
          />
          <ForceLogoutRoute
            userState={userState}
            logout={logout}
            path="/reset-password"
            exact
            component={ResetPassword}
          />
          <UnauthenticatedRoute
            userState={userState}
            path="/request-password-reset"
            exact
            component={RequestPasswordReset}
          />
          <AuthenticatedRoute
            userState={userState}
            path="/users/me/tokens"
            exact
            component={AddApiToken}
          />
          <AuthenticatedRoute
            userState={userState}
            path="/users/me"
            component={UserPreferences}
          />
          <AuthenticatedRoute
            userState={userState}
            path="/organizations"
            exact
            component={ManageOrganizations}
          />
          <AuthenticatedRoute
            userState={userState}
            path="/organizations/:orguuid/settings"
            exact
            component={OrganizationProperties}
          />
          <AuthenticatedRoute
            userState={userState}
            path="/add-organization"
            exact
            component={AddOrganization}
          />
          <AuthenticatedRoute
            userState={userState}
            path="/no-organization"
            exact
            component={NoOrganization}
          />
          <AuthenticatedRoute
            userState={userState}
            path="/:orguuid/settings"
            component={OrganizationSettings}
          />
          <AuthenticatedRoute
            userState={userState}
            path="/:orguuid/add-user"
            exact
            component={AddUser}
          />
          <AuthenticatedRoute
            userState={userState}
            path="/:orguuid/add-printer"
            exact
            component={AddPrinter}
          />
          <AuthenticatedRoute
            userState={userState}
            path="/:orguuid/add-gcode"
            exact
            component={AddGcode}
          />
          <AuthenticatedRoute
            userState={userState}
            path="/:orguuid/gcodes/:uuid"
            exact
            component={GcodeDetail}
          />
          <AuthenticatedRoute
            userState={userState}
            path="/:orguuid/gcodes"
            exact
            component={GcodeList}
          />
          <AuthenticatedRoute
            userState={userState}
            path="/:orguuid/printers/:uuid/settings"
            exact
            component={PrinterSettings}
          />
          <AuthenticatedRoute
            userState={userState}
            path="/:orguuid/printers/:uuid"
            component={PrinterDetail}
          />
          <AuthenticatedRoute
            userState={userState}
            path="/:orguuid/printers"
            exact
            component={PrinterList}
          />
          <AuthenticatedRoute
            userState={userState}
            path="/:orguuid"
            exact
            component={OrganizationRoot}
          />
          <AuthenticatedRoute
            userState={userState}
            path="/"
            exact
            component={AppRoot}
          />
          <Route component={Page404} />
        </Switch>
      </AppErrorBoundary>
    </main>
  );
};

const ConnectedAppBase = ({ loadUserFromStorage, userState, logout }) => {
  const [initialized, setInitialized] = useState(false);
  const myRef = useRef(null);

  useEffect(() => {
    if (!initialized) {
      loadUserFromStorage().then(() => setInitialized(true));
    } else {
      myRef.current.scrollTo(0, 0);
    }
  });

  if (!initialized) {
    return (
      <div>
        <Loader />
      </div>
    );
  }

  return (
    <div ref={myRef}>
      <AppErrorGuard>
        <Heartbeat />
        <BrowserRouter>
          <ScrollToTop />
          <CatchLoginTokenFromUrl />
          <Menu />
          <AppRouter userState={userState} logout={logout} />
        </BrowserRouter>
        <footer>
          <section>
            &copy; {new Date().getFullYear()}{" "}
            <a
              href="https://fragaria.cz"
              target="_blank"
              rel="noopener noreferrer"
              className="anchor"
            >
              Fragaria s.r.o.
            </a>
          </section>
          <small>
            <a
              href="https://github.com/fragaria/karmen/blob/master/LICENSE.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="anchor"
            >
              License
            </a>{" "}
            <a
              href="https://github.com/fragaria/karmen"
              target="_blank"
              rel="noopener noreferrer"
              className="anchor"
            >
              Source
            </a>{" "}
            <a
              href={`https://github.com/fragaria/karmen/releases/tag/${process.env.REACT_APP_GIT_REV}`}
              target="_blank"
              rel="noopener noreferrer"
              className="anchor"
            >
              {process.env.REACT_APP_GIT_REV}
            </a>
          </small>
        </footer>
        <ToastContainer hideProgressBar />
      </AppErrorGuard>
    </div>
  );
};

export const ConnectedApp = connect(
  (state) => ({
    accessTokenExpiresOn: state.me.accessTokenExpiresOn,
    userState: state.me.currentState,
  }),
  (dispatch) => ({
    loadUserFromStorage: () => dispatch(loadUserFromLocalStorage(true)),
    logout: () => dispatch(clearUserIdentity()),
  })
)(ConnectedAppBase);

export default () => {
  return (
    <Provider store={configureStore()}>
      <ConnectedApp />
    </Provider>
  );
};
