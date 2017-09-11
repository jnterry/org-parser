////////////////////////////////////////////////////////////////////////////
///                       Part of org-parser                             ///
////////////////////////////////////////////////////////////////////////////
/// \file equation.js
/// \author Jamie Terry
/// \date 2017/09/10
/// \brief Tests the OrgLang.equation parser
////////////////////////////////////////////////////////////////////////////

function checkParse(x){
	expect(x.status).deep.equal(true);

	expect(x.value.type).deep.equal(OrgLang.equation.type);
	expect(x.value.contents).to.exist;
	expect(x.value.inline  ).to.exist;
}

describe('successes', () => {
	it('Basic inline equation', () => {
		let result = OrgLang.equation.parser.parse('\\( x \\)');
		checkParse(result);
		expect(result.value.contents).deep.equal('x');
		expect(result.value.inline  ).deep.equal(true);
	});

	it('Basic block equation', () => {
		let result = OrgLang.equation.parser.parse('\\[ 1 + \frac{1}{2} \\]');
		checkParse(result);
		expect(result.value.contents).deep.equal('1 + \frac{1}{2}');
		expect(result.value.inline  ).deep.equal(false);
	});
});

describe('failures', () => {
	it('Unclosed inline equation', () => {
		expectFail(OrgLang.equation.parser.parse('\\( a + x'),
		           { column: 9, line: 1}
		          );
	});

	it('Unclosed block equation', () => {
		expectFail(OrgLang.equation.parser.parse('\\[ a + x'),
		           { column: 9, line: 1}
		          );
	});

	// :TODO: - we want to support graceful failures, this should
	// actually probably generate an equation node, but tag it with a
	// warning or similar
	/*it('Mis-closed equation', () => {
		let result = ;
		expectFail(OrgLang.equation.parser.parse('\\( 1 + 2 \\]'),
		          { column: 11, line: 1}
		         );
	});*/
});
