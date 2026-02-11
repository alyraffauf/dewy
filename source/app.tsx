import React, {useState, useEffect, useCallback} from 'react';
import {Box, Text, useApp} from 'ink';
import TextInput from 'ink-text-input';
import {TodoistApi, type Task} from '@doist/todoist-api-typescript';
import {commands} from './commands.js';
import {loadConfig, configPath} from './config.js';

const config = loadConfig();
const apiToken = config?.apiToken ?? process.env['TODOIST_API_TOKEN'];

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

	const [view, setView] = useState<
		{type: 'filter'; query: string} | {type: 'project'; projectId: string}
	>({
		type: 'filter',
		query: 'today',
	});

	const [loading, setLoading] = useState(true);
	const [input, setInput] = useState('');
	const [message, setMessage] = useState('');

	const refresh = useCallback(async () => {
		setLoading(true);

		const [taskResponse, projectResponse] = await Promise.all([
			view.type === 'filter'
				? api.getTasksByFilter({query: view.query})
				: api.getTasks({projectId: view.projectId}),
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

		const ctx = {
			api,
			tasks,
			projects,
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

	return (
		<Box flexDirection="column">
			{tasks.map((task, i) => (
				<Text key={task.id}>
					<Text dimColor>{i + 1}.</Text> {task.content}
					{projects.get(task.projectId) ? (
						<Text dimColor color="blue">
							{' '}
							#{projects.get(task.projectId)}
						</Text>
					) : (
						''
					)}
					{task.labels.length > 0 ? (
						<Text dimColor color="yellow">
							{' '}
							{task.labels.map(l => `@${l}`).join(' ')}
						</Text>
					) : (
						''
					)}
				</Text>
			))}
			{message && <Text color="yellow">{message}</Text>}
			<Box>
				<Text bold color="green">
					{'> '}
				</Text>
				<TextInput value={input} onChange={setInput} onSubmit={handleSubmit} />
			</Box>
		</Box>
	);
}
