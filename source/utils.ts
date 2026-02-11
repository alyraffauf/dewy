export function priorityColor(displayPriority: number): string | undefined {
	switch (displayPriority) {
		case 1:
			return 'red';
		case 2:
			return 'yellow';
		case 3:
			return 'blue';
		default:
			return undefined;
	}
}
