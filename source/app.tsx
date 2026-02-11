import React, {useState, useEffect, useCallback} from 'react';
import {Box, Text, useApp} from 'ink';
import TextInput from 'ink-text-input';
import {TodoistApi, type Task} from '@doist/todoist-api-typescript';
import {type View, commands} from './commands.js';
import {priorityColor} from './utils.js';
import {loadConfig, configPath} from './config.js';
import EditView from './edit-view.js';

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
			: `dewy ∙ ${view.query}`;

	if (view.type === 'edit') {
		return (
			<Box flexDirection="column">
				<Text bold color="cyan">
					{viewLabel}
				</Text>
				<EditView
					task={view.task}
					api={api}
					onBack={() => {
						setView({type: 'filter', query: homeFilter});
						refresh();
					}}
				/>
			</Box>
		);
	}

	return (
		<Box flexDirection="column">
			<Text bold color="cyan">
				{viewLabel}
			</Text>
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
					{task.due?.date ? (
						<Text dimColor color="magenta">
							{' '}
							{task.due.date}
						</Text>
					) : (
						''
					)}
					{task.priority > 1 ? (
						<Text dimColor color={priorityColor(5 - task.priority)}>
							{' '}
							p{5 - task.priority}
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

			{input &&
				commands
					.filter(c => c.prefix.startsWith(input))
					.map(c => (
						<Text key={c.prefix} dimColor>
							{'  '}
							{c.hint}
						</Text>
					))}
		</Box>
	);
}
