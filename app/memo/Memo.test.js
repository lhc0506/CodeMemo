import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import userEvent from "@testing-library/user-event";
import Memo from "./Memo";

describe("MemoBoard Test", () => {
  const changeColor = jest.fn();
  const deleteMemo = jest.fn();
  const linkToCode = jest.fn();
  const resize = jest.fn();
  const update = jest.fn();

  const mockMemoDadta = {
    data: {
      id: 1111,
      path: "test/memo.memo",
      line: 13,
      contents: "It is test.",
      x: 0,
      y: 0,
      width: 180,
      height: 180,
    },
    index: 0,
    isFocus: true,
    vscodeFunc: {
      changeColor,
      deleteMemo,
      linkToCode,
      resize,
      update,
    },
  };

  it.skip("Memo Content Test", () => {
    render(
      <Memo
        data={mockMemoDadta.data}
        index={mockMemoDadta.index}
        isFocus={mockMemoDadta.isFocus}
        vscodeFunc={mockMemoDadta.vscodeFunc}
      />,
    );
    expect(screen.getByText("It is test.")).toBeInTheDocument();
  });

  it("Button Test", () => {
    render(
      <Memo
        data={mockMemoDadta.data}
        index={mockMemoDadta.index}
        isFocus={mockMemoDadta.isFocus}
        vscodeFunc={mockMemoDadta.vscodeFunc}
      />,
    );

    userEvent.click(screen.getByText("X"));
    expect(deleteMemo).toBeCalled();

    userEvent.click(screen.getByText("go to Code"));
    expect(linkToCode).toBeCalled();

    userEvent.click(screen.getByText("color"));
    expect(screen.getByTitle("color")).toBeInTheDocument();
  });
});
