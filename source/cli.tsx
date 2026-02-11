#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import App from './app.js';

meow(
	`
	Usage
	  $ dewy

	Options
	  --version  Show version

	Examples
	  $ dewy
`,
	{
		importMeta: import.meta,
	},
);

render(<App />);
