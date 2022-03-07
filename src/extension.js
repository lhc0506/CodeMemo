const vscode = require("vscode");
const path = require("path");
const ReactPanel = require("./newMemoWebview");
const MemoEditorProvider = require("./memoEditor");
const {
  docContent,
  initDocArray,
  getMemos,
  setDecorationToCode,
  deleteMemoInCode,
  updateMemo,
  openMemo,
} = require("./utils");

/**
 * @param {vscode.ExtensionContext} context
 */

async function activate(context) {
  console.log("Congratulations, your extension 'codememo' is now active!");
  const gutterIconPath = vscode.Uri.file(
    path.join(context.extensionPath, "src", "memo.svg"),
  );
  const textDecoration = vscode.window.createTextEditorDecorationType({
    gutterIconPath,
    isWholeLine: true,
  });

  for (const editor of vscode.window.visibleTextEditors) {
    await initDocArray(editor);
    const memos = await getMemos();

    if (memos) {
      setDecorationToCode(memos.memos, textDecoration, editor);
    }
  }

  vscode.workspace.onDidOpenTextDocument(async doc => {
    if (doc?.uri.scheme !== "file") {
      return;
    }

    vscode.commands.executeCommand("codememo.setDecoration");
  });

  vscode.window.onDidChangeActiveTextEditor(async doc => {
    if (doc?.document.uri.scheme !== "file") {
      return;
    }
    const matchedIndex = docContent.findIndex(
      doc => doc.name === vscode.window.activeTextEditor.document.uri.path,
    );
    if (matchedIndex !== -1) {
      docContent.splice(matchedIndex, 1);
    }
    initDocArray(doc);

    vscode.commands.executeCommand("codememo.setDecoration");
  });

  vscode.workspace.onDidRenameFiles(async files => {
    const { newUri, oldUri } = files.files[0];
    const data = await getMemos();
    data.memos.forEach(memo => {
      if (memo.path === oldUri.path) {
        memo.path = newUri.path;
      }
    });

    await updateMemo(data);

    if (vscode.window.activeTextEditor.document.fileName === newUri.path) {
      vscode.commands.executeCommand("codememo.setDecoration");
    }
  });

  vscode.workspace.onDidCloseTextDocument(file => {
    const docIndex = docContent.findIndex(doc => doc.name === file.uri.path);
    docContent.splice(docIndex, 1);
  });

  context.subscriptions.push(
    vscode.commands.registerCommand("codememo.create", () => {
      ReactPanel.createAndShow(context.extensionPath);
    }),
    vscode.commands.registerCommand("codememo.delete", async () => {
      deleteMemoInCode(vscode.window.activeTextEditor);
    }),
    vscode.commands.registerCommand("codememo.setDecoration", async () => {
      const memos = await getMemos();
      if (!memos) {
        return;
      }
      setDecorationToCode(
        memos.memos,
        textDecoration,
        vscode.window.activeTextEditor,
      );
    }),
    vscode.commands.registerCommand("codememo.goToMemo", async () => {
      const data = await getMemos();
      if (!data) {
        vscode.window.showInformationMessage("There is no memo in this code.");
      }
      const path = vscode.window.activeTextEditor.document.fileName;
      const selection = vscode.window.activeTextEditor.selection;
      const index = data.memos.findIndex(
        memo => memo.path === path && memo.line === selection.active.line,
      );
      data.focus = index;
      await updateMemo(data);
      openMemo();
    }),
    vscode.workspace.onDidChangeTextDocument(async doc => {
      let { isDirty, version } = doc.document;
      if (!isDirty || version <= 1) {
        return;
      }

      const data = await getMemos();
      const path = vscode.window.activeTextEditor?.document.fileName;
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

      if (memosInFile.length !== 0) {
        const matchedIndex = docContent.findIndex(
          doc => doc.name === vscode.window.activeTextEditor.document.uri.path,
        );
        const beforeContentsArray =
          docContent[matchedIndex].content.split("\n");
        const afterContentsArray = doc.document.getText().split("\n");

        if (beforeContentsArray.length !== afterContentsArray.length) {
          const type =
            beforeContentsArray.length < afterContentsArray.length
              ? "add"
              : "delete";
          const activeLine =
            type === "add"
              ? vscode.window.activeTextEditor.selection.active.line - 1
              : vscode.window.activeTextEditor.selection.active.line + 1;
          for (let i = 0; i < memosInFile.length; i++) {
            const memo = memosInFile[i];
            if (memo.line < activeLine) {
              continue;
            }
            if (type === "add") {
              if (memo.line === activeLine && afterContentsArray[activeLine]) {
                continue;
              }
              memo.line++;
            } else {
              memo.line--;
            }
            data.memos[memoIndex[i]].line = memo.line;
          }
        }
        await updateMemo(data);

        docContent.splice(matchedIndex, 1);
        vscode.commands.executeCommand("codememo.setDecoration");
        initDocArray(doc);
      }
    }),

    MemoEditorProvider.register(context),
  );
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
