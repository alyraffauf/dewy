import {type TodoistApi, type Task} from '@doist/todoist-api-typescript';

export type View = {type: 'filter'; query: string} | {type: 'edit'; task: Task};

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
	run: (args: string, ctx: CommandContext) => Promise<void>;
};

export const commands: Command[] = [
	{
		prefix: 'done ',
		hint: 'done <number>',
		run: async (args, {api, tasks, setTasks, setMessage}) => {
			const num = Number.parseInt(args, 10);
			const task = tasks[num - 1];
			if (task) {
				await api.closeTask(task.id);
				setTasks(tasks.filter(t => t.id !== task.id));
			} else {
				setMessage(`No task #${num}`);
			}
		},
	},

	{
		prefix: 'edit ',
		hint: 'edit <number>',
		run: async (args, {tasks, setView, setMessage}) => {
			const num = Number.parseInt(args, 10);
			const task = tasks[num - 1];
			if (task) {
				setView({type: 'edit', task});
			} else {
				setMessage(`No task #${num}`);
			}
		},
	},

	{
		prefix: 'add ',
		hint: 'add <task>',
		run: async (args, {api, tasks, setTasks}) => {
			const task = await api.quickAddTask({text: args});
			setTasks([...tasks, task]);
		},
	},
	{
		prefix: 'filter ',
		hint: 'filter <query>',
		run: async (args, {setView}) => {
			setView({type: 'filter', query: args});
		},
	},
	{
		prefix: 'refresh',
		hint: 'refresh',
		run: async (_args, {refresh}) => {
			await refresh();
		},
	},

	{
		prefix: 'today',
		hint: 'today',
		run: async (_args, {setView}) => {
			setView({type: 'filter', query: 'today'});
		},
	},

	{
		prefix: 'home',
		hint: 'home',
		run: async (_args, {setView, homeFilter}) => {
			setView({type: 'filter', query: homeFilter});
		},
	},

	{
		prefix: 'quit',
		hint: 'quit',
		run: async (_args, {exit}) => {
			exit();
		},
	},
];
