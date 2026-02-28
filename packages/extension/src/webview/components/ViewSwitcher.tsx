/**
 * ---
 * @anchor: .patterns/core-module
 * @spec: specs/vscode-extension.md#view-switcher
 * @task: TASK-022
 * @validated: null
 * ---
 */

import { useState } from 'react';
import type { DBView, ViewType } from 'sogo-db-core';
import { postCommand } from '../hooks/useVSCodeApi.js';

const VIEW_ICONS: Record<ViewType, string> = {
	table: '\u2261',    // ≡
	kanban: '\u25A6',   // ▦
	calendar: '\u25A3', // ▣
	gallery: '\u25A4',  // ▤
	list: '\u2630',     // ☰
};

interface ViewSwitcherProps {
	views: DBView[];
	activeViewId: string;
}

export function ViewSwitcher({ views, activeViewId }: ViewSwitcherProps) {
	const [showMenu, setShowMenu] = useState(false);

	function handleAdd(viewType: ViewType) {
		const name = `${viewType.charAt(0).toUpperCase() + viewType.slice(1)} view`;
		postCommand({ type: 'create-view', name, viewType });
		setShowMenu(false);
	}

	return (
		<div className="flex items-center gap-0.5 border-b" style={{ borderColor: 'var(--vscode-panel-border)' }}>
			{views.map((view) => (
				<button
					key={view.id}
					className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border-b-2 transition-colors"
					style={{
						borderColor: view.id === activeViewId ? 'var(--vscode-focusBorder)' : 'transparent',
						opacity: view.id === activeViewId ? 1 : 0.6,
					}}
					onClick={() => postCommand({ type: 'switch-view', viewId: view.id })}
				>
					<span>{VIEW_ICONS[view.type] ?? ''}</span>
					{view.name}
				</button>
			))}
			<div className="relative">
				<button
					className="px-2 py-1.5 text-xs opacity-50 hover:opacity-100"
					onClick={() => setShowMenu(!showMenu)}
					title="Add view"
				>
					+
				</button>
				{showMenu && (
					<div
						className="absolute top-full left-0 z-50 rounded shadow-lg py-1 min-w-[120px]"
						style={{ backgroundColor: 'var(--vscode-dropdown-background)', border: '1px solid var(--vscode-dropdown-border)' }}
					>
						{(['table', 'kanban', 'list', 'gallery', 'calendar'] as ViewType[]).map((vt) => (
							<button
								key={vt}
								className="block w-full px-3 py-1 text-xs text-left hover:opacity-80"
								style={{ color: 'var(--vscode-dropdown-foreground)' }}
								onClick={() => handleAdd(vt)}
							>
								{VIEW_ICONS[vt]} {vt.charAt(0).toUpperCase() + vt.slice(1)}
							</button>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
