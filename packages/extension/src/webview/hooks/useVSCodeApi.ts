/**
 * ---
 * @anchor: .patterns/core-module
 * @spec: specs/vscode-extension.md#webview-hooks
 * @task: TASK-021
 * @validated: null
 * ---
 */

import type { WebviewCommand } from '../protocol.js';

interface VSCodeApi {
	postMessage(msg: unknown): void;
	getState(): unknown;
	setState(state: unknown): void;
}

declare function acquireVsCodeApi(): VSCodeApi;

let api: VSCodeApi | undefined;

export function getVSCodeApi(): VSCodeApi {
	if (!api) {
		api = acquireVsCodeApi();
	}
	return api;
}

export function postCommand(command: WebviewCommand): void {
	getVSCodeApi().postMessage(command);
}
