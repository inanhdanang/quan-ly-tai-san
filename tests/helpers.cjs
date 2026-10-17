const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
function app(options={}){
 let failTable='',currentDate=options.today||'2026-10-17';const metrics={reads:{},opens:0};
 class Range{
  constructor(s,r,c,n,m){Object.assign(this,{s,r,c,n,m});if(!Number.isInteger(r)||r<1||r+n-1>s.maxRows||c+m-1>s.maxColumns)throw Error('Range outside grid');}
  getValues(){return Array.from({length:this.n},(_,i)=>Array.from({length:this.m},(_,j)=>this.s.values[this.r-1+i]?.[this.c-1+j]??''));}
  getDisplayValues(){metrics.reads[this.s.name]=(metrics.reads[this.s.name]||0)+1;return this.getValues().map(r=>r.map(String));}
  setValues(v){if(failTable===this.s.name){failTable='';throw Error('Simulated Sheets write failure');}assert.equal(v.length,this.n);v.forEach((r,i)=>{assert.equal(r.length,this.m);const row=this.s.values[this.r-1+i]??=[];r.forEach((x,j)=>row[this.c-1+j]=typeof x==='string'&&x.startsWith("'")?x.slice(1):x);});return this;}
  setBackground(){return this;} setFontColor(){return this;} setFontWeight(){return this;} setNumberFormat(){return this;}
  createFilter(){this.s.filter={remove:()=>this.s.filter=null};return this;}
  clearContent(){for(let i=0;i<this.n;i++)for(let j=0;j<this.m;j++)if(this.s.values[this.r-1+i])this.s.values[this.r-1+i][this.c-1+j]='';return this;}
 }
 class Sheet{
  constructor(name){this.name=name;this.values=[];this.maxRows=1000;this.maxColumns=26;}
  getLastRow(){let i=this.values.length;while(i&&!this.values[i-1].some(x=>x!==''))i--;return i;}
  getLastColumn(){return Math.max(0,...this.values.map(r=>{let i=r.length;while(i&&r[i-1]==='')i--;return i;}));}
  getMaxRows(){return this.maxRows;} getMaxColumns(){return this.maxColumns;}
  insertColumnsAfter(_,n){this.maxColumns+=n;} insertRowsAfter(_,n){this.maxRows+=n;}
  getRange(...a){return new Range(this,...a);} getFilter(){return this.filter;} setFrozenRows(){}
 }
 const sheets={},ss={getId:()=> 'test',setSpreadsheetTimeZone(){},getSheetByName:n=>sheets[n],insertSheet:n=>sheets[n]=new Sheet(n)},props={},cache={};let locked=false;const sent=[],triggers=[],files=new Map(),folders=new Map();
 function blob(data,type,name){return {data,type,name,getAs(type){return blob(this.data,type,this.name);},getContentType(){return this.type;},getBytes(){return typeof this.data==='string'?[...Buffer.from(this.data)]:this.data;}};}
 function folder(){const id=require('node:crypto').randomUUID(),f={getId:()=>id,createFile(b){const fid=require('node:crypto').randomUUID(),file={getId:()=>fid,getUrl:()=>'https://drive.google.com/file/d/'+fid+'/view',getBlob:()=>b};files.set(fid,file);return file;}};folders.set(id,f);return f;}
 const c=vm.createContext({console,SpreadsheetApp:{getActiveSpreadsheet:()=>ss,openById:()=>{metrics.opens++;return ss;},create:(name)=>{const first=new Sheet('Export');return {getId:()=> 'export-test-id',getSheets:()=>[first]};},flush(){}},PropertiesService:{getScriptProperties:()=>({setProperty(k,v){props[k]=v;},getProperty:k=>props[k]})},Session:{getEffectiveUser:()=>({getEmail:()=> 'owner@example.test'})},Utilities:{getUuid:()=>require('node:crypto').randomUUID(),formatDate:()=>currentDate+'T09:00:00',newBlob:blob,base64Decode:s=>[...Buffer.from(s,'base64')],base64Encode:bytes=>Buffer.from(bytes).toString('base64')},LockService:{getScriptLock:()=>({waitLock(){assert.equal(locked,false);locked=true;},releaseLock(){locked=false;}})},CacheService:{getScriptCache:()=>({get:k=>cache[k],put:(k,v)=>cache[k]=v})},ScriptApp:{getService:()=>({getUrl:()=>'https://script.google.com/macros/s/TEST_ONLY/exec'}),getProjectTriggers:()=>triggers,deleteTrigger:t=>triggers.splice(triggers.indexOf(t),1),newTrigger:name=>{const t={getHandlerFunction:()=>name,hour:null};const chain={timeBased(){return this;},everyDays(){return this;},atHour(h){t.hour=h;return this;},inTimezone(){return this;},create(){triggers.push(t);return t;}};return chain;}},MailApp:{getRemainingDailyQuota:()=>100-sent.length,sendEmail:(to,title,body)=>sent.push({to,title,body})},DriveApp:{createFolder:folder,getFolderById:id=>folders.get(id),getFileById:id=>files.get(id)}});
 for(const f of ['Domain.js','Code.gs','Seed.gs'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),c,{filename:f});
 if(options.initialize!==false)vm.runInContext('setup(); seedDemo()',c);
 let request=0;return {c,sheets,metrics,newExecution:()=>{vm.runInContext('rowCache_={};spreadsheetCache_=null;',c);metrics.reads={};metrics.opens=0;},sent,triggers,files,folders,props,failNextWrite:table=>failTable=table,setToday:d=>currentDate=d,run:(action,p)=>c.mutate(action,{...p,requestId:p.requestId||'request_'+(++request)}),data:()=>c.getData()};
}
module.exports={app};
