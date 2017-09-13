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
		//expect(x.value.loc.start.line  ).deep.equal(1);
		//expect(x.value.loc.start.column).deep.equal(1);
		//expect(x.value.loc.end.line    ).deep.equal(1);
		//expect(x.value.loc.end.column  ).deep.equal(6);
	});

	it('Multiple words', () => {
		let x = span.parser().parse('Hello World!');
		checkParse(x);
		expect(x.value.style  ).deep.equal(span.styles.NONE);
		expect(x.value.content).deep.equal(['Hello World!']);
		//expect(x.value.loc.start.line  ).deep.equal( 1);
		//expect(x.value.loc.start.column).deep.equal( 1);
		//expect(x.value.loc.end.line    ).deep.equal( 1);
		//expect(x.value.loc.end.column  ).deep.equal(13);
	});

	it('Surrounding whitespace is trimmed', () => {
		let x = span.parser().parse(' trailing spaces ');
		checkParse(x);
		expect(x.value.style  ).deep.equal(span.styles.NONE);
		expect(x.value.content).deep.equal(['trailing spaces']);
		//expect(x.value.loc.start.line  ).deep.equal( 1);
		//expect(x.value.loc.start.column).deep.equal( 2);
		//expect(x.value.loc.end.line    ).deep.equal( 1);
		//expect(x.value.loc.end.column  ).deep.equal(18);
	});

	it('Delimited', () => {
		let x = span.parser('|').skip(P.all).parse(' cell A | next table cell |');
		checkParse(x);
		expect(x.value.style).deep.equal(span.styles.NONE);
		expect(x.value.content).deep.equal(['cell A']);
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
