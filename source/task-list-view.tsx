import React from 'react';
import {Box, Text} from 'ink';
import {type Task} from '@doist/todoist-api-typescript';
import {priorityColor} from './utils.js';
import {Content} from './content.js';

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
	const numWidth = String(tasks.length).length;
	return (
		<>
			{tasks.length === 0 && <Text dimColor>No tasks</Text>}
			{tasks.map((task, i) => (
				<Box key={task.id}>
					<Box width={numWidth + 2} flexShrink={0}>
						<Text dimColor>{String(i + 1).padStart(numWidth)}.</Text>
					</Box>
					<Text wrap="wrap">
						<Content text={task.content} bold />
						<ProjectLabel name={projects.get(task.projectId)} />
						<Labels labels={task.labels} />
						<DueDate date={task.due?.date} />
						<Priority priority={task.priority} />
					</Text>
				</Box>
			))}
		</>
	);
}
