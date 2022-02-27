const vscode = require("vscode");
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
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
