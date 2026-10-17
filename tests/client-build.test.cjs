const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const root=path.join(__dirname,'..');
test('Thin Apps Script HTML has no embedded business JavaScript or template expansion',()=>{
 const html=fs.readFileSync(path.join(root,'Index.html'),'utf8');assert.ok(!html.includes('<?'));assert.ok(!html.includes('function txTable'));assert.ok(!html.includes('function render'));assert.ok(html.includes('data-client-build="2.0.2"'));
 const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];assert.equal(scripts.filter(m=>m[1].trim()).length,1);for(const m of scripts)if(m[1].trim())assert.doesNotThrow(()=>new vm.Script(m[1]));
});
test('Pinned client source passes parsing and SHA-384 integrity exactly matches HTML',()=>{
 const build=JSON.parse(fs.readFileSync(path.join(root,'client-build.json'),'utf8')),bytes=fs.readFileSync(path.join(root,'App.js')),html=fs.readFileSync(path.join(root,'Index.html'),'utf8');
 assert.match(build.commit,/^[0-9a-f]{40}$/);assert.equal(build.integrity,'sha384-'+crypto.createHash('sha384').update(bytes).digest('base64'));assert.ok(html.includes('src="'+build.url+'"'));assert.ok(html.includes('integrity="'+build.integrity+'"'));assert.doesNotThrow(()=>new vm.Script(bytes.toString('utf8')));
});
