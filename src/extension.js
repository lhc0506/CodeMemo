const vscode = require("vscode");
const path = require("path");
const ReactPanel = require("./newMemoWebview");
const MemoEditorProvider = require("./memoEditor");
const setMemoInCode = require("./memoInCode");
/**
 * @param {vscode.ExtensionContext} context
 */

function activate(context) {
  console.log("Congratulations, your extension 'codememo' is now active!");
  const gutterIconPath = vscode.Uri.file(
    path.join(context.extensionPath, "src", "memo.svg"),
  );
  const textDecoration = vscode.window.createTextEditorDecorationType({
    gutterIconPath,
    isWholeLine: true,
  });

  vscode.workspace.onDidOpenTextDocument(async doc => {
    if (doc?.uri.scheme !== "file") {
      return;
    }

    setMemoInCode(textDecoration);
  });

  vscode.window.onDidChangeActiveTextEditor(async doc => {
    if (doc?.document.uri.scheme !== "file") {
      return;
    }

    setMemoInCode(textDecoration);
  });

  context.subscriptions.push(MemoEditorProvider.register(context));

  context.subscriptions.push(
    vscode.commands.registerCommand("codememo.create", () => {
      ReactPanel.createAndShow(context.extensionPath);
    }),
  );
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
