import { defineConfig } from 'vite';
import path, { resolve } from 'path';

export default defineConfig({
	resolve: {
		alias: {
			process: "process",
			stream: "stream",
			util: "util",
			path: "path",
			fs: "fs",
		},
	},
	build: {

		lib: {
			entry: resolve(__dirname, 'src/index.ts'),
			name: 'MkTree',
			//   formats: ['es'],
			//   fileName: (format) => `makeTree.${format}.js`
		},
		rollupOptions: {
			output: {
				globals: {
					// Define global variables for external dependencies here if needed
				}
			}
		}
	}
});