import React, {useState, useEffect, useCallback} from 'react';
import {Box, Text, useApp} from 'ink';
import TextInput from 'ink-text-input';
import {TodoistApi, type Task} from '@doist/todoist-api-typescript';
import {type View, commands} from './commands.js';
import {loadConfig, configPath} from './config.js';
import EditView from './edit-view.js';
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
		if (view.type === 'edit') {
			return;
		}

		setLoading(true);

		const [taskResponse, projectResponse] = await Promise.all([
			api.getTasksByFilter({query: view.query}),
			api.getProjects(),
		]);

		const projectMap = new Map<string, string>();
		for (const project of projectResponse.results) {
			projectMap.set(project.id, project.name);
		}

		setProjects(projectMap);
		setTasks(taskResponse.results);
		setLoading(false);
	}, [view]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	const handleSubmit = async (value: string) => {
		const trimmed = value.trim();
		setInput('');

		if (!trimmed || trimmed === '?') {
			return;
		}

		const ctx = {
			api,
			tasks,
			projects,
			homeFilter,
			setMessage,
			refresh,
			setView,
			exit,
		};

		const command = commands.find(c => trimmed.startsWith(c.prefix));

		if (command) {
			const args = trimmed.slice(command.prefix.length);
			await command.run(args, ctx);
		} else {
			setMessage(`Unknown command: ${trimmed}`);
		}
	};

	if (loading) {
		return <Text>Loading tasks...</Text>;
	}

	const viewLabel =
		view.type === 'edit'
			? `dewy ∙ edit: ${view.task.content}`
			: `dewy ∙ ${view.query === homeFilter ? 'home' : view.query}`;

	if (view.type === 'edit') {
		return (
			<Box flexDirection="column" paddingLeft={2}>
				<Text bold color="cyan">
					{viewLabel}
				</Text>
				<Box
					flexDirection="column"
					borderStyle="round"
					borderColor="cyan"
					paddingX={1}
				>
					<EditView
						task={view.task}
						api={api}
						onBack={() => {
							setView({type: 'filter', query: homeFilter});
							refresh();
						}}
					/>
				</Box>
			</Box>
		);
	}

	return (
		<Box flexDirection="column">
			<Box flexDirection="column" paddingLeft={2}>
				<TaskListView tasks={tasks} projects={projects} viewLabel={viewLabel} />
				{message && <Text color="yellow">{message}</Text>}
			</Box>
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
					<TextInput
						value={input}
						onChange={setInput}
						onSubmit={handleSubmit}
					/>
				</Box>
			</Box>
			{input === '?' ? (
				commands.map(c => (
					<Text key={c.prefix} dimColor>
						{'  '}
						{c.hint}
					</Text>
				))
			) : input ? (
				commands
					.filter(c => c.prefix.startsWith(input))
					.map(c => (
						<Text key={c.prefix} dimColor>
							{'  '}
							{c.hint}
						</Text>
					))
			) : (
				<Text dimColor>{'  type ? for help'}</Text>
			)}
		</Box>
	);
}
