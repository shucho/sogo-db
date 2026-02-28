/**
 * ---
 * @anchor: .patterns/core-module
 * @spec: specs/vscode-extension.md#shared-components
 * @task: TASK-033
 * @validated: null
 * ---
 */

import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
	open: boolean;
	title: string;
	message: string;
	confirmLabel?: string;
	danger?: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

export function ConfirmDialog({
	open,
	title,
	message,
	confirmLabel = 'Confirm',
	danger,
	onConfirm,
	onCancel,
}: ConfirmDialogProps) {
	const dialogRef = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		const el = dialogRef.current;
		if (!el) return;
		if (open && !el.open) el.showModal();
		else if (!open && el.open) el.close();
	}, [open]);

	if (!open) return null;

	return (
		<dialog
			ref={dialogRef}
			className="rounded-lg p-0 backdrop:bg-black/40"
			style={{ backgroundColor: 'var(--vscode-editor-background)', color: 'var(--vscode-foreground)' }}
			onClose={onCancel}
		>
			<div className="p-4 min-w-[300px]">
				<h3 className="text-base font-semibold mb-2">{title}</h3>
				<p className="text-sm opacity-80 mb-4">{message}</p>
				<div className="flex justify-end gap-2">
					<button
						className="px-3 py-1.5 rounded text-sm hover:opacity-80"
						style={{
							backgroundColor: 'var(--vscode-button-secondaryBackground)',
							color: 'var(--vscode-button-secondaryForeground)',
						}}
						onClick={onCancel}
					>
						Cancel
					</button>
					<button
						className="px-3 py-1.5 rounded text-sm hover:opacity-80"
						style={{
							backgroundColor: danger
								? 'var(--vscode-errorForeground)'
								: 'var(--vscode-button-background)',
							color: danger ? '#fff' : 'var(--vscode-button-foreground)',
						}}
						onClick={onConfirm}
					>
						{confirmLabel}
					</button>
				</div>
			</div>
		</dialog>
	);
}
