// /*---------------------------------------------------------
//  * Copyright (C) Microsoft Corporation. All rights reserved.
//  *--------------------------------------------------------*/

import { ExtensionContext, StatusBarAlignment, window, StatusBarItem, Selection, workspace, TextEditor, commands } from 'vscode';
import getAppDataPath from "appdata-path";


import * as vscode from 'vscode';
import CodeDb from './services/codeDb-service'
const fs = require("fs");
const codeIdMapping = new Map<string, string>();
const hits: string[] = [];

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
const tokenFileLocation = getAppDataPath("CODEDB/CodeDbKey.txt");

async function getCodeDbToken() {
	const searchQuery = await vscode.window.showInputBox({
		placeHolder: "Add CodeDB access token ",
		prompt: "Search my snippets on CodeDB",
	});
	if (!fs.existsSync(getAppDataPath("CODEDB"))) {
		fs.mkdirSync(getAppDataPath("CODEDB"));
	}
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
					if (hits.includes(item['shortcut']) == false) {
						hits.push(item['shortcut']);
						codeIdMapping.set(item['shortcut'], item['code_id']);
					}
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
							new vscode.Position(position.line, (position.character - 1) - id.length), new vscode.Position(position.line, position.character + 1)
						);
						const editor = window.activeTextEditor;
						if (editor) {
							editor.edit(eb => eb.replace(all, results));
						}
					}
				}
				let completionText: vscode.CompletionItem[] = [];
				hits.forEach(function (item: string) {
					completionText.push(new vscode.CompletionItem(item, vscode.CompletionItemKind.Method));
				});
				// return all completion items as array
				return completionText;
			}
		}, '('));

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
