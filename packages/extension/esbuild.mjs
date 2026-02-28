/**
 * ---
 * @anchor: .patterns/npm-package
 * @spec: specs/vscode-extension.md#build
 * @task: TASK-016
 * @validated: null
 * ---
 *
 * Dual esbuild config: extension host (CJS, Node) + webview (ESM, browser).
 */

import { build, context } from 'esbuild';
import { execSync } from 'node:child_process';
import path from 'node:path';

const isWatch = process.argv.includes('--watch');
const isProd = process.argv.includes('--production');

/** @type {import('esbuild').BuildOptions} */
const hostConfig = {
	entryPoints: ['src/extension.ts'],
	bundle: true,
	outfile: 'dist/extension.js',
	format: 'cjs',
	platform: 'node',
	target: 'node20',
	sourcemap: !isProd,
	minify: isProd,
	external: ['vscode'],
};

// Stub Node.js built-ins for the browser bundle.
// The webview only uses pure utility functions from sogo-db-core, never file I/O.
const nodeStubPlugin = {
	name: 'node-stub',
	setup(/** @type {import('esbuild').PluginBuild} */ build) {
		const stubs = ['fs', 'fs/promises', 'path', 'os'];
		for (const mod of stubs) {
			build.onResolve({ filter: new RegExp(`^${mod.replace('/', '\\/')}$`) }, () => ({
				path: mod,
				namespace: 'node-stub',
			}));
		}
		build.onLoad({ filter: /.*/, namespace: 'node-stub' }, () => ({
			contents: 'export default {}; export const readFile = () => {}; export const writeFile = () => {}; export const readdir = () => {}; export const join = (...a) => a.join("/"); export const homedir = () => "/"; export const resolve = (...a) => a.join("/");',
			loader: 'js',
		}));
	},
};

/** @type {import('esbuild').BuildOptions} */
const webviewConfig = {
	entryPoints: ['src/webview/index.tsx'],
	bundle: true,
	outfile: 'dist/webview.js',
	format: 'iife',
	platform: 'browser',
	target: 'es2022',
	sourcemap: !isProd,
	minify: isProd,
	jsx: 'automatic',
	plugins: [nodeStubPlugin],
	define: {
		'process.env.NODE_ENV': isProd ? '"production"' : '"development"',
	},
	loader: {
		'.css': 'css',
	},
};

async function main() {
	// Build Tailwind CSS first
	buildTailwind();

	if (isWatch) {
		const [hostCtx, webviewCtx] = await Promise.all([
			context(hostConfig),
			context(webviewConfig),
		]);
		await Promise.all([hostCtx.watch(), webviewCtx.watch()]);
		console.log('[sogo-db] watching for changes...');
	} else {
		await Promise.all([build(hostConfig), build(webviewConfig)]);
		console.log('[sogo-db] build complete');
	}
}

function buildTailwind() {
	try {
		const input = path.resolve('src/webview/styles.css');
		const output = path.resolve('dist/webview.css');
		execSync(`npx @tailwindcss/cli -i ${input} -o ${output}${isProd ? ' --minify' : ''}`, {
			stdio: 'inherit',
		});
	} catch {
		console.warn('[sogo-db] tailwind build skipped (styles.css may not exist yet)');
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
