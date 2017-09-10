////////////////////////////////////////////////////////////////////////////
///                       Part of org-parser                             ///
////////////////////////////////////////////////////////////////////////////
/// \file ParserUtils.js
/// \author Jamie Terry
/// \date 2017/09/10
/// \brief Tests the parser utility function
////////////////////////////////////////////////////////////////////////////

require('./common');

describe('many vs some', () => {
	let many_a = P.many(P.string('a'));

	it('many allows none', () => {
		let result = many_a.parse('');

		expect(result.status).deep.equal(true);
		expect(result.value ).deep.equal([]);
	});
	it('many allows one', () => {
		let result = many_a.parse('a');

		expect(result.status).deep.equal(true);
		expect(result.value ).deep.equal(['a']);
	});
	it('many allows many', () => {
		let result = many_a.parse('aaa');

		expect(result.status).deep.equal(true);
		expect(result.value ).deep.equal(['a', 'a', 'a']);
	});

	let some_a = P.some(P.string('a'));
	it("some DOESN'T allows none", () => {
		let result = some_a.parse('');

		expect(result.status).deep.equal(false);
	});
	it('some allows one', () => {
		let result = some_a.parse('a');

		expect(result.status).deep.equal(true);
		expect(result.value ).deep.equal(['a']);
	});
	it('some allows many', () => {
		let result = some_a.parse('aaa');

		expect(result.status).deep.equal(true);
		expect(result.value ).deep.equal(['a', 'a', 'a']);
	});
});

describe('newline and eol', () => {
	it('\\n ends line', () => {
		let result = P.eol.parse('\n');
		expect(result.status).deep.equal(true);
		expect(result.value ).deep.equal('\n');
	});

	it('\\r\\n ends line', () => {
		let result = P.eol.parse('\r\n');
		expect(result.status).deep.equal(true);
		expect(result.value ).deep.equal('\r\n');
	});

	it('EOF ends line', () => {
		let result = P.eol.parse('');
		expect(result.status).deep.equal(true);
		expect(result.value ).deep.equal(null);
	});

	it('newline wont accept EOF', () => {
		let result = P.newline.parse('');
		expect(result.status).deep.equal(false);
	});

	it('eol wont consume non-newline characters', () => {
		let result = P.eol.parse('a');
		expect(result.status      ).deep.equal(false);
		expect(result.index.column).deep.equal(1);
		expect(result.index.line  ).deep.equal(1);
	});

	it('eol wont consume non-newline characters after newline', () => {
		let result = P.eol.parse('\na');
		expect(result.status      ).deep.equal(false);
		expect(result.index.column).deep.equal(1);
		expect(result.index.line  ).deep.equal(2);
		expect(result.expected).deep.equal(['EOF']);
	});

	it('eol wont consume multiple newline characters', () => {
		let result = P.eol.parse('\n\n');
		expect(result.status      ).deep.equal(false);
		expect(result.index.column).deep.equal(1);
		expect(result.index.line  ).deep.equal(2);
		expect(result.expected).deep.equal(['EOF']);
	});
});
