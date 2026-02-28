/**
 * ---
 * @anchor: .patterns/core-module
 * @spec: specs/vscode-extension.md#webview-hooks
 * @task: TASK-021
 * @validated: null
 * ---
 */

import { useEffect, useState, useCallback } from 'react';
import type { Database, DBRecord, DBView, Field } from 'sogo-db-core';
import type { DatabaseSnapshot, HostMessage } from '../protocol.js';
import { postCommand } from './useVSCodeApi.js';

export interface DatabaseState {
	database: Database | null;
	activeViewId: string;
	activeView: DBView | null;
	processedRecords: DBRecord[];
	allDatabases: Array<{ id: string; name: string }>;
	relationTitles: Record<string, string>;
	loading: boolean;
}

export function useDatabase(): DatabaseState {
	const [state, setState] = useState<DatabaseState>({
		database: null,
		activeViewId: '',
		activeView: null,
		processedRecords: [],
		allDatabases: [],
		relationTitles: {},
		loading: true,
	});

	useEffect(() => {
		function handleMessage(event: MessageEvent<HostMessage>) {
			const msg = event.data;
			if (msg.type === 'snapshot') {
				const activeView = msg.database.views.find((v) => v.id === msg.activeViewId) ?? null;
				setState({
					database: msg.database,
					activeViewId: msg.activeViewId,
					activeView,
					processedRecords: msg.processedRecords,
					allDatabases: msg.allDatabases,
					relationTitles: msg.relationTitles ?? {},
					loading: false,
				});
			}
		}

		window.addEventListener('message', handleMessage);
		postCommand({ type: 'ready' });

		return () => window.removeEventListener('message', handleMessage);
	}, []);

	return state;
}

export interface ThemeState {
	kind: 'light' | 'dark' | 'high-contrast';
}

export function useTheme(): ThemeState {
	const [theme, setTheme] = useState<ThemeState>({ kind: 'dark' });

	useEffect(() => {
		function handleMessage(event: MessageEvent<HostMessage>) {
			if (event.data.type === 'theme') {
				setTheme({ kind: event.data.kind });
			}
		}
		window.addEventListener('message', handleMessage);
		return () => window.removeEventListener('message', handleMessage);
	}, []);

	return theme;
}
