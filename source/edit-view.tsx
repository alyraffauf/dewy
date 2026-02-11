import React, {useState} from 'react';
import {Box, Text, useInput} from 'ink';
import TextInput from 'ink-text-input';
import {type TodoistApi, type Task} from '@doist/todoist-api-typescript';
import {priorityColor} from './utils.js';

type EditViewProps = {
	task: Task;
	api: TodoistApi;
	onBack: () => void;
};

const fields = [
	{key: 'content', label: 'Title', color: () => undefined},
	{key: 'description', label: 'Description', color: () => 'gray'},
	{key: 'due', label: 'Due', color: () => 'magenta'},
	{
		key: 'priority',
		label: 'Priority',
		color: (v: string) => priorityColor(Number.parseInt(v, 10)),
	},
	{key: 'labels', label: 'Labels', color: () => 'yellow'},
];

function getFieldValue(task: Task, key: string): string {
	switch (key) {
		case 'content':
			return task.content;
		case 'description':
			return task.description;
		case 'due':
			return task.due?.string ?? '';
		case 'priority':
			return String(5 - task.priority);
		case 'labels':
			return task.labels.join(', ');
		default:
			return '';
	}
}

function buildUpdateArgs(key: string, value: string) {
	switch (key) {
		case 'content':
			return {content: value};
		case 'description':
			return {description: value};
		case 'due':
			return value ? {dueString: value} : {dueString: 'no date'};
		case 'priority':
			return {
				priority: Math.max(
					1,
					Math.min(4, 5 - (Number.parseInt(value, 10) || 4)),
				),
			};
		case 'labels':
			return {
				labels: value
					.split(',')
					.map(l => l.trim())
					.filter(Boolean),
			};
		default:
			return {};
	}
}

export default function EditView({task, api, onBack}: EditViewProps) {
	const [cursor, setCursor] = useState(0);
	const [editing, setEditing] = useState(false);
	const [editValue, setEditValue] = useState('');
	const [fieldValues, setFieldValues] = useState(() =>
		Object.fromEntries(fields.map(f => [f.key, getFieldValue(task, f.key)])),
	);

	const handleSave = async (value: string) => {
		const field = fields[cursor]!;
		const args = buildUpdateArgs(fields[cursor]!.key, value);
		await api.updateTask(task.id, args);
		setFieldValues(prev => ({...prev, [field.key]: value}));
		setEditing(false);
	};

	useInput(
		(input, key) => {
			if (key.upArrow || input === 'k') {
				setCursor(c => Math.max(0, c - 1));
			}

			if (key.downArrow || input === 'j') {
				setCursor(c => Math.min(fields.length - 1, c + 1));
			}

			if (key.escape) {
				onBack();
			}

			if (key.return && !editing) {
				setEditing(true);
				setEditValue(getFieldValue(task, fields[cursor]!.key));
			}
		},
		{isActive: !editing},
	);

	useInput(
		(_input, key) => {
			if (key.escape) {
				setEditing(false);
			}
		},
		{isActive: editing},
	);

	return (
		<Box flexDirection="column">
			{fields.map((f, i) => (
				<Text key={f.key}>
					{cursor === i ? '> ' : '  '}
					{f.label.padEnd(14)}
					{cursor === i && editing ? (
						<TextInput
							value={editValue}
							onChange={setEditValue}
							onSubmit={handleSave}
						/>
					) : (
						<Text color={f.color(fieldValues[f.key] ?? '')}>
							{fieldValues[f.key]}
						</Text>
					)}
				</Text>
			))}
			<Text dimColor>
				{editing
					? '  Enter to save ∙ Escape to cancel'
					: '  Enter to edit ∙ Escape to go back'}
			</Text>
		</Box>
	);
}
