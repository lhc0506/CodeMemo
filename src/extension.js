const vscode = require("vscode");
const path = require("path");
const ReactPanel = require("./newMemoWebview");
const MemoEditorProvider = require("./memoEditor");
const {
  addDocContent,
  getMemos,
  setDecorationToCode,
  deleteMemoInCode,
  updateMemo,
  openMemo,
  checkAndSetDecoration,
  checkMemoIsAvail,
} = require("./utils");
/**
 * @param {vscode.ExtensionContext} context
 */

const docContent = [];
const tempMemos = {};

async function activate(context) {
  console.log("Congratulations, your extension 'codememo' is now active!");

  const gutterIconPath = vscode.Uri.file(
    path.join(context.extensionPath, "src", "memo.svg"),
  );
  const textDecoration = vscode.window.createTextEditorDecorationType({
    gutterIconPath,
    isWholeLine: true,
  });
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  );

  statusBarItem.text = "$(note) codeMemo";
  statusBarItem.command = "codememo.openMemo";
  statusBarItem.show();

  for (const editor of vscode.window.visibleTextEditors) {
    await addDocContent(editor, docContent);
    const data = await getMemos();

    if (data) {
      setDecorationToCode(data.memos, textDecoration, editor);
    }
  }

  context.subscriptions.push(
    statusBarItem,
    vscode.workspace.onDidOpenTextDocument(async doc => {
      if (doc?.uri.scheme !== "file") {
        return;
      }
      checkAndSetDecoration(tempMemos, textDecoration);
    }),

    vscode.window.onDidChangeActiveTextEditor(doc => {
      if (doc?.document.uri.scheme !== "file") {
        return;
      }
      addDocContent(doc, docContent);
      checkAndSetDecoration(tempMemos, textDecoration);
    }),

    vscode.workspace.onDidRenameFiles(async files => {
      const { newUri, oldUri } = files.files[0];
      const data = await getMemos();

      if (!data) {
        return;
      }

      data.memos.forEach(memo => {
        if (memo.path === oldUri.path) {
          memo.path = newUri.path;
        }
      });

      await updateMemo(data);
      tempMemos[newUri] = tempMemos[oldUri];
      delete tempMemos[oldUri];
      if (vscode.window.activeTextEditor?.document.fileName === newUri.path) {
        checkAndSetDecoration(tempMemos, textDecoration);
      }
    }),

    vscode.workspace.onDidSaveTextDocument(async doc => {
      if (doc.uri.scheme !== "file") {
        return;
      }

      const tempMemosInFile = tempMemos[doc.uri.path];

      if (!tempMemosInFile) {
        return;
      }

      const data = await getMemos();
      const savedMemosofDoc = data.memos.filter(memo => {
        if (memo.path === doc.uri.path) {
          memo.status = "saved";
          return true;
        }
      });

      if (tempMemosInFile.length !== savedMemosofDoc.length) {
        return;
      }

      let index = 0;
      tempMemosInFile.forEach(memo => {
        for (index; index < data.memos.length; index++) {
          if (memo.id === data.memos[index].id) {
            data.memos[index].line = memo.line;
            break;
          }
        }
      });

      await updateMemo(data);
    }),

    vscode.workspace.onDidCloseTextDocument(async doc => {
      if (doc.uri.scheme !== "file") {
        return;
      }

      const docIndex = docContent.findIndex(
        document => document.name === doc.uri.path,
      );
      docContent.splice(docIndex, 1);

      const tempMemosInFile = tempMemos[doc.uri.path];

      if (!tempMemosInFile) {
        return;
      }

      const data = await getMemos();
      const updatedMemos = data.memos.filter(memo => {
        if (memo.path === doc.uri.path && memo.status === "created") {
          return false;
        }
        return true;
      });

      data.memos = updatedMemos;

      await updateMemo(data);
      delete tempMemos[doc.uri.path];
    }),
    vscode.commands.registerCommand("codememo.openMemo", () => {
      openMemo(vscode.ViewColumn.Beside);
    }),
    vscode.commands.registerCommand("codememo.create", async () => {
      const isAvailable = await checkMemoIsAvail(tempMemos);
      if (isAvailable) {
        vscode.window.showInformationMessage("Line already has memo");
      } else {
        ReactPanel.createAndShow(context.extensionPath);
      }
    }),
    vscode.commands.registerCommand("codememo.delete", async () => {
      await deleteMemoInCode(vscode.window.activeTextEditor, tempMemos);
      checkAndSetDecoration(tempMemos, textDecoration);
    }),
    vscode.commands.registerCommand("codememo.goToMemo", async () => {
      const data = await getMemos();
      if (!data) {
        vscode.window.showInformationMessage("There is no memo in this code.");
      }
      const path = vscode.window.activeTextEditor.document.uri.path;
      const selection = vscode.window.activeTextEditor.selection;
      let index;

      if (tempMemos[path]) {
        index = tempMemos[path].findIndex(
          memo => memo.line === selection.active.line,
        );
      } else {
        index = data.memos.findIndex(
          memo => memo.path === path && memo.line === selection.active.line
        );
      }

      if (index === -1) {
        vscode.window.showInformationMessage("There is no memo in this line.");
        return;
      }

      data.focus = index;
      await updateMemo(data);
      openMemo(vscode.ViewColumn.Beside);
    }),
    vscode.commands.registerCommand("codememo.updateCreatedMemo", async () => {
      if (!tempMemos) {
        return;
      }

      const data = await getMemos();
      const lastMemo = data.memos[data.memos.length - 1];
      if (tempMemos[lastMemo.path]) {
        tempMemos[lastMemo.path] = [...tempMemos[lastMemo.path], lastMemo];
      }

      for (const editor of vscode.window.visibleTextEditors) {
        if (editor.document.uri.path === lastMemo.path) {
          if (tempMemos[lastMemo.path]) {
            setDecorationToCode(
              tempMemos[lastMemo.path],
              textDecoration,
              editor,
            );
          } else {
            setDecorationToCode(data.memos, textDecoration, editor);
          }
          break;
        }
      }
    }),
    vscode.commands.registerCommand(
      "codememo.updateDeletedMemo",
      async deletedMemo => {
        for (const editor of vscode.window.visibleTextEditors) {
          if (editor.document.uri.path !== deletedMemo.path) {
            continue;
          }

          if (!tempMemos || !tempMemos[deletedMemo.path]) {
            const data = await getMemos();
            setDecorationToCode(data?.memos, textDecoration, editor);
          } else {
            tempMemos[deletedMemo.path] = tempMemos[deletedMemo.path].filter(
              memo => memo.id !== deletedMemo.id,
            );
            setDecorationToCode(
              tempMemos[deletedMemo.path],
              textDecoration,
              editor,
            );
          }
        }
      },
    ),
    vscode.workspace.onDidChangeTextDocument(async doc => {
      let { isDirty, version } = doc.document;
      if (!isDirty || version <= 1) {
        return;
      }

      const data = await getMemos();
      if (!data) {
        return;
      }

      const path = vscode.window.activeTextEditor?.document.uri.path;
      if (!path) {
        return;
      }
      const memoIndex = [];
      const memosInFile = data.memos.filter((memo, index) => {
        if (memo.path === path) {
          memoIndex.push(index);
          return true;
        }
      });

      if (memosInFile.length === 0) {
        return;
      }

      if (!tempMemos[path]) {
        tempMemos[path] = memosInFile;
      }

      const matchedIndex = docContent.findIndex(
        doc => doc.name === vscode.window.activeTextEditor.document.uri.path,
      );

      const beforeContentsArray = docContent[matchedIndex]?.content.split("\n");
      const afterContentsArray = doc.document.getText().split("\n");
      if (!beforeContentsArray) {
        return;
      }

      if (beforeContentsArray.length !== afterContentsArray.length) {
        const type =
          beforeContentsArray.length < afterContentsArray.length
            ? "add"
            : "delete";
        const activeLine =
          type === "add"
            ? vscode.window.activeTextEditor.selection.active.line - 1
            : vscode.window.activeTextEditor.selection.active.line + 1;
        for (let i = 0; i < tempMemos[path].length; i++) {
          const memo = tempMemos[path][i];
          if (memo.line < activeLine) {
            continue;
          }
          if (type === "add") {
            if (
              memo.line === activeLine &&
              afterContentsArray[activeLine].trim()
            ) {
              continue;
            }
            memo.line++;
          } else {
            memo.line--;
          }
        }

        docContent.splice(matchedIndex, 1);

        checkAndSetDecoration(tempMemos, textDecoration);
        addDocContent(doc, docContent);
      }
    }),
    MemoEditorProvider.register(context),
  );
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
  tempMemos,
};
