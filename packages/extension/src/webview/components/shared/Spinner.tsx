/**
 * ---
 * @anchor: .patterns/core-module
 * @spec: specs/vscode-extension.md#shared-components
 * @task: TASK-033
 * @validated: null
 * ---
 */

export function Spinner() {
	return (
		<div className="flex items-center justify-center py-8">
			<div
				className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent"
				style={{ color: 'var(--vscode-progressBar-background)' }}
			/>
		</div>
	);
}
