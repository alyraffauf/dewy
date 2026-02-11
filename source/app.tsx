import React, {useState, useEffect, useCallback} from 'react';
import {Box, Text, useApp} from 'ink';
import TextInput from 'ink-text-input';
import {TodoistApi, type Task} from '@doist/todoist-api-typescript';

const token = process.env['TODOIST_API_TOKEN'];
if (!token) {
	console.error('Set TODOIST_API_TOKEN environment variable');
	process.exit(1);
}

const api = new TodoistApi(token);

export default function App() {
	const {exit} = useApp();
	const [tasks, setTasks] = useState<Task[]>([]);
	const [projects, setProjects] = useState<Map<string, string>>(new Map());
	const [loading, setLoading] = useState(true);
	const [input, setInput] = useState('');
	const [message, setMessage] = useState('');

	const fetchTasks = useCallback(async () => {
		setLoading(true);

		const [taskResponse, projectResponse] = await Promise.all([
			api.getTasksByFilter({query: 'today'}),
			api.getProjects(),
		]);

		const projectMap = new Map<string, string>();
		for (const project of projectResponse.results) {
			projectMap.set(project.id, project.name);
		}

		setProjects(projectMap);
		setTasks(taskResponse.results);

		setLoading(false);
	}, []);

	useEffect(() => {
		fetchTasks();
	}, [fetchTasks]);

	const handleSubmit = async (value: string) => {
		const trimmed = value.trim();
		setInput('');

		if (trimmed.startsWith('done ')) {
			// "done 2" → complete task #2
			const num = Number.parseInt(trimmed.slice(5), 10);
			const task = tasks[num - 1]; // arrays are 0-indexed, display is 1-indexed
			if (task) {
				await api.closeTask(task.id);
				setMessage(`Completed: ${task.content}`);
				await fetchTasks(); // refresh the list
			} else {
				setMessage(`No task #${num}`);
			}
		} else if (trimmed.startsWith('add ')) {
			const text = trimmed.slice(4);
			await api.quickAddTask({text});
			setMessage(`Added: ${text}`);
			await fetchTasks();
		} else if (trimmed === 'refresh') {
			await fetchTasks();
			setMessage('Refreshed');
		} else if (trimmed === 'quit') {
			exit();
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
