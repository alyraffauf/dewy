import {type TodoistApi, type Task} from '@doist/todoist-api-typescript';

export type View = {type: 'filter'; query: string};

export type CommandContext = {
	api: TodoistApi;
	tasks: Task[];
	projects: Map<string, string>;
	homeFilter: string;
	setMessage: (msg: string) => void;
	setTasks: (tasks: Task[]) => void;
	refresh: () => Promise<void>;
	setView: (view: View) => void;
	exit: () => void;
};
type Command = {
	prefix: string;
	hint: string;
	description: string;
	group: 'tasks' | 'nav' | 'app';
	run: (args: string, ctx: CommandContext) => Promise<void>;
};

export const commands: Command[] = [
	{
		prefix: 'done ',
		hint: 'done <n>',
		description: 'complete a task',
		group: 'tasks',
		run: async (args, {api, tasks, setTasks, setMessage}) => {
			const num = Number.parseInt(args, 10);
			const task = tasks[num - 1];
			if (task) {
				await api.closeTask(task.id);
				setTasks(tasks.filter(t => t.id !== task.id));
			} else {
				setMessage(`Not found: task ${num}`);
			}
		},
	},

	{
		prefix: 'edit ',
		hint: 'edit <n> <field> <value>',
		description: 'edit a task field',
		group: 'tasks',
		run: async (args, {api, tasks, projects, setTasks, setMessage}) => {
			const spaceIdx = args.indexOf(' ');
			const numStr = spaceIdx === -1 ? args : args.slice(0, spaceIdx);
			const rest = spaceIdx === -1 ? '' : args.slice(spaceIdx + 1).trim();
			const num = Number.parseInt(numStr, 10);
			const task = tasks[num - 1];

			if (!task) {
				setMessage(`Not found: task ${num}`);
				return;
			}

			if (!rest) {
				setMessage('Missing field. Use due|p1-p4|labels|desc|project|title');
				return;
			}

			let updated: Task;

			if (rest.startsWith('due ')) {
				updated = await api.updateTask(task.id, {
					dueString: rest.slice(4),
				});
			} else if (/^p[1-4]$/.test(rest)) {
				updated = await api.updateTask(task.id, {
					priority: 5 - Number.parseInt(rest[1]!, 10),
				});
			} else if (rest.startsWith('labels ')) {
				const labels = rest
					.slice(7)
					.split(/\s+/)
					.map(l => l.replace(/^@/, ''));
				updated = await api.updateTask(task.id, {labels});
			} else if (rest.startsWith('desc ')) {
				updated = await api.updateTask(task.id, {
					description: rest.slice(5),
				});
			} else if (rest.startsWith('project ')) {
				const name = rest.slice(8).replace(/^#/, '');
				const projectId = [...projects.entries()].find(
					([, n]) => n.toLowerCase() === name.toLowerCase(),
				)?.[0];
				if (!projectId) {
					setMessage(`Not found: project ${name}`);
					return;
				}

				updated = await api.moveTask(task.id, {projectId});
			} else if (rest.startsWith('title ')) {
				updated = await api.updateTask(task.id, {
					content: rest.slice(6),
				});
			} else {
				setMessage(
					`Unknown field: ${
						rest.split(' ')[0]
					}. Use due|p1-p4|labels|desc|project|title`,
				);
				return;
			}

			setTasks(tasks.map(t => (t.id === task.id ? updated : t)));
		},
	},

	{
		prefix: 'desc ',
		hint: 'desc <n>',
		description: 'show task description',
		group: 'tasks',
		run: async (args, {tasks, setMessage}) => {
			const num = Number.parseInt(args, 10);
			const task = tasks[num - 1];
			if (task) {
				setMessage(`desc ${num}: ${task.description || 'n/a'}`);
			} else {
				setMessage(`Not found: task ${num}`);
			}
		},
	},

	{
		prefix: 'add ',
		hint: 'add <task>',
		description: 'add a new task',
		group: 'tasks',
		run: async (args, {api, tasks, setTasks}) => {
			const task = await api.quickAddTask({text: args});
			setTasks([...tasks, task]);
		},
	},
	{
		prefix: 'filter ',
		hint: 'filter <query>',
		description: 'filter tasks',
		group: 'nav',
		run: async (args, {setView}) => {
			setView({type: 'filter', query: args});
		},
	},
	{
		prefix: 'refresh',
		hint: 'refresh',
		description: 'refresh tasks',
		group: 'nav',
		run: async (_args, {refresh}) => {
			await refresh();
		},
	},

	{
		prefix: 'today',
		hint: 'today',
		description: "show today's tasks",
		group: 'nav',
		run: async (_args, {setView}) => {
			setView({type: 'filter', query: 'today'});
		},
	},

	{
		prefix: 'home',
		hint: 'home',
		description: 'go to home view',
		group: 'nav',
		run: async (_args, {setView, homeFilter}) => {
			setView({type: 'filter', query: homeFilter});
		},
	},

	{
		prefix: 'quit',
		hint: 'quit',
		description: 'exit dewy',
		group: 'app',
		run: async (_args, {exit}) => {
			exit();
		},
	},
];
