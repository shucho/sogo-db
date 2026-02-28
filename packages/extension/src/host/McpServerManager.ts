/**
 * ---
 * @anchor: .patterns/core-module
 * @spec: specs/vscode-extension.md#mcp-server
 * @task: TASK-035
 * @validated: null
 * ---
 *
 * Auto-start sogo-mcp-server as a child process when configured.
 */

import * as vscode from 'vscode';
import { spawn, type ChildProcess } from 'node:child_process';
import { CONFIG } from './constants.js';

export class McpServerManager {
	private process: ChildProcess | null = null;
	private outputChannel: vscode.OutputChannel;

	constructor() {
		this.outputChannel = vscode.window.createOutputChannel('Sogo MCP Server');
	}

	start(): void {
		if (this.process) return;

		const config = vscode.workspace.getConfiguration();
		if (!config.get<boolean>(CONFIG.autoStartMcpServer, false)) return;

		try {
			// Resolve the sogo-mcp-server binary
			const binPath = require.resolve('sogo-mcp-server/bin/sogo-mcp-server.js');
			const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

			const env = { ...process.env } as NodeJS.ProcessEnv;
			if (workspacePath) {
				env.SOGO_WORKSPACE_PATH = workspacePath;
			}

			this.process = spawn('node', [binPath], {
				env,
				stdio: ['pipe', 'pipe', 'pipe'],
			});

			this.process.stderr?.on('data', (data: Buffer) => {
				this.outputChannel.appendLine(data.toString());
			});

			this.process.on('exit', (code) => {
				this.outputChannel.appendLine(`[sogo-mcp-server] exited with code ${code}`);
				this.process = null;
			});

			this.outputChannel.appendLine('[sogo-mcp-server] started');
		} catch (err) {
			this.outputChannel.appendLine(`[sogo-mcp-server] failed to start: ${err}`);
		}
	}

	stop(): void {
		if (this.process) {
			this.process.kill();
			this.process = null;
			this.outputChannel.appendLine('[sogo-mcp-server] stopped');
		}
	}

	dispose(): void {
		this.stop();
		this.outputChannel.dispose();
	}
}
