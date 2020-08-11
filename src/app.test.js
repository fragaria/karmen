import React from "react";
import { render, fireEvent } from "@testing-library/react";
import * as toastify from "react-toastify";

import App, { AppErrorBoundary, AppErrorGuard } from "./app";

it("renders", () => {
  render(<App />);
});

describe("Error handling", () => {
  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(toastify, "toast").mockImplementation(() => {});
  });

  afterAll(() => {
    console.error.mockRestore();
    toastify.toast.mockRestore();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("displays an error fallback when rendering fails", () => {
    const FailingComponent = ({ shouldThrow }) => {
      if (shouldThrow) {
        throw new Error("💣");
      } else {
        return null;
      }
    };

    const locationMock = { pathname: "/" };
    const historyMock = { push: jest.fn(), goBack: jest.fn() };

    const { rerender, getByText, queryByRole } = render(
      <AppErrorBoundary location={locationMock} history={historyMock}>
        <FailingComponent shouldThrow={false} />
      </AppErrorBoundary>
    );

    rerender(
      <AppErrorBoundary location={locationMock} history={historyMock}>
        <FailingComponent shouldThrow={true} />
      </AppErrorBoundary>
    );

    expect.any(Error);
    expect(getByText("Something didn't go well")).toBeInTheDocument();

    console.error.mockClear();

    rerender(
      <AppErrorBoundary location={locationMock} history={historyMock}>
        <FailingComponent shouldThrow={false} />
      </AppErrorBoundary>
    );

    fireEvent.click(getByText("Try again"));
    expect(console.error).not.toHaveBeenCalled();
    expect(queryByRole("alert")).not.toBeInTheDocument();
  });

  it("displays a toast when there is an uncaught promise rejection", async () => {
    // Unfortunately, I have found no feasible way to test this:
    // https://github.com/facebook/jest/issues/5620
  });

  it("displays a warning when there is a general scripting error", () => {
    // This should attach event handlers.
    render(<AppErrorGuard></AppErrorGuard>);

    expect(toastify.toast).not.toHaveBeenCalled();

    fireEvent.error(window, new ErrorEvent("💣"));

    expect.any(Error);
    expect(toastify.toast).toHaveBeenCalledTimes(1);
  });
});
