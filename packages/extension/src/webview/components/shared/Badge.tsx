/**
 * ---
 * @anchor: .patterns/core-module
 * @spec: specs/vscode-extension.md#shared-components
 * @task: TASK-033
 * @validated: null
 * ---
 */

import { getReadableTextColor } from 'sogo-db-core';

interface BadgeProps {
	label: string;
	color?: string;
	onClick?: () => void;
}

export function Badge({ label, color, onClick }: BadgeProps) {
	const bg = color ?? 'var(--vscode-badge-background)';
	const fg = color ? getReadableTextColor(color) : 'var(--vscode-badge-foreground)';

	return (
		<span
			className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium cursor-default whitespace-nowrap"
			style={{ backgroundColor: bg, color: fg }}
			onClick={onClick}
			role={onClick ? 'button' : undefined}
		>
			{label}
		</span>
	);
}
