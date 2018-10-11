////////////////////////////////////////////////////////////////////////////
///                       Part of org-parser                             ///
////////////////////////////////////////////////////////////////////////////
/// \file ParserUtils.js
/// \author Jamie Terry
/// \date 2017/09/10
/// \brief Tests the parser utility function
////////////////////////////////////////////////////////////////////////////

require('./common');

function expectParse(x, value){
	expect(x.status).deep.equal(true);
	expect(x.value ).deep.equal(value);
}

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

describe('manyUntil', () => {
	describe('normal operation', () => {
		it('abcdef - many any until d', () => {
			let result = P.seq(
				P.manyUntil(P.any, P.string('d')),
				P.all
			).parse('abcdef');
			expect(result.status).deep.equal(true);
			expect(result.value ).deep.equal([
				{ list: ['a', 'b', 'c'],
				  last: 'd',
				},
				'ef'
			]);
		});

		it('abcdef - consume a, then many any until d', () => {
			// this test is to ensure that manyUntil starts at right point of input sting
			let result = P.seq(
				P.any,
				P.manyUntil(P.any, P.string('d')),
				P.all
			).parse('abcdef');
			expect(result.status).deep.equal(true);
			expect(result.value ).deep.equal([
				'a',
				{ list: ['b', 'c'],
				  last: 'd',
				},
				'ef'
			]);
		});

		it('abacada1 - many a(letter) until a(digit)', () => {
			// ensure the many part doesn't eat a common prefix with the last part
			let result = P.manyUntil(P.regex(/a[a-z]/), P.regex(/a\d/)).parse('abacada1');
			expect(result.status).deep.equal(true);
			expect(result.value ).deep.equal(
				{ list: ['ab', 'ac', 'ad'],
				  last: 'a1',
				}
			);
		});

		it('many part can consume nothing', () => {
			let result = P.manyUntil(P.string('a'), P.string('b')).parse('b');
			expect(result.status).deep.equal(true);
			expect(result.value ).deep.equal({
				list: [],
				last: 'b',
			});
		});

		it('ends if until part matches, even when many part matches', () => {
			let result = P.manyUntil(P.any, P.string('END')).parse('abcEND');
			expect(result.status).deep.equal(true);
			expect(result.value ).deep.equal({
				list: ['a', 'b', 'c'],
				last: 'END',
			});
		});
	});

	describe('failures', () => {
		it('Fails if a fails before b is encountered', () => {
			let result = P.manyUntil(P.alt(P.string('a'), P.string('b')), P.string('c')).parse('abaadc');
			expect(result.status).deep.equal(false);
			expect(result.index.line  ).deep.equal(1);
			expect(result.index.column).deep.equal(5);
		});

		it('Fails if EOF is encountered before b passes', () => {
			let result = P.manyUntil(P.string('a'), P.string('b')).parse('aaa');
			expect(result.status).deep.equal(false);
			expect(result.index.line  ).deep.equal(1);
			expect(result.index.column).deep.equal(4);

		});

	});
});

describe('someUntil', () => {
	describe('normal operation', () => {
		it('digits until letter', () => {
			let result = P.someUntil(P.digit, P.letter).parse('123a');
			expect(result.status).deep.equal(true);
			expect(result.value).deep.equal({
				list: ['1', '2', '3'],
				last: 'a',
			});
		});

		it('starts and ends with correct offset', () => {
			let result = P.seq(
				P.some(P.digit),
				P.whitespace,
				P.someUntil(P.letter, P.whitespace),
				P.all
			).parse('12 abcd\t\nhello!');
			expect(result.status).deep.equal(true);
			expect(result.value ).deep.equal([
				['1', '2'],
				' ',
				{ list: ['a', 'b', 'c', 'd'],
				  last: '\t\n',
				},
				'hello!'
			]);
		});
	});
	describe('failures', () => {
		it("fails if doesn't start with some part or until part", () => {
			let result = P.seq(
				P.string('!'),
				P.someUntil(P.string('a'), P.string('b'))
			).parse('!c');
			expect(result.status).deep.equal(false);
			expect(result.index.line  ).deep.equal(1);
			expect(result.index.column).deep.equal(2);
		});

		it('fails if until matches without any some part matches', () => {
			let result = P.someUntil(P.string('a'), P.string('b')).parse('b');
			expect(result.status).deep.equal(false);
			expect(result.index.line  ).deep.equal(1);
			expect(result.index.column).deep.equal(1);
			//expect(result.expected).deep.equal(["'a'"]);
		});

		it('fails if until matches without any some part matches, even if some part does match', () => {
			let result = P.someUntil(P.string('a'), P.letter).parse('ab');
			expect(result.status).deep.equal(false);
			expect(result.index.line  ).deep.equal(1);
			expect(result.index.column).deep.equal(1);
			//expect(result.expected).deep.equal(['a']);
		});

		it('fails if EOF seen before until', () => {
			let result = P.someUntil(P.string('a'), P.string('b')).parse('aa');
			expect(result.status).deep.equal(false);
			expect(result.index.line  ).deep.equal(1);
			expect(result.index.column).deep.equal(3);
		});

		it('fails if some part fails before until part matches', () => {
			let result = P.someUntil(P.string('a'), P.string('b')).parse('acb');
			expect(result.status).deep.equal(false);
			expect(result.index.line  ).deep.equal(1);
			expect(result.index.column).deep.equal(2);
		});
	});
});

describe('newline and eol', () => {
	it('\\n ends line', () => {
		expectParse(P.eol.parse('\n'), '\n');
	});

	it('\\r\\n ends line', () => {
		expectParse(P.eol.parse('\r\n'), '\r\n');
	});

	it('EOF ends line', () => {
		expectParse(P.eol.parse(''), null);
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

describe('anyButEol', () => {
	it('a', () => {
		expectParse(P.anyButEol.parse('a'), 'a');
	});

	it('\\n', () => {
		expectFail(P.anyButEol.parse('\n'),
		           { line: 1, column: 1 }
		          );
	});

	it('\\r', () => {
		expectFail(P.anyButEol.parse('\r'),
		           { line: 1, column: 1 }
		          );
	});

	it('EOF', () => {
		expectFail(P.anyButEol.parse(''),
		           { line: 1, column: 1 }
		          );
	});
});

describe('opt', () => {
	it('basic usage where parser fails', () => {
		expectParse(
			P.opt(P.string('a')).parse(''),
			undefined
		);
	});

	it('basic usage where parser succeeds', () => {
		expectParse(
			P.opt(P.string('a')).parse('a'),
			'a'
		);
	});


	let pSandwich = P.seq(
		P.many(P.string('a')).tie(),
		P.opt (P.string('-')),
		P.many(P.string('b')).tie()
	);

	it('sandwich usage where parser fails', () => {
		expectParse(
			pSandwich.parse('aabbb'),
			['aa', undefined, 'bbb']
		);
	});

	it('sandwich usage where parser succeeds', () => {
		expectParse(
			pSandwich.parse('aa-bbb'),
			['aa', '-', 'bbb']
		);
	});

});
