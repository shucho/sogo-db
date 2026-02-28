/**
 * ---
 * @anchor: .patterns/core-module
 * @spec: specs/vscode-extension.md#shared-components
 * @task: TASK-033
 * @validated: null
 * ---
 */

interface EmptyStateProps {
	title: string;
	description?: string;
	action?: { label: string; onClick: () => void };
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
	return (
		<div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
			<p className="text-base font-medium">{title}</p>
			{description && <p className="mt-1 text-sm">{description}</p>}
			{action && (
				<button
					className="mt-3 rounded px-3 py-1.5 text-sm hover:opacity-80"
					style={{
						backgroundColor: 'var(--vscode-button-background)',
						color: 'var(--vscode-button-foreground)',
					}}
					onClick={action.onClick}
				>
					{action.label}
				</button>
			)}
		</div>
	);
}
