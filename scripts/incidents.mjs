#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {parseCsv} from './lib/csv.mjs';
import {table} from './lib/format.mjs';
export const tables=['services','incidents','timeline','actions','reviews','source_rows','audit_events','schema_migrations'];
export const specs={help:[],services:[],incidents:[],incident:['incident!'],'review-queue':[],'follow-ups':[],'repeat-failures':[],'service-health':[],compliance:[],attention:[],'weekly-review':[],history:[],'imported-records':[],
 'add-service':['name!','owner!','criticality!'], 'add-incident':['reference!','name!','service!','owner!','severity!','started!','review-due!','retention-review!','summary'],
 classify:['incident!','service!','owner!','severity!','review-due!','retention-review!'],
 'log-event':['incident!','at!','note!','evidence!'],resolve:['incident!','at!','evidence!'],
 'add-action':['incident!','name!','owner!','due!'],'complete-action':['action!','at!','evidence!'],
 'record-review':['incident!','at!','reviewer!','cause!','lessons!','evidence!'],close:['incident!','evidence!'],
 'review-retention':['incident!','due!','purpose!'],import:['file!','map!','namespace!'],export:['out'], 'draft-review':['incident!']};
export const mutations=new Set(['add-service','add-incident','classify','log-event','resolve','add-action','complete-action','record-review','close','review-retention','import']);
export function parse(argv){
 const [command='help',...rest]=argv;if(!Object.hasOwn(specs,command))throw Error(`Unknown command ${command}. Use help.`);
 const opt={},pos=[];for(const arg of rest){if(!arg.startsWith('--')){pos.push(arg);continue;} const p=arg.indexOf('='),k=arg.slice(2,p<0?undefined:p),v=p<0?true:arg.slice(p+1);if(Object.hasOwn(opt,k))throw Error(`Duplicate --${k}`);opt[k]=v;}
 if(command==='import'){if(pos.length!==1||pos[0]!=='incident-io')throw Error('Use import incident-io');}else if(pos.length)throw Error('Unexpected positional argument');
 const allowed=[...specs[command].map(x=>x.replace('!','')),'json',...(mutations.has(command)?['actor','dry-run']:[])];
 for(const [k,v] of Object.entries(opt)){if(!allowed.includes(k))throw Error(`Unknown flag --${k}`);if(['json','dry-run'].includes(k)){if(v!==true)throw Error(`--${k} is boolean`);}else if(typeof v!=='string'||!v.trim())throw Error(`--${k} requires a value`);}
 for(const k of specs[command].filter(x=>x.endsWith('!')).map(x=>x.slice(0,-1)))if(!opt[k])throw Error(`Missing --${k}`);
 if(mutations.has(command)&&!opt.actor)throw Error('Mutation requires --actor');return {command,opt};
}
export function date(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(String(s)))throw Error('Use YYYY-MM-DD');const d=new Date(s+'T00:00:00Z');if(!Number.isFinite(+d)||d.toISOString().slice(0,10)!==s)throw Error('Invalid date');return s;}
export function stamp(s){if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(String(s)))throw Error('Use an ISO timestamp with timezone');date(s.slice(0,10));if(Number(s.slice(11,13))>23||Number(s.slice(14,16))>59||Number(s.slice(17,19))>59)throw Error('Invalid timestamp time');const d=new Date(s);if(!Number.isFinite(+d)||+d>Date.now()+1000)throw Error('Invalid or future timestamp');return d.toISOString();}
const one=async(db,q,p=[]) => (await db.query(q,p))[0];
async function match(db,t,q){
 const rows=await db.query(`select * from ${t} order by name,id`),key=q.toLowerCase();
 let found=rows.filter(r=>r.id===key||r.name.toLowerCase()===key||r.reference?.toLowerCase()===key);
 if(!found.length)found=rows.filter(r=>r.id.startsWith(key)||r.name.toLowerCase().includes(key)||r.reference?.toLowerCase().includes(key));
 if(found.length!==1)throw Error(`${found.length?'Ambiguous':'No match'} ${q}. Candidates: ${JSON.stringify((found.length?found:rows).map(r=>({id:r.id,name:r.name,reference:r.reference})))}`);
 return found[0];
}
function state(i,states){if(!states.includes(i.state))throw Error(`State ${i.state} must be ${states.join(' or ')}`);}
function after(s,minimum){const at=stamp(s);if(new Date(at)<new Date(minimum))throw Error('Timestamp precedes incident activity');return at;}
async function event(db,i,o,note){const at=after(o.at,i.started_at);await db.query('insert into timeline(incident_id,happened_at,note,evidence,actor) values($1,$2,$3,$4,$5)',[i.id,at,note,o.evidence,o.actor]);return at;}
function writeJson(out,data){fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(data,null,2)+'\n',{flag:'wx'});return out;}
export async function dispatch(db,argv){
 const {command:c,opt:o}=parse(argv);if(!mutations.has(c))return read(db,c,o);
 await db.exec('BEGIN');try{
  await db.exec('LOCK TABLE services,incidents,timeline,actions,reviews,source_rows,audit_events IN SHARE ROW EXCLUSIVE MODE');
  const result=await change(db,c,o);await db.query('insert into audit_events(command,actor,details) values($1,$2,$3::jsonb)',[c,o.actor,JSON.stringify({input:o,result})]);
  await db.exec(o['dry-run']?'ROLLBACK':'COMMIT');return {...result,dry_run:!!o['dry-run']};
 }catch(e){await db.exec('ROLLBACK');throw e;}
}
async function change(db,c,o){
 if(c==='add-service')return one(db,'insert into services(name,owner,criticality) values($1,$2,$3) returning *',[o.name,o.owner,o.criticality]);
 if(c==='import')return importRows(db,o);
 if(c==='add-incident'||c==='classify'){
  const s=await match(db,'services',o.service);const due=date(o['review-due']),ret=date(o['retention-review']);
  if(!['sev1','sev2','sev3'].includes(o.severity))throw Error('Severity must be sev1, sev2 or sev3');
  if(c==='classify'){const i=await match(db,'incidents',o.incident);state(i,['unverified']);if(due<new Date(i.started_at).toISOString().slice(0,10)||ret<new Date(i.started_at).toISOString().slice(0,10))throw Error('Review date precedes start');return one(db,"update incidents set service_id=$2,owner=$3,severity=$4,review_due=$5,retention_review=$6,state='open' where id=$1 returning *",[i.id,s.id,o.owner,o.severity,due,ret]);}
  const started=stamp(o.started);if(due<started.slice(0,10)||ret<started.slice(0,10))throw Error('Review date precedes start');
  return one(db,"insert into incidents(reference,name,service_id,owner,severity,state,started_at,review_due,retention_review,summary) values($1,$2,$3,$4,$5,'open',$6,$7,$8,$9) returning *",[o.reference,o.name,s.id,o.owner,o.severity,started,due,ret,o.summary||'']);
 }
 if(c==='complete-action'){
  const a=await match(db,'actions',o.action);state(a,['open']);const i=await one(db,'select * from incidents where id=$1',[a.incident_id]);const at=after(o.at,a.created_at);
  await event(db,i,{...o,at},`Action completed: ${a.name}`);return one(db,"update actions set state='done',completed_at=$2,evidence=$3 where id=$1 returning *",[a.id,at,o.evidence]);
 }
 const i=await match(db,'incidents',o.incident);
 if(c==='review-retention'){const due=date(o.due);if(due<=new Date().toISOString().slice(0,10))throw Error('Next retention review must be in the future');return one(db,'update incidents set retention_review=$2 where id=$1 returning *',[i.id,due]);}
 if(c==='log-event'){state(i,['open','resolved','reviewed']);const at=await event(db,i,o,o.note);return {reference:i.reference,at};}
 if(c==='resolve'){
  state(i,['open']);const latest=await one(db,'select max(happened_at) at from timeline where incident_id=$1',[i.id]);const at=after(o.at,latest.at||i.started_at);
  await event(db,i,{...o,at},'Impact resolved');return one(db,"update incidents set state='resolved',resolved_at=$2 where id=$1 returning *",[i.id,at]);
 }
 if(c==='add-action'){state(i,['open','resolved','reviewed']);return one(db,'insert into actions(incident_id,name,owner,due_on) values($1,$2,$3,$4) returning *',[i.id,o.name,o.owner,date(o.due)]);}
 if(c==='record-review'){
  state(i,['resolved']);const at=after(o.at,i.resolved_at);if(!await one(db,'select id from timeline where incident_id=$1',[i.id]))throw Error('Record timeline evidence before review');
  const r=await one(db,'insert into reviews(incident_id,reviewer,reviewed_at,cause,lessons,evidence) values($1,$2,$3,$4,$5,$6) returning *',[i.id,o.reviewer,at,o.cause,o.lessons,o.evidence]);
  await db.query("update incidents set state='reviewed' where id=$1",[i.id]);await event(db,i,{...o,at},'Review recorded');return r;
 }
 if(c==='close'){
  state(i,['reviewed']);if(!await one(db,'select id from reviews where incident_id=$1',[i.id]))throw Error('Review required');
  if(await one(db,"select id from actions where incident_id=$1 and state='open'",[i.id]))throw Error('Complete open follow-ups before closure');
  await event(db,i,{...o,at:new Date().toISOString()},'Review cycle closed');return one(db,"update incidents set state='closed' where id=$1 returning *",[i.id]);
 }
 throw Error(`Not implemented ${c}`);
}
async function importRows(db,o){
 const rows=parseCsv(fs.readFileSync(o.file,'utf8'));if(!rows.length)throw Error('Empty CSV');const map=JSON.parse(fs.readFileSync(o.map,'utf8'));
 const allowed=['key','reference','name','summary','started','visibility'];
 for(const [k,v] of Object.entries(map))if(!allowed.includes(k)||typeof v!=='string'||!v.trim())throw Error(`Invalid mapping ${k}`);
 for(const k of ['key','reference','name','started'])if(!map[k])throw Error(`Mapping requires ${k}`);
 for(const col of Object.values(map))if(!Object.hasOwn(rows[0],col))throw Error(`Missing CSV column ${col}`);
 let imported=0,skipped=0;const keys=new Set();
 for(const raw of rows){
  const m=Object.fromEntries(Object.entries(map).map(([k,v])=>[k,raw[v].trim()]));
  for(const k of ['key','reference','name','started'])if(!m[k])throw Error(`Empty ${k}`);
  if(m.visibility&&m.visibility.toLowerCase()!=='public')throw Error('Private or unknown visibility requires a separately secured deployment');
  if(keys.has(m.key))throw Error(`Duplicate source key ${m.key}`);keys.add(m.key);const started=stamp(m.started);
  const prior=await one(db,'select *,raw=$3::jsonb and mapped=$4::jsonb same from source_rows where namespace=$1 and source_key=$2',[o.namespace,m.key,JSON.stringify(raw),JSON.stringify(m)]);
  if(prior){if(!prior.same)throw Error(`Changed source row ${m.key}; reconcile before reimport`);skipped++;continue;}
  const i=await one(db,'insert into incidents(reference,name,summary,started_at) values($1,$2,$3,$4) returning id',[m.reference,m.name,m.summary||'',started]);
  await db.query('insert into source_rows(namespace,source_key,incident_id,raw,mapped) values($1,$2,$3,$4::jsonb,$5::jsonb)',[o.namespace,m.key,i.id,JSON.stringify(raw),JSON.stringify(m)]);imported++;
 }
 return {imported,skipped,total:rows.length,verification:'Imported records remain unverified. Source statuses do not certify local reviews.'};
}
const queries={services:'select * from services order by name',incidents:'select reference,name,state,severity,owner,review_due,id from incidents order by reference',
 'review-queue':'select reference,name,service,owner,state,review_due,days_overdue,open_actions from v_review_queue order by review_due nulls first,reference',
 'follow-ups':'select reference,service,action,owner,due_on,days_overdue,severity,id from v_action_queue order by due_on,reference,action',
 'service-health':'select service,owner,criticality,incidents,unfinished,last_30_days,avg_minutes_to_resolution,overdue_actions from v_service_health order by service',
 'repeat-failures':'select service,owner,last_30_days,unfinished,overdue_actions from v_service_health where last_30_days>1 order by last_30_days desc,service',
 compliance:'select * from v_compliance order by reference,rule,finding',
 history:'select command,actor,created_at,details from audit_events order by created_at,id',
 'imported-records':'select namespace,source_key,incident_id,raw,mapped from source_rows order by namespace,source_key'};
async function read(db,c,o){
 if(c==='help')return {commands:specs,mutations:[...mutations],usage:'npm run incidents -- <command> --key=value [--json]; mutations require --actor and accept --dry-run'};
 if(queries[c])return db.query(queries[c]);
 if(c==='attention')return {unverified:await db.query("select reference,name from incidents where state='unverified' order by reference"),overdue_reviews:await db.query("select reference,owner,review_due,days_overdue from v_review_queue where state in ('open','resolved') and days_overdue>0 order by review_due,reference"),overdue_actions:await db.query('select reference,action,owner,days_overdue from v_action_queue where days_overdue>0 order by due_on,reference'),record_checks:await db.query(queries.compliance)};
 if(c==='weekly-review')return {reviews:await db.query(queries['review-queue']),follow_ups:await db.query(queries['follow-ups']),services:await db.query(queries['service-health']),checks:await db.query(queries.compliance)};
 if(c==='incident'||c==='draft-review'){
  const i=await match(db,'incidents',o.incident);const result={incident:i,timeline:await db.query('select * from timeline where incident_id=$1 order by happened_at,id',[i.id]),actions:await db.query('select * from actions where incident_id=$1 order by due_on,id',[i.id]),reviews:await db.query('select * from reviews where incident_id=$1',[i.id])};
  if(c==='incident')return result;
  const folder=path.resolve(process.env.OUTPUT_DIR||REPO_ROOT,'drafts');fs.mkdirSync(folder,{recursive:true});const out=path.join(folder,`review-${i.id}-${randomUUID()}.md`);
  fs.writeFileSync(out,`# Internal review brief: ${i.reference}\n\nDraft for human review. No notifications sent.\n\n${JSON.stringify(result,null,2)}\n`,{flag:'wx'});return {draft:out};
 }
 if(c==='export'){const data={format:'incident-reviews-archive-v1',created_at:new Date().toISOString(),records:{}};for(const t of tables)data.records[t]=await db.query(`select * from ${t}`);const out=path.resolve(o.out||path.join(process.env.OUTPUT_DIR||REPO_ROOT,'exports',`archive-${randomUUID()}.json`));writeJson(out,data);return {file:out,counts:Object.fromEntries(Object.entries(data.records).map(([t,v])=>[t,v.length]))};}
 throw Error(`Unknown command ${c}`);
}
export function human(value){if(Array.isArray(value)){if(!value.length)return '(none)';return table(value,Object.keys(value[0]).map(key=>({key,label:key,format:v=>typeof v==='object'?JSON.stringify(v):v})));}if(value&&typeof value==='object')return Object.entries(value).map(([k,v])=>`${k}\n${human(v)}`).join('\n\n');return String(value??'');}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){let db;try{const parsed=parse(process.argv.slice(2));db=await getDb();const result=await dispatch(db,process.argv.slice(2));console.log(parsed.opt.json?JSON.stringify(result,null,2):human(result));}catch(e){console.error(e.message);process.exitCode=1;}finally{await db?.close();}}
