/**
 * ---
 * @anchor: .patterns/core-module
 * @spec: specs/vscode-extension.md#shared-components
 * @task: TASK-039
 * @validated: null
 * ---
 *
 * Notion-style dropdown for selecting options (status, select, multiselect).
 * Renders via portal to avoid overflow clipping in scrollable containers.
 * Anchors to a trigger element and positions below (or above if near bottom).
 */

import { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getReadableTextColor } from 'sogo-db-core';
import { Badge } from './Badge.js';

interface PickerDropdownProps {
	anchor: HTMLElement;
	options: string[];
	selected: string[];
	multi?: boolean;
	getColor: (opt: string) => string;
	onToggle: (option: string) => void;
	onClose: () => void;
}

export function PickerDropdown({
	anchor,
	options,
	selected,
	multi,
	getColor,
	onToggle,
	onClose,
}: PickerDropdownProps) {
	const ref = useRef<HTMLDivElement>(null);

	// Close on click outside (ignore clicks on the anchor itself)
	useEffect(() => {
		function handleMouseDown(e: MouseEvent) {
			if (
				ref.current &&
				!ref.current.contains(e.target as Node) &&
				!anchor.contains(e.target as Node)
			) {
				onClose();
			}
		}
		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === 'Escape') onClose();
		}
		document.addEventListener('mousedown', handleMouseDown);
		window.addEventListener('keydown', handleKeyDown);
		return () => {
			document.removeEventListener('mousedown', handleMouseDown);
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [onClose, anchor]);

	// Compute position from anchor bounding rect
	const rect = anchor.getBoundingClientRect();
	const width = Math.max(rect.width, 220);
	const left = Math.min(rect.left, window.innerWidth - width - 8);
	const spaceBelow = window.innerHeight - rect.bottom - 8;
	const spaceAbove = rect.top - 8;
	const above = spaceBelow < 150 && spaceAbove > spaceBelow;

	const style: React.CSSProperties = {
		position: 'fixed',
		left,
		width,
		maxWidth: 320,
		maxHeight: Math.min(280, above ? spaceAbove : spaceBelow),
		overflowY: 'auto',
		zIndex: 100,
		backgroundColor: 'var(--vscode-dropdown-background)',
		border: '1px solid var(--vscode-dropdown-border)',
		borderRadius: '6px',
		boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
	};

	if (above) {
		style.bottom = window.innerHeight - rect.top + 4;
	} else {
		style.top = rect.bottom + 4;
	}

	return createPortal(
		<div ref={ref} style={style}>
			{/* Multi: show selected at top with × dismiss */}
			{multi && selected.length > 0 && (
				<>
					<div className="flex flex-wrap gap-1 px-2.5 py-2">
						{selected.map((opt) => (
							<DismissiblePill
								key={opt}
								label={opt}
								color={getColor(opt)}
								onDismiss={() => onToggle(opt)}
							/>
						))}
					</div>
					<div style={{ borderTop: '1px solid var(--vscode-panel-border)', margin: '0 8px' }} />
				</>
			)}

			{/* Options list */}
			<div className="py-1">
				{options.map((opt) => {
					const isSelected = selected.includes(opt);
					return (
						<button
							key={opt}
							className="peek-option w-full flex items-center gap-2.5 px-2.5 py-1.5 text-left"
							onClick={() => onToggle(opt)}
						>
							<Badge label={opt} color={getColor(opt)} />
							{isSelected && (
								<svg
									width="14"
									height="14"
									viewBox="0 0 16 16"
									fill="currentColor"
									className="flex-shrink-0 opacity-40 ml-auto"
								>
									<path d="M6.5 12.01l-4-4 .707-.707L6.5 10.596l6.293-6.293.707.707-7 7z" />
								</svg>
							)}
						</button>
					);
				})}
			</div>
		</div>,
		document.body,
	);
}

/* ─── Pill with × dismiss button ───────────────────── */

function DismissiblePill({
	label,
	color,
	onDismiss,
}: {
	label: string;
	color: string;
	onDismiss: () => void;
}) {
	const fg = getReadableTextColor(color);
	return (
		<span
			className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium cursor-pointer"
			style={{ backgroundColor: color, color: fg }}
			onClick={onDismiss}
		>
			{label}
			<svg width="8" height="8" viewBox="0 0 16 16" fill="currentColor" style={{ opacity: 0.7 }}>
				<path d="M8 8.707l3.646 3.647.708-.707L8.707 8l3.647-3.646-.707-.708L8 7.293 4.354 3.646l-.708.708L7.293 8l-3.647 3.646.708.708L8 8.707z" />
			</svg>
		</span>
	);
}
