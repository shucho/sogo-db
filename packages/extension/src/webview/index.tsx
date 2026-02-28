/**
 * ---
 * @anchor: .patterns/npm-package
 * @spec: specs/vscode-extension.md#webview
 * @task: TASK-021
 * @validated: null
 * ---
 */

import { createRoot } from 'react-dom/client';
import { App } from './App';

const root = document.getElementById('root');
if (root) {
	createRoot(root).render(<App />);
}
