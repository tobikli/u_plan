import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogNumber,parseTumPrograms,parseTumModules,tumTreeUrl} from '../lib/universities/tum-parser.ts';
import {mergeUniversityCourses as mergeTumModules} from "../lib/universities/catalog.ts";
const row=(id,name,degree,credits,semesters,version='20231')=>`<tr><td>${degree}</td><td>030</td><td><a href="wbstpcs.showSpoTree?pSJNr=1623&amp;pStpStpNr=${id}">${name} (<span>kA</span>/<span>${version}</span>)</a></td><td>Informatik</td><td>${credits}</td><td>${semesters}</td></tr>`;
test('program catalogue distinguishes degrees and curriculum versions and reads actual ECTS/duration',()=>{
 const programs=parseTumPrograms(`<table id="idStpList">${row('5217','Informatik','16 Master of Science','120','4')}${row('5371','Informatik','82 Bachelor of Science','180','6')}${row('999','Unknown','00 Abschluss unbekannt','','0')}</table>`);
 assert.equal(programs.length,3);assert.deepEqual(programs.find(p=>p.id==='5217'),{id:'5217',name:'Informatik',degree:'Master',degreeLabel:'Master of Science',version:'20231',credits:120,semesters:4,academicYear:'1623',sourceUrl:tumTreeUrl('5217','1623')});assert.equal(programs.find(p=>p.id==='5371').degree,'Bachelor');assert.equal(programs.find(p=>p.id==='999').credits,null);assert.equal(programs.find(p=>p.id==='999').semesters,null);
});
test('module parser uses credit-bearing module rows, not rule totals or lecture rows',()=>{
 const html=`<table id="tgt"><tr><td><span title="Regelknoten">Electives</span></td><td></td><td></td><td>60</td></tr><tr><td><span title="Modulknoten">[IN1234] Algorithms &amp; Data</span><a href="ee/ui/ca2/app/desktop/#/slc.cm.reg/student/modules/detail/light/123/study-year/1623">Module</a></td><td></td><td></td><td>6,5</td></tr><tr><td>Associated lecture</td><td></td><td></td><td>3</td></tr></table><select name="pPageNr"><option value="1">1</option><option value="2">2</option></select>`;
 const result=parseTumModules(html,'5217','1623');assert.equal(result.pages,2);assert.equal(result.courses.length,1);assert.equal(result.courses[0].credits,6.5);assert.equal(result.courses[0].code,'IN1234');assert.equal(result.courses[0].name,'Algorithms & Data');assert.ok(result.courses[0].sourceUrl.includes('/modules/detail/light/123/'));
});
test('curriculum pagination deduplicates shared modules and preserves unknown/conflicting ECTS',()=>{
 const course={id:'IN1',code:'IN1',name:'Example',credits:6,sourceUrl:'https://campus.tum.de'};
 assert.equal(mergeTumModules([[course],[course]]).length,1);assert.equal(mergeTumModules([[course],[{...course,credits:5}]] )[0].credits,null);assert.equal(catalogNumber(''),null);assert.equal(catalogNumber('6–9'),null);assert.equal(catalogNumber('0'),0);
});
test('maintenance/error pages and unsafe identifiers cannot become cached catalogues',()=>{
 assert.throws(()=>parseTumPrograms('<h1>Maintenance</h1>'));assert.throws(()=>parseTumModules('<h1>Not found</h1>','5217','1623'));assert.throws(()=>tumTreeUrl('https://evil.test','1623'));assert.throws(()=>tumTreeUrl('5217','1&other=123'));
});
