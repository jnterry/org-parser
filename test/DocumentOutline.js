////////////////////////////////////////////////////////////////////////////
///                       Part of org-parser                             ///
////////////////////////////////////////////////////////////////////////////
/// \file DocumentOutline.js
/// \author Jamie Terry
/// \date 2017/09/10
/// \brief Tests the parsing of an org document outline
////////////////////////////////////////////////////////////////////////////

"use strict";

require('./common');

let Org = require('..');

let Parser = new Org.Parser();

function checkParse(x, error_count){
	if(error_count == null){ error_count = 0; }

	expect(x).instanceof(Org.ParseResult);
	expect(x.errors.length).deep.equal(error_count);
	expect(x.value.level          ).deep.equal(0 );
	expect(x.value.heading        ).deep.equal('');
	expect(x.value.loc.start).instanceof(Org.TextLocation);
	expect(x.value.loc.start).deep.equal(new Org.TextLocation( 0, 1, 1));
}

it("No Section Headings", () => {
	let x = Parser.parseDocumentOutline(
		'Text\n' +
		'Content\n' +
		'Joy'
	);

	checkParse(x, 0);
	expect(x.value.loc.end  ).instanceof(Org.TextLocation);
	expect(x.value.loc.end  ).deep.equal(new Org.TextLocation(16, 3, 3));
	expect(x.value.children.length).deep.equal(0);
	expect(x.value.content.loc.start).instanceof(Org.TextLocation);
	expect(x.value.content.loc.start).deep.equal(new Org.TextLocation( 0, 1, 1));
	expect(x.value.content.loc.end  ).instanceof(Org.TextLocation);
	expect(x.value.content.loc.end  ).deep.equal(new Org.TextLocation(16, 3, 3));
});

it("No Section Headings with trailing newline", () => {
	let x = Parser.parseDocumentOutline(
		'Text\n' +
		'Content\n' +
		'Joy\n'
	);

	checkParse(x, 0);
	expect(x.value.loc.end  ).instanceof(Org.TextLocation);
	expect(x.value.loc.end  ).deep.equal(new Org.TextLocation(17, 3, 4));
	expect(x.value.children.length).deep.equal(0);
	expect(x.value.content.loc.start).instanceof(Org.TextLocation);
	expect(x.value.content.loc.start).deep.equal(new Org.TextLocation( 0, 1, 1));
	expect(x.value.content.loc.end  ).instanceof(Org.TextLocation);
	expect(x.value.content.loc.end  ).deep.equal(new Org.TextLocation(17, 3, 4));

});


it('Single Heading from start', () => {
	let x = Parser.parseDocumentOutline(
		'* Top Title\n' +
		'Hello World!'
	);

	checkParse(x, 0);

	expect(x.value.loc.end).instanceof(Org.TextLocation);
	expect(x.value.loc.end).deep.equal(new Org.TextLocation(23, 2, 12));
	expect(x.value.content.loc.start).deep.equal(null);
	expect(x.value.content.loc.end  ).deep.equal(null);

	let top_title = x.value.chilren[0];
	expect(top_title.heading ).deep.equal('Top Title');
	expect(top_title.level   ).deep.equal(1);
	expect(top_title.children).deep.equal(0);
	expect(top_title.loc.start).deep.equal(new Org.TextLocation( 0, 1,  1));
	expect(top_title.loc.end  ).deep.equal(new Org.TextLocation(23, 2, 12));
	expect(top_title.content.loc.start).deep.equal(new Org.TextLocation(12, 2,  1));
	expect(top_title.content.loc.end  ).deep.equal(new Org.TextLocation(23, 2, 12));
});

it('Single with root content', () => {
	let x = Parser.parseDocumentOutline(
		'Test\n' +
		'* Top Title\n' +
		'Hello World!'
	);

	checkParse(x, 0);
	expect(x.value.loc.end).instanceof(Org.TextLocation);
	expect(x.value.loc.end).deep.equal(new Org.TextLocation(28, 3, 12));
	expect(x.value.content.loc.start).deep.equal(new Org.TextLocation(0,1,1));
	expect(x.value.content.loc.end  ).deep.equal(new Org.TextLocation(4,1,5));

	let top_title = x.value.chilren[0];
	expect(top_title.heading ).deep.equal('Top Title');
	expect(top_title.level   ).deep.equal(1);
	expect(top_title.children).deep.equal(0);
	expect(top_title.loc.start).deep.equal(new Org.TextLocation( 5, 2,  1));
	expect(top_title.loc.end  ).deep.equal(new Org.TextLocation(28, 3, 12));
	expect(top_title.content.loc.start).deep.equal(new Org.TextLocation(17, 3,  1));
	expect(top_title.content.loc.end  ).deep.equal(new Org.TextLocation(28, 3, 12));
});

it('Multiple Levels', () => {
	let x = Parser.parseDocumentOutline(
		'* A\n'+          // line  1
		'** A.1\n' +      // line  2
		'*** A.1.1\n' +   // line  3
		'*** A.1.2\n' +   // line  4
		'    text\n' +    // line  5
		'    here\n' +    // line  6
		'* B\n' +         // line  7
		'** B.1\n' +      // line  8
		'*** B.1.1\n' +   // line  9
		'** B.2\n' +      // line 10
		'** B.3\n'        // line 11
	);

	checkParse(x, 0);

	let r = x.value;
	let c = null; // current node

	c = x.value;
	expect(c.level            ).deep.equal(0);
	expect(c.heading          ).deep.equal('');
	expect(c.loc.start.line   ).deep.equal( 1);
	expect(c.loc.end.line     ).deep.equal(11);
	expect(c.content.loc.start).deep.equal(null);
	expect(c.content.loc.end  ).deep.equal(null);
	expect(c.children.length  ).deep.equal(2);

	c = x.value.children[0];
	expect(c.level            ).deep.equal(1);
	expect(c.heading          ).deep.equal('A');
	expect(c.loc.start.line   ).deep.equal( 1);
	expect(c.loc.end.line     ).deep.equal( 6);
	expect(c.content.loc.start).deep.equal(null);
	expect(c.content.loc.end  ).deep.equal(null);
	expect(c.children.length  ).deep.equal(1);


	c = x.value.children[0].children[0];
	expect(c.level            ).deep.equal(2);
	expect(c.heading          ).deep.equal('A.1');
	expect(c.loc.start.line   ).deep.equal( 2);
	expect(c.loc.end.line     ).deep.equal( 6);
	expect(c.content.loc.start).deep.equal(null);
	expect(c.content.loc.end  ).deep.equal(null);
	expect(c.children.length  ).deep.equal(2);

	c = x.value.children[0].children[0].children[0];
	expect(c.level            ).deep.equal(3);
	expect(c.heading          ).deep.equal('A.1.1');
	expect(c.loc.start.line   ).deep.equal( 3);
	expect(c.loc.end.line     ).deep.equal( 3);
	expect(c.content.loc.start).deep.equal(null);
	expect(c.content.loc.end  ).deep.equal(null);
	expect(c.children.length  ).deep.equal(0);

	c = x.value.children[0].children[0].children[1];
	expect(c.level                 ).deep.equal(3);
	expect(c.heading               ).deep.equal('A.1.2');
	expect(c.loc.start.line        ).deep.equal( 4);
	expect(c.loc.end.line          ).deep.equal( 6);
	expect(c.content.loc.start.line).deep.equal(5);
	expect(c.content.loc.end.line  ).deep.equal(6);
	expect(c.children.length       ).deep.equal(0);

	c = x.value.children[1];
	expect(c.level            ).deep.equal(1);
	expect(c.heading          ).deep.equal('B');
	expect(c.loc.start.line   ).deep.equal( 7);
	expect(c.loc.end.line     ).deep.equal(11);
	expect(c.content.loc.start).deep.equal(null);
	expect(c.content.loc.end  ).deep.equal(null);
	expect(c.children.length  ).deep.equal(3);

	c = x.value.children[1].children[0];
	expect(c.level            ).deep.equal(2);
	expect(c.heading          ).deep.equal('B.1');
	expect(c.loc.start.line   ).deep.equal( 8);
	expect(c.loc.end.line     ).deep.equal( 9);
	expect(c.content.loc.start).deep.equal(null);
	expect(c.content.loc.end  ).deep.equal(null);
	expect(c.children.length  ).deep.equal(1);

	c = x.value.children[1].children[0].children[0];
	expect(c.level            ).deep.equal(3);
	expect(c.heading          ).deep.equal('B.1.1');
	expect(c.loc.start.line   ).deep.equal( 9);
	expect(c.loc.end.line     ).deep.equal( 9);
	expect(c.content.loc.start).deep.equal(null);
	expect(c.content.loc.end  ).deep.equal(null);
	expect(c.children.length  ).deep.equal(0);

	c = x.value.children[1].children[1];
	expect(c.level            ).deep.equal(2);
	expect(c.heading          ).deep.equal('B.2');
	expect(c.loc.start.line   ).deep.equal(10);
	expect(c.loc.end.line     ).deep.equal(10);
	expect(c.content.loc.start).deep.equal(null);
	expect(c.content.loc.end  ).deep.equal(null);
	expect(c.children.length  ).deep.equal(0);

	c = x.value.children[1].children[2];
	expect(c.level            ).deep.equal(2);
	expect(c.heading          ).deep.equal('B.3');
	expect(c.loc.start.line   ).deep.equal(11);
	expect(c.loc.end.line     ).deep.equal(11);
	expect(c.content.loc.start).deep.equal(null);
	expect(c.content.loc.end  ).deep.equal(null);
	expect(c.children.length  ).deep.equal(0);
});

it('Bad Level Nesting Test', () => {
	let x = Parser.parseDocumentOutline(
		'* A\n'+          // line  1
		'** A.1\n' +      // line  2
		'**** A.1.1\n' +  // line  3
		'*** A.1.2\n' +   // line  4
		'    text\n' +    // line  5
		'    here\n' +    // line  6
		'* B\n' +         // line  7
		'** B.1\n' +      // line  8
		'*** B.1.1\n' +   // line  9
		'** B.2\n' +      // line 10
		'** B.3\n'        // line 11
	);

	checkParse(x, 1);

	expect(x.errors[0].loc.start.line).deep.equal(3);
	expect(x.errors[0].loc.end.line  ).deep.equal(3);
	expect(x.errors[0].loc.end.column).is.above(x.errors[0].loc.start.column);
	expect(x.errors[0].loc.end.offset).is.above(x.errors[0].loc.start.offset);
	// message should be complaining about level 4 as direct child of level 2
	expect(x.errors[0].message).contains('level');
});
