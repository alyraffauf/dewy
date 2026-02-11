import React from 'react';
import {Box, Text} from 'ink';
import TextInput from 'ink-text-input';
import {type Task} from '@doist/todoist-api-typescript';
import {commands} from './commands.js';
import {priorityColor} from './utils.js';

type TaskListViewProps = {
	tasks: Task[];
	projects: Map<string, string>;
	message: string;
	input: string;
	setInput: (value: string) => void;
	onSubmit: (value: string) => Promise<void>;
};

export default function TaskListView({
	tasks,
	projects,
	message,
	input,
	setInput,
	onSubmit,
}: TaskListViewProps) {
	return (
		<>
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
				<TextInput value={input} onChange={setInput} onSubmit={onSubmit} />
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
		</>
	);
}
