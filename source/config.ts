import {mkdirSync, readFileSync, writeFileSync, existsSync} from 'node:fs';
import {join} from 'node:path';
// @ts-expect-error no type declarations
import xdg from '@folder/xdg';

export type Config = {
	apiToken: string;
};

const dirs = xdg({subdir: 'dewy'}) as {config: string};
export const configPath = join(dirs.config, 'config.json');

export function loadConfig(): Config | undefined {
	if (!existsSync(configPath)) {
		return undefined;
	}

	const raw = readFileSync(configPath, 'utf-8');
	return JSON.parse(raw) as Config;
}

export function saveConfig(config: Config): void {
	mkdirSync(dirs.config, {recursive: true});
	writeFileSync(configPath, JSON.stringify(config, null, '\t') + '\n');
}
