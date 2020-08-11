import React from "react";
import { render, waitFor, fireEvent } from "@testing-library/react";

import { ClipboardButton } from "../form-utils";

test("Copy to clipboard", async () => {
  const writeMock = jest.fn((x) => x);
  window.__defineGetter__("navigator", function () {
    return {
      clipboard: {
        writeText: writeMock,
      },
    };
  });

  const { getByText, queryByText } = render(
    <ClipboardButton valueToCopy="testvalue" />
  );
  const copyButton = getByText("Copy");
  fireEvent.click(copyButton);
  await waitFor(() => expect(writeMock).toHaveBeenCalledWith("testvalue"));
  expect(queryByText("Copy")).toBeNull();
  expect(getByText("Copied!")).toBeInTheDocument();
});
