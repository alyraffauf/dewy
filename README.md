# dewy

A TUI for Todoist built with Ink + React.js + Typescript.

## Install

```bash
$ npm install --global dewy
```

## Usage

```
$ dewy
```

## Configuration

dewy uses a config file at `~/.config/dewy/config.json`:

```json
{
	"apiToken": "your-todoist-api-token",
	"homeFilter": "(today | overdue) & (assigned to: me | !assigned)"
}
```

| Key | Type | Required | Description |
|-----|------|----------|-------------|
| `apiToken` | string | yes | Your Todoist API token |
| `homeFilter` | string | no | Custom Todoist filter to apply on the home view |

## Commands

- `add <text>` - Add a new task via Todoist's QuickAdd
- `done <number>` - Complete a task by its number
- `refresh` - Reload tasks
- `project <name>` - View tasks in a project
- `today` - View today's tasks
- `home` - View the home filter
- `quit` - Exit

## License

GPL-3.0-or-later
