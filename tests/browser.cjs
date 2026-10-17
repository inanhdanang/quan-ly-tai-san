// Run after installing playwright-core in /tmp/asset-browser.
const {chromium}=require('/tmp/asset-browser/node_modules/playwright-core');
const {app}=require('./integration.test.cjs');
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const backend=app(),browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE ERROR:',e.message)});page.on('console',m=>console.log('BROWSER:',m.text()));
 await page.exposeFunction('backend',async(name,args)=>{if(typeof backend.c[name]!=='function')throw Error('Unknown RPC');return JSON.parse(JSON.stringify(backend.c[name](...args)))});
 const bridge=`<script>window.google={script:{run:new Proxy({}, {get(_,name){if(name==='withSuccessHandler')return success=>new Proxy({}, {get(_,key){if(key==='withFailureHandler')return failure=>new Proxy({}, {get(_,fn){return (...args)=>window.backend(fn,args).then(success).catch(e=>failure({message:e.message}))}})}})}})}};</script>`;
 const source=fs.readFileSync(__dirname+'/../Index.html','utf8').replace("<?!= HtmlService.createHtmlOutputFromFile('QR').getContent(); ?>",()=>fs.readFileSync(__dirname+'/../QR.html','utf8')).replace('<script>\nlet D',bridge+'<script>\nlet D');
 page.setDefaultTimeout(15000);await page.setContent(source);await page.waitForFunction(()=>typeof D!=='undefined'&&D&&document.getElementById('content').textContent.includes('Hoạt động gần đây'));
 await page.screenshot({path:__dirname+'/../Giao-dien-may-tinh.png',fullPage:true});
 for(const p of ['assets','issue','tracking','audit','recover','report','stock','employees','catalog','settings']){await page.evaluate(p=>{page=p;render()},p);assert.ok((await page.locator('#content').innerText()).length>20)}
 await page.evaluate(()=>assetForm());await page.locator('[name=name]').fill('Máy in thử giao diện');await page.locator('[name=kind]').selectOption('MI');await page.locator('[name=price]').fill('24000000');await page.locator('[name=months]').fill('24');await page.locator('#submit').click();await page.waitForFunction(()=>D.assets.some(a=>a.name==='Máy in thử giao diện'));
 const asset=backend.data().assets.find(a=>a.name==='Máy in thử giao diện');assert.ok(asset);
 await page.evaluate(id=>{transactionForm('CAP_PHAT');document.querySelector('[name=assetIds][value="'+id+'"]').checked=true},asset.id);await page.locator('[name=employeeId]').selectOption('NV001');await page.locator('#submit').click();await page.waitForFunction(id=>D.assets.find(a=>a.id===id).status==='DANG_DUNG',asset.id);
 await page.evaluate(id=>detail(id),asset.id);assert.ok(await page.locator('#fields svg').count());await page.locator('#modal button', {hasText:'Hủy'}).click();
 await page.evaluate(()=>{page='audit';render();auditForm()});await page.locator('#submit').click();await page.waitForFunction(()=>D.audits.length===1);
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{document.getElementById('toast').style.display='none'});await page.screenshot({path:__dirname+'/../Giao-dien-dien-thoai.png',fullPage:false});
 assert.deepEqual(errors,[]);console.log('Browser PASS: 11 screens; add asset; issue asset; QR SVG; create audit; mobile layout; no page errors.');await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});
