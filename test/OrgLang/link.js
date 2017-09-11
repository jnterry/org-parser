////////////////////////////////////////////////////////////////////////////
///                       Part of org-parser                             ///
////////////////////////////////////////////////////////////////////////////
/// \file link.js
/// \author Jamie Terry
/// \date 2017/09/10
/// \brief Tests the OrgLang.link parser
////////////////////////////////////////////////////////////////////////////

let node = OrgLang.link;

function checkParse(x){
	expect(x.status).deep.equal(true);

	expect(x.value.type  ).deep.equal(node.type);
	expect(x.value.target).to.exist;
}

describe('basic valid', () => {
	it('url without text', () => {
		let result = node.parser.parse('[[https://example.com]]');
		checkParse(result);
		expect(result.value.target).deep.equal('https://example.com');
		expect(result.value.text  ).deep.equal(undefined);
	});

	it('url with text', () => {
		let result = node.parser.parse('[[https://example.com][click here]]');
		checkParse(result);
		expect(result.value.target).deep.equal('https://example.com');
		expect(result.value.text  ).deep.equal('click here');
	});

	it('target with whitespace', () => {
		let result = node.parser.parse('[[link target][text]]');
		checkParse(result);
		expect(result.value.target).deep.equal('link target');
		expect(result.value.text  ).deep.equal('text');
	});
});

describe('invalid formats', () => {
	itFail(node.parser, '[[a]',       { line: 1 }           );
	itFail(node.parser, '[a]]',       { line: 1 }           );
	itFail(node.parser, '[a]' ,       { line: 1 }           );
	itFail(node.parser, '[[a] [b]]',  { line: 1, column: 5 });
	itFail(node.parser, '[[a]b]',     { line: 1, column: 5 });
	itFail(node.parser, '[[a\n][b]]', { line: 1, column: 4 });
});
