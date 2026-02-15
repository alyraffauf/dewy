import React from 'react';
import {Text} from 'ink';
import Link from 'ink-link';
import {parseMdLink} from './utils.js';

export function Content({text, bold}: {text: string; bold?: boolean}) {
	const segments = parseMdLink(text);
	return (
		<>
			{segments.map((seg, i) =>
				seg.type === 'link' ? (
					<Link key={i} url={seg.url}>
						<Text color="cyan">↗ {seg.text}</Text>
					</Link>
				) : (
					<Text key={i} bold={bold}>
						{seg.text}
					</Text>
				),
			)}
		</>
	);
}
