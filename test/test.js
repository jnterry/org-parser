"use strict";

let OrgParser = require('..');

it('Header', () => {
	let result = OrgParser.parse('*** Hi Human');

	expect(result).to.equal({});
});

/*
it('test-pass', () => {
	let result = OrgParser.parse("Hello World");

	expect(result       ).to.have.property('status');
	expect(result.status).to.equal(true);

	expect(result       ).to.have.property('value');
	expect(result.value ).to.equal('Hello World');
});

it('test-fail', () => {
	let result = OrgParser.parse("Hi");

	expect(result       ).to.have.property('status');
	expect(result.status).to.equal(false);

	expect(result         ).to.have.property('expected');
	expect(result         ).to.have.property('index');
	expect(result.expected).to.deep.equal(["'Hello World'"]);
	expect(result.index   ).to.deep.equal({
		column : 1,
		line   : 1,
		offset : 0,
	});
});
*/
