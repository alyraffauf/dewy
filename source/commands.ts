import {type TodoistApi, type Task} from '@doist/todoist-api-typescript';

export type View = {type: 'filter'; query: string} | {type: 'edit'; task: Task};

export type CommandContext = {
	api: TodoistApi;
	tasks: Task[];
	projects: Map<string, string>;
	homeFilter: string;
	setMessage: (msg: string) => void;

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
		run: async (args, {api, tasks, setMessage, refresh}) => {
			const num = Number.parseInt(args, 10);
			const task = tasks[num - 1];
			if (task) {
				await api.closeTask(task.id);
				setMessage(`✓ ${task.content}`);
				await refresh();
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
		run: async (args, {api, setMessage, refresh}) => {
			await api.quickAddTask({text: args});
			setMessage(`+ ${args}`);
			await refresh();
		},
	},
	{
		prefix: 'filter ',
		hint: 'filter <query>',
		run: async (args, {setMessage, setView}) => {
			setView({type: 'filter', query: args});
			setMessage('⊳ filtered');
		},
	},
	{
		prefix: 'refresh',
		hint: 'refresh',
		run: async (_args, {refresh, setMessage}) => {
			await refresh();
			setMessage('↻ refreshed');
		},
	},

	{
		prefix: 'today',
		hint: 'today',
		run: async (_args, {setView, setMessage}) => {
			setView({type: 'filter', query: 'today'});
			setMessage('→ today');
		},
	},

	{
		prefix: 'home',
		hint: 'home',
		run: async (_args, {setView, setMessage, homeFilter}) => {
			setView({type: 'filter', query: homeFilter});
			setMessage('→ home');
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
