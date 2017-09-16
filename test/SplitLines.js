////////////////////////////////////////////////////////////////////////////
///                       Part of org-parser                             ///
////////////////////////////////////////////////////////////////////////////
/// \file SplitLines.js
/// \author Jamie Terry
/// \date 2017/09/10
/// \brief Tests the splitting of an org mode document into lines
////////////////////////////////////////////////////////////////////////////

"use strict";

require('./common');
let Org = require('..');

let Parser = new Org.Parser();

it('Empty String', () => {
	let x = Parser.splitLines('');
	expect(x.length).deep.equal(0);
});

it('Single Line', () => {
	let x = Parser.splitLines('Text');
	expect(x.length      ).deep.equal(1);
	expect(x[0].content  ).deep.equal('Text');
	expect(x[0].loc.start).deep.equal(new Org.TextLocation(0,1,1));
	expect(x[0].loc.end  ).deep.equal(new Org.TextLocation(3,1,4));
});

it('Single Line - Trailing \\n', () => {
	let x = Parser.splitLines('Hello\n');
	expect(x.length      ).deep.equal(1);
	expect(x[0].content  ).deep.equal('Hello');
	expect(x[0].loc.start).deep.equal(new Org.TextLocation(0,1,1));
	expect(x[0].loc.end  ).deep.equal(new Org.TextLocation(5,1,6));
});

it('Multiline', () => {
	let x = Parser.splitLines(
		'Text\n' +
		' \twhitespace  \r\n' +
		'Wordy words\n'
	);

	expect(x.length).deep.equals(3);
	expect(x[0].content).deep.equals('Text');
	expect(x[1].content).deep.equals(' \twhitespace  ');
	expect(x[2].content).deep.equals('Wordy words');

	expect(x[0].loc.start).deep.equals(new Org.TextLocation( 0, 1,  1));
	expect(x[0].loc.end  ).deep.equals(new Org.TextLocation( 4, 1,  5));
	expect(x[1].loc.start).deep.equals(new Org.TextLocation( 5, 2,  1));
	expect(x[1].loc.end  ).deep.equals(new Org.TextLocation(20, 2, 16));
	expect(x[2].loc.start).deep.equals(new Org.TextLocation(21, 3,  1));
	expect(x[2].loc.end  ).deep.equals(new Org.TextLocation(32, 3, 12));
});
