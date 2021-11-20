// /*---------------------------------------------------------
//  * Copyright (C) Microsoft Corporation. All rights reserved.
//  *--------------------------------------------------------*/

import { ExtensionContext, StatusBarAlignment, window, StatusBarItem, Selection, workspace, TextEditor, commands } from 'vscode';


// 	const provider2 = vscode.languages.registerCompletionItemProvider(
// 		'plaintext',
// 		{
// 			provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {

// 				// get all text until the `position` and check if it reads `console.`
// 				// and if so then complete if `log`, `warn`, and `error`
// 				const linePrefix = document.lineAt(position).text.substr(0, position.character);
// 				if (!linePrefix.endsWith('console.')) {
// 					return undefined;
// 				}

// 				return [
// 					new vscode.CompletionItem('log', vscode.CompletionItemKind.Method),
// 					new vscode.CompletionItem('warn', vscode.CompletionItemKind.Method),
// 					new vscode.CompletionItem('error', vscode.CompletionItemKind.Method),
// 				];
// 			}
// 		},
// 		'.' // triggered whenever a '.' is being typed
// 	);
// 	const searchQuery = await vscode.window.showInputBox({
// 		placeHolder: "Search query",
// 		prompt: "Search my snippets on Codever",
// 	  });

// 	context.subscriptions.push(provider2);
// }
import * as vscode from 'vscode';
import CodeDb from './services/codeDb-service'
const fs = require("fs");
const codeIdMapping = new Map<string, string>();
const hits: string[] = [];

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
const tokenFileLocation = "/var/tmp/CodeDbKey.txt"

async function getCodeDbToken() {
	const searchQuery = await vscode.window.showInputBox({
		placeHolder: "Add CodeDb ",
		prompt: "Search my snippets on Codever",
	});
	fs.writeFileSync(tokenFileLocation, searchQuery, function (err: any) {
		if (err) {
			return console.log("error");
		}
	})
	return searchQuery
}




export function activate(context: vscode.ExtensionContext) {

	const disposable = vscode.commands.registerCommand('extension.codeDBplugin', async () => {
		if (fs.existsSync(tokenFileLocation)) {
			// File exists in path
			let token = "";
			let httpClient = new CodeDb();
			fs.readFile(tokenFileLocation, 'utf8', async function (_err: any, data: any) {
				token = data;
				let results = await httpClient.getFavourites(token);
				results.hits.forEach(function (item: { [x: string]: any; }) {
					hits.push(item['shortcut']);
					codeIdMapping.set(item['shortcut'], item['code_id']);
				});
				console.log(results);

			});
		} else {
			console.log(getCodeDbToken());
		}

	});

	context.subscriptions.push(
		vscode.languages.registerCompletionItemProvider(
			'*', {
			async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, _token: vscode.CancellationToken, _context: vscode.CompletionContext) {
				const linePrefix = document.lineAt(position).text.substr(0, position.character);
				let httpClient = new CodeDb();

				if (linePrefix.endsWith('(')) {
					let main = linePrefix.split(' ').slice(-1)[0];
					let id = main.split('(')[0];
					if (codeIdMapping.get(id)) {
						let code_id: string = codeIdMapping.get(id) || '';
						let results = await httpClient.getCode(code_id);
						var all = new vscode.Range(
							new vscode.Position(position.line,(position.character - 1) - id.length),new vscode.Position(position.line,position.character+1)
						);
						const editor = window.activeTextEditor;
						editor.edit(eb => eb.replace(all, results));
					}
				}
				let completionText: vscode.CompletionItem[] = [];
				hits.forEach(function (item: string) {
					completionText.push(new vscode.CompletionItem(item, vscode.CompletionItemKind.Method));
				});
				// return all completion items as array
				return completionText;
			}
		},'('));

	context.subscriptions.push(
		vscode.languages.registerCompletionItemProvider('plaintext', {

			provideCompletionItems(_document: vscode.TextDocument, _position: vscode.Position, _token: vscode.CancellationToken, _context: vscode.CompletionContext) {

				let completionText: vscode.CompletionItem[] = [];
				hits.forEach(function (item: string) {
					completionText.push(new vscode.CompletionItem(item, vscode.CompletionItemKind.Method));
				});

				// return all completion items as array
				return completionText;
			},
			resolveCompletionItem(_item: any, _token: any) {
				return null;
			}
		}));
		
	const addToken = vscode.commands.registerCommand('extension.codeDBAccessToken', async () => {
		if (fs.existsSync(tokenFileLocation)) {
			fs.unlinkSync(tokenFileLocation);

		}
		getCodeDbToken();
	});


	

	context.subscriptions.push(disposable, addToken);
}
