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

function CommandHints({input}: {input: string}) {
	if (input === '?') {
		return commands.map(c => (
			<Text key={c.prefix} dimColor>
				{'  '}
				{c.hint}
			</Text>
		));
	}

	if (input) {
		return commands
			.filter(c => c.prefix.startsWith(input))
			.map(c => (
				<Text key={c.prefix} dimColor>
					{'  '}
					{c.hint}
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
	const [editingField, setEditingField] = useState(false);

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
			: `dewy ∙ ${view.query === homeFilter ? 'home' : view.query} ∙ ${
					tasks.length
			  } ${tasks.length === 1 ? 'item' : 'items'}`;

	const isEditing = view.type === 'edit';

	return (
		<Box flexDirection="column">
			<Box flexDirection="column" paddingLeft={2}>
				<Text bold color="cyan">
					{viewLabel}
				</Text>
				{isEditing ? (
					<>
						<Box
							flexDirection="column"
							borderStyle="round"
							borderColor="cyan"
							paddingX={1}
							width={50}
						>
							<EditView
								task={view.task}
								api={api}
								onBack={() => {
									setView({type: 'filter', query: homeFilter});
									refresh();
								}}
								onEditingChange={setEditingField}
							/>
						</Box>
						<Text dimColor>
							{'  '}
							{editingField
								? 'Enter to save ∙ Escape to cancel'
								: 'Enter to edit ∙ Escape to go back'}
						</Text>
					</>
				) : (
					<>
						<Box
							flexDirection="column"
							borderStyle="round"
							borderColor="cyan"
							paddingX={1}
						>
							<TaskListView tasks={tasks} projects={projects} />
						</Box>
						{message && <Text color="yellow">{message}</Text>}
					</>
				)}
			</Box>
			{!isEditing && (
				<CommandInput
					input={input}
					setInput={setInput}
					onSubmit={handleSubmit}
				/>
			)}
		</Box>
	);
}
