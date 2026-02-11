import React from 'react';
import {Text} from 'ink';
import {type Task} from '@doist/todoist-api-typescript';
import {priorityColor} from './utils.js';

type TaskListViewProps = {
	tasks: Task[];
	projects: Map<string, string>;
};

function ProjectLabel({name}: {name: string | undefined}) {
	if (!name) return null;
	return (
		<Text dimColor color="blue">
			{' '}
			#{name}
		</Text>
	);
}

function Labels({labels}: {labels: string[]}) {
	if (labels.length === 0) return null;
	return (
		<Text dimColor color="yellow">
			{' '}
			{labels.map(l => `@${l}`).join(' ')}
		</Text>
	);
}

function DueDate({date}: {date: string | undefined}) {
	if (!date) return null;
	return (
		<Text dimColor color="magenta">
			{' '}
			{date}
		</Text>
	);
}

function Priority({priority}: {priority: number}) {
	const display = 5 - priority;
	if (display >= 4) return null;
	return (
		<Text dimColor color={priorityColor(display)}>
			{' '}
			p{display}
		</Text>
	);
}

export default function TaskListView({tasks, projects}: TaskListViewProps) {
	return (
		<>
			{tasks.length === 0 && <Text dimColor>No tasks</Text>}
			{tasks.map((task, i) => (
				<Text key={task.id}>
					<Text dimColor>{i + 1}.</Text> {task.content}
					<ProjectLabel name={projects.get(task.projectId)} />
					<Labels labels={task.labels} />
					<DueDate date={task.due?.date} />
					<Priority priority={task.priority} />
				</Text>
			))}
		</>
	);
}
