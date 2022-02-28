const vscode = require("vscode");
const ReactPanel = require("./reactWebviewPanel");
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log('Congratulations, your extension "codememo" is now active!');

  let disposable = vscode.commands.registerCommand(
    "codememo.helloWorld",
    function () {
      vscode.window.showInformationMessage("Hello World from codeMemo!");
    },
  );

  context.subscriptions.push(disposable);

  context.subscriptions.push(
    vscode.commands.registerCommand("codememo.webview", () => {
      ReactPanel.createAndShow(context.extensionPath);
    }),
  );
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
