import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import userEvent from "@testing-library/user-event";
import NewMemo from "./NewMemo";

describe("NewMemo Test", () => {
  it("Rendering Test", () => {
    const mockData = {
      path: "path",
      line: "line",
    };
    const mockFunc = jest.fn();
    mockFunc.mockReturnValueOnce("save data");

    render(<NewMemo data={mockData} handleOnClick={mockFunc} />);

    expect(screen.getByText("New Memo")).toBeInTheDocument();

    userEvent.click(screen.getByText("Save"));
    expect(mockFunc).toBeCalledTimes(1);
  });
});
