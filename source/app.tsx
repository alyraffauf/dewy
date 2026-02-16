import React, {useState, useEffect, useCallback} from 'react';
import {Box, Text, useApp} from 'ink';
import Spinner from 'ink-spinner';
import TextInput from 'ink-text-input';
import {TodoistApi, type Task} from '@doist/todoist-api-typescript';
import {type View, commands} from './commands.js';
import {loadConfig, configPath} from './config.js';
import {Content} from './content.js';
import TaskListView from './task-list-view.js';

const config = loadConfig();
const apiToken = config?.apiToken ?? process.env['TODOIST_API_TOKEN'];
const homeFilter = config?.homeFilter ?? 'today';

if (!apiToken) {
	console.error(
		`No API token found. Either:\n  1. Create ${configPath} with contents:\n     { "apiToken": "your-todoist-api-token" }\n  2. Set the TODOIST_API_TOKEN environment variable`,
	);
	process.exit(1);
}

const api = new TodoistApi(apiToken);

const PROJECT_CACHE_TTL = 5 * 60 * 1000;
let cachedProjects: Map<string, string> | null = null;
let cachedProjectsAt = 0;

const HINT_PAD = 26;

function CommandHints({input}: {input: string}) {
	if (input === '?') {
		const elements: React.ReactNode[] = [];
		let lastGroup = '';
		for (const c of commands) {
			if (c.group !== lastGroup && lastGroup) {
				elements.push(<Text key={`sep-${c.group}`}> </Text>);
			}

			lastGroup = c.group;
			elements.push(
				<Text key={c.prefix} dimColor>
					{'  '}
					{c.hint.padEnd(HINT_PAD)}
					{c.description}
				</Text>,
			);
		}

		return <>{elements}</>;
	}

	if (input) {
		return commands
			.filter(c => c.prefix.startsWith(input))
			.map(c => (
				<Text key={c.prefix} dimColor>
					{'  '}
					{c.hint.padEnd(HINT_PAD)}
					{c.description}
				</Text>
			));
	}

	return <Text dimColor>{'  type ? for help'}</Text>;
}

function CommandInput({
	input,
	setInput,
	onSubmit,
}: {
	input: string;
	setInput: (value: string) => void;
	onSubmit: (value: string) => Promise<void>;
}) {
	return (
		<>
			<Box
				flexDirection="column"
				borderStyle="single"
				borderColor="gray"
				borderLeft={false}
				borderRight={false}
			>
				<Box>
					<Text bold color="white">
						{'> '}
					</Text>
					<TextInput value={input} onChange={setInput} onSubmit={onSubmit} />
				</Box>
			</Box>
			<CommandHints input={input} />
		</>
	);
}

export default function App() {
	const {exit} = useApp();
	const [tasks, setTasks] = useState<Task[]>([]);
	const [projects, setProjects] = useState<Map<string, string>>(new Map());

	const [view, setView] = useState<View>({
		type: 'filter',
		query: homeFilter,
	});

	const [loading, setLoading] = useState(true);
	const [input, setInput] = useState('');
	const [message, setMessage] = useState('');

	const refresh = useCallback(async () => {
		setLoading(true);

		const projectsStale =
			!cachedProjects || Date.now() - cachedProjectsAt > PROJECT_CACHE_TTL;

		const [taskResponse, projectResponse] = await Promise.all([
			api.getTasksByFilter({query: view.query}),
			projectsStale ? api.getProjects() : null,
		]);

		if (projectResponse) {
			const projectMap = new Map<string, string>();
			for (const project of projectResponse.results) {
				projectMap.set(project.id, project.name);
			}

			cachedProjects = projectMap;
			cachedProjectsAt = Date.now();
		}

		setProjects(cachedProjects!);
		setTasks(taskResponse.results);
		setLoading(false);
	}, [view]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	const handleSubmit = async (value: string) => {
		const trimmed = value.trim();
		setInput('');
		setMessage('');

		if (!trimmed || trimmed === '?') {
			return;
		}

		const ctx = {
			api,
			tasks,
			projects,
			homeFilter,
			setMessage,
			setTasks,
			refresh,
			setView,
			exit,
		};

		const command = commands.find(c => trimmed.startsWith(c.prefix));

		if (command) {
			const args = trimmed.slice(command.prefix.length);
			await command.run(args, ctx);
		} else {
			setMessage(`Unknown command: ${trimmed}. Type ? for help`);
		}
	};

	const refreshIndicator = loading && (
		<Text color="cyan">
			{' '}
			<Spinner type="dots" />
		</Text>
	);

	const viewLabel = `dewy ∙ ${
		view.query === homeFilter ? 'home' : view.query
	} ∙ ${tasks.length} ${tasks.length === 1 ? 'item' : 'items'}`;

	return (
		<Box flexDirection="column">
			<Box flexDirection="column" paddingLeft={2}>
				<Text bold color="cyan">
					{viewLabel}
					{refreshIndicator}
				</Text>
				<Box
					flexDirection="column"
					borderStyle="round"
					borderColor="cyan"
					paddingX={1}
				>
					<TaskListView tasks={tasks} projects={projects} />
				</Box>
				<Text color="yellow">{message ? <Content text={message} /> : ' '}</Text>
			</Box>
			<CommandInput input={input} setInput={setInput} onSubmit={handleSubmit} />
		</Box>
	);
}
