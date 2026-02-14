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

export type ContentSegment =
	| {type: 'text'; text: string}
	| {type: 'link'; text: string; url: string};

export function parseMdLink(content: string): ContentSegment[] {
	const segments: ContentSegment[] = [];
	const linkPattern =
		/\[((?:\[[^\]]*\]|[^\]])+)\]\(([^)]+)\)|(https?:\/\/[^\s)]+)/g;

	let lastIndex = 0;
	let match;

	while ((match = linkPattern.exec(content)) !== null) {
		if (match.index > lastIndex) {
			segments.push({
				type: 'text',
				text: content.slice(lastIndex, match.index),
			});
		}

		if (match[1] && match[2]) {
			segments.push({type: 'link', text: match[1], url: match[2]});
		} else if (match[3]) {
			segments.push({type: 'link', text: match[3], url: match[3]});
		}

		lastIndex = match.index + match[0].length;
	}

	if (lastIndex < content.length) {
		segments.push({type: 'text', text: content.slice(lastIndex)});
	}

	return segments;
}
