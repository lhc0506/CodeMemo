export const vscodeFunctions = {
  loadData: () => {
    vscode.postMessage({
      command: "load",
    });
  },
  changeColor: (index, color) => {
    vscode.postMessage({
      command: "changeColor",
      index,
      color,
    });
  },
  deleteMemo: (index) => {
    vscode.postMessage({
      command: "delete",
      index,
    });
  },
  linkToCode: (path, line) => {
    vscode.postMessage({
      command: "link",
      path,
      line,
    });
  },
  resize: (index, width, height) => {
    vscode.postMessage({
      command: "resize",
      index,
      width,
      height,
    });
  },
  update: (index, contents) => {
    vscode.postMessage({
      command: "update",
      index,
      contents,
    })
  },
  saveMemo: (data, contents) => {
    vscode.postMessage({
      data,
      contents,
      command: "save",
    });
  },
  dragMemo: (index, x, y) => {
    vscode.postMessage({
      command: "drag",
      index,
      x,
      y,
    });
  }
};
