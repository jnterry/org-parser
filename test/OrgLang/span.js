////////////////////////////////////////////////////////////////////////////
///                       Part of org-parser                             ///
////////////////////////////////////////////////////////////////////////////
/// \file span.js
/// \author Jamie Terry
/// \date 2017/09/10
/// \brief Tests the OrgLang.span parser
////////////////////////////////////////////////////////////////////////////

let span = OrgLang.span;

function checkParse(x){
	expect(x.status).deep.equal(true);

	expect(x.value.type   ).deep.equal(span.type);
	expect(x.value.style  ).to.exist;
	expect(x.value.content).to.exist;
}

describe('Basic Tests', () => {
	it('Single word', () => {
		let x = span.parser().parse('Hello');
		checkParse(x);
		expect(x.value.style  ).deep.equal(span.styles.NONE);
		expect(x.value.content).deep.equal(['Hello']);
		expect(x.value.loc.start).deep.equal({ offset: 0, line: 1, column: 1 });
		expect(x.value.loc.end  ).deep.equal({ offset: 5, line: 1, column: 6 });
	});

	it('Multiple words', () => {
		let x = span.parser().parse('Hello World!');
		checkParse(x);
		expect(x.value.style  ).deep.equal(span.styles.NONE);
		expect(x.value.content).deep.equal(['Hello World!']);
		expect(x.value.loc.start).deep.equal({ offset:  0, line: 1, column:  1 });
		expect(x.value.loc.end  ).deep.equal({ offset: 12, line: 1, column: 13 });
	});

	it('Surrounding whitespace is trimmed', () => {
		let x = span.parser().parse(' trailing spaces ');
		checkParse(x);
		expect(x.value.style  ).deep.equal(span.styles.NONE);
		expect(x.value.content).deep.equal(['trailing spaces']);
		expect(x.value.loc.start).deep.equal({ offset:  0, line: 1, column:  1 });
		expect(x.value.loc.end  ).deep.equal({ offset: 17, line: 1, column: 18 });
	});

	it('Delimited', () => {
		let x = span.parser('|').skip(P.all).parse(' cell A | next table cell |');
		checkParse(x);
		expect(x.value.style).deep.equal(span.styles.NONE);
		expect(x.value.content).deep.equal(['cell A']);

		expect(x.value.loc.start).deep.equal({ offset: 0, line: 1, column: 1 });
		expect(x.value.loc.end  ).deep.equal({ offset: 8, line: 1, column: 9 });
	});
});

function wrappedFormatSuite(style_type, symbol){
	it('Single Word', () => {
		let x = span.parser().parse(symbol + 'word' + symbol);
		checkParse(x);
		expect(x.value.style  ).deep.equal(style_type);
		expect(x.value.content).deep.equal(['word']);
		//expect(x.loc.start.line  ).deep.equal(1);
		//expect(x.loc.start.column).deep.equal(1);
		//expect(x.loc.start.line  ).deep.equal(1);
		//expect(x.loc.start.column).deep.equal(6);
	});

	it('Multi-Word', () => {
		let x = span.parser().parse(symbol + 'text here' + symbol);
		checkParse(x);
		expect(x.value.style  ).deep.equal(style_type);
		expect(x.value.content).deep.equal(['text here']);
		//expect(x.loc.start.line  ).deep.equal( 1);
		//expect(x.loc.start.column).deep.equal( 1);
		//expect(x.loc.start.line  ).deep.equal( 1);
		//expect(x.loc.start.column).deep.equal(11);
	});

	it("Opener followed by whitespace doesn't open section", () => {
		let text = symbol + ' word' + symbol;
		let x = span.parser().parse(text);
		checkParse(x);
		expect(x.value.style  ).deep.equal(span.styles.NONE);
		expect(x.value.content).deep.equal([text]);
		//expect(x.loc.start.line  ).deep.equal(1);
		//expect(x.loc.start.column).deep.equal(1);
		//expect(x.loc.start.line  ).deep.equal(1);
		//expect(x.loc.start.column).deep.equal(7);
	});

	it("Closer preceeded by whitespace doesn't close section", () => {
		let text = 'words ' + symbol + ' here';
		let x = span.parser().parse(symbol + text + symbol);
		checkParse(x);
		expect(x.value.style  ).deep.equal(style_type);
		expect(x.value.content).deep.equal([text]);
		//expect(x.loc.start.line  ).deep.equal( 1);
		//expect(x.loc.start.column).deep.equal( 1);
		//expect(x.loc.start.line  ).deep.equal( 1);
		//expect(x.loc.start.column).deep.equal(12);
	});
}

describe('Single Formatting', () => {
 	describe('Bold', () => {
		wrappedFormatSuite(span.styles.BOLD,          '*');
	});
	describe('Underline', () => {
		wrappedFormatSuite(span.styles.UNDERLINE,     '_');
	});
	describe('Italic', () => {
		wrappedFormatSuite(span.styles.ITALIC,        '/');
	});
	describe('Verbatim', () => {
		wrappedFormatSuite(span.styles.VERBATIM,      '=');
	});
	describe('Code', () => {
		wrappedFormatSuite(span.styles.CODE,          '~');
	});
	describe('Strikethrough', () => {
		wrappedFormatSuite(span.styles.STRIKETHROUGH, '+');
	});
});

describe('Multiple Spans', () => {
	it('Multiple plain lines', () => {
		let text = 'Hello\nWorld\nHere is some text';
		let x = P.many(span.parser('\r\n')).parse(text);

		expect(x.status).deep.equal(true);
		expect(x.value.length === 3);

		expect(x.value[0].style  ).deep.equal(span.styles.NONE);
		expect(x.value[0].content).deep.equal(['Hello']);
		expect(x.value[0].loc.start).deep.equal({ offset: 0, column: 1, line: 1 });
		expect(x.value[0].loc.end  ).deep.equal({ offset: 5, column: 6, line: 1 });

		expect(x.value[1].style  ).deep.equal(span.styles.NONE);
		expect(x.value[1].content).deep.equal(['World']);
		expect(x.value[1].loc.start).deep.equal({ offset:  6, column: 1, line: 2 });
		expect(x.value[1].loc.end  ).deep.equal({ offset: 11, column: 6, line: 2 });

		expect(x.value[2].style  ).deep.equal(span.styles.NONE);
		expect(x.value[2].content).deep.equal(['Here is some text']);
		expect(x.value[2].loc.start).deep.equal({ offset: 12, column:  1, line: 3 });
		expect(x.value[2].loc.end  ).deep.equal({ offset: 29, column: 18, line: 3 });
	});

	it('Multiple lines', () => {
		let text = 'Hello\n*Bob is my name*\n_How are you_?';
		let x = P.many(span.parser('\r\n')).parse(text);
		expect(x.status).deep.equal(true);
		expect(x.value.length === 3);

		expect(x.value[0].style  ).deep.equal(span.styles.NONE);
		expect(x.value[0].content).deep.equal(['Hello']);

		//expect(x.value[1].style  ).deep.equal(span.styles.BOLD);
		expect(x.value[1].content).deep.equal(['Bob is my name']);

		expect(x.value[2].style     ).deep.equal(span.styles.NONE);
		expect(x.value[2].content[0].content).deep.equal(['How are you']);
		expect(x.value[2].content[0].style).deep.equal(span.styles.UNDERLINE);
		expect(x.value[2].content[1]).deep.equal('?');
	});
});
