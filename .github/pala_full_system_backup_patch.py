from pathlib import Path

path=Path('index.html')
text=path.read_text(encoding='utf-8')
marker='PALA v112 · full disaster recovery ZIP'
if marker in text:
    raise SystemExit('Full backup patch already installed')
needle='</script></body></html>'
if needle not in text:
    raise SystemExit('Could not find script end')
block=r'''

/* PALA v112 · full disaster recovery ZIP */
const PALA_BACKUP_REPOSITORY='Detdondon/PALA-LOGISTICS';
const PALA_BACKUP_BRANCH='main';

async function disasterFetchJson(url){
  let response=await fetch(url,{headers:{Accept:'application/vnd.github+json'},cache:'no-store'});
  if(!response.ok)throw new Error(`GitHub kunne ikke hentes (${response.status})`);
  return response.json();
}
function disasterRawUrl(commitSha,path){return `https://raw.githubusercontent.com/${PALA_BACKUP_REPOSITORY}/${commitSha}/${path.split('/').map(encodeURIComponent).join('/')}`}
async function disasterAddRepositorySnapshot(zip){
  setBackupProgress('Henter hele PALA-koden fra GitHub…');
  let commit=await disasterFetchJson(`https://api.github.com/repos/${PALA_BACKUP_REPOSITORY}/commits/${PALA_BACKUP_BRANCH}`),commitSha=commit.sha,tree=await disasterFetchJson(`${commit.commit.tree.url}?recursive=1`),files=(tree.tree||[]).filter(row=>row.type==='blob');
  if(!files.length)throw new Error('GitHub-repositoryet indeholder ingen filer.');
  let source=zip.folder('app-source'),done=0,manifestFiles=[];
  for(let start=0;start<files.length;start+=4){
    let batch=files.slice(start,start+4);
    await Promise.all(batch.map(async row=>{
      let response=await fetch(disasterRawUrl(commitSha,row.path),{cache:'no-store'});
      if(!response.ok)throw new Error(`Kunne ikke hente appfilen ${row.path} (${response.status})`);
      let bytes=await response.arrayBuffer();source.file(row.path,bytes);
      if(row.path.startsWith('recovery/database/'))zip.file(`database/schema/${row.path.split('/').pop()}`,bytes);
      manifestFiles.push({path:row.path,git_sha:row.sha,size:row.size??bytes.byteLength});
      done++;setBackupProgress(`Henter appkode… ${done}/${files.length}`);
    }));
  }
  manifestFiles.sort((a,b)=>a.path.localeCompare(b.path));
  let meta={repository:PALA_BACKUP_REPOSITORY,branch:PALA_BACKUP_BRANCH,commit_sha:commitSha,tree_sha:commit.commit.tree.sha,commit_message:commit.commit.message||'',commit_date:commit.commit.committer?.date||commit.commit.author?.date||'',file_count:manifestFiles.length,files:manifestFiles};
  zip.file('app-source/repository-snapshot.json',JSON.stringify(meta,null,2));
  return meta;
}
function disasterWriteStructuredData(zip,portable){
  zip.file('database/data/pala-backup.json',JSON.stringify(portable,null,2));
  Object.entries(portable.tables||{}).forEach(([name,value])=>zip.file(`database/data/tables/${backupSafeName(name)}.json`,JSON.stringify(value,null,2)));
  Object.entries(portable.extensions||{}).forEach(([name,value])=>zip.file(`database/data/extensions/${backupSafeName(name)}.json`,JSON.stringify(value,null,2)));
  zip.file('database/data/device-state.json',JSON.stringify(portable.device_state||{},null,2));
}
function disasterRestoreGuide(raw,repo){
  return `# PALA disaster recovery\n\nOprettet: ${raw.created_at}\nGit commit: ${repo.commit_sha}\nRepository: ${repo.repository}\n\n## Hvad backupen indeholder\n\n- app-source/: hele GitHub-repositoryet ved den angivne commit, inklusive index.html, service worker, manifest, logoer, ikoner, fonts og recovery-filer.\n- database/schema/: database-setupfiler til at opbygge et nyt Supabase-projekt.\n- database/data/: aktuelle PALA-data i JSON, opdelt pr. tabel/område.\n- files/: billeder, PDF'er og andre uploadede filer trukket ud som rigtige filer.\n- manifest.json: kontrolfil med versionsinfo, antal poster, filoversigt og eventuelle eksportadvarsler.\n\n## Gendannelse\n\n1. Opret et nyt tomt Supabase-projekt.\n2. Kør SQL-filerne i database/schema/ i nummerorden. Legacy-filer i app-source/recovery/legacy er kun historik.\n3. Importér data fra database/data/ og bevar de originale id'er/relationer.\n4. Læg app-source/ i et nyt GitHub-repository eller anden statisk hosting.\n5. Opdatér den publicerbare Supabase URL/key i index.html til det nye projekt, hvis projektadressen er ændret.\n6. Test login, kalender, lager, pakkelister, systue, bemanding, billeder og dokumenter før systemet sættes i drift.\n\n## Sikkerhedscredentials\n\nAktive login-sessioner, midlertidige adgangstokens, database-passwords, service-role keys og medarbejdernes PIN/password-hemmeligheder eksporteres ikke til en browser-download. Ved disaster recovery skal disse roteres/nulstilles. Det beskytter mod, at en stjålet ZIP-fil samtidig bliver en kopi af alle aktive adgangsnøgler.\n\n## Kontrol\n\nHvis manifest.json indeholder warnings, skal de gennemgås før backupen betragtes som verificeret.\n`;
}

const collectSecurityBackupV112=collectSecurityBackup;
collectSecurityBackup=async function(){
  let raw=await collectSecurityBackupV112();
  raw.format='PALA disaster recovery backup';raw.format_version=2;
  raw.recovery_policy={source_code:'complete repository snapshot',database_schema:'recovery SQL included',business_data:'exported from current PALA state',uploads:'embedded uploads extracted to files/',active_sessions:'excluded by design',temporary_access_tokens:'excluded by design',passwords_and_pin_secrets:'excluded; reset required after restore',server_secrets:'excluded; rotate/recreate after restore'};
  return raw;
};

showAdminBackup=function(){
  if(!isAdminLoggedIn())return showAdminLogin();act('na');history.replaceState(null,'',location.pathname+'?admin=backup');
  let due=backupDue();
  app.innerHTML=`<div class="card"><h2>Administration</h2>${adminTabs('backup')}</div><section class="card"><div class="row"><div><div class="small muted">DISASTER RECOVERY</div><h2 style="margin:3px 0">Fuld systembackup</h2></div><span class="pill ${due?'yellow':'green'}">${due?'Backup anbefales':'Backup udført denne måned'}</span></div><p>Pakker hele PALA-versionen som én ZIP: appkoden fra GitHub, database-recoveryfiler, aktuelle systemdata og alle uploadede billeder/dokumenter.</p><div class="backup-status card" style="box-shadow:none"><strong>${esc(backupLastLabel())}</strong><p class="small muted">Backupen er lavet til katastrofegendannelse. Aktive sessions, midlertidige tokens og hemmelige adgangsnøgler kopieres ikke og skal nulstilles/roteres ved restore.</p></div><button id="securityBackupButton" class="btn primary" onclick="exportSecurityBackupZip()">${uiIcon('document')} Eksportér fuld systembackup (ZIP)</button><p id="securityBackupProgress" class="small muted" style="margin-top:10px">Kun administratorer kan eksportere backupen. Afbryd ikke siden mens ZIP-filen bygges.</p></section>`;
};

exportSecurityBackupZip=async function(){
  if(!requireAdmin())return;let button=document.getElementById('securityBackupButton');if(button)button.disabled=true;
  try{
    if(!await ensureZipTools())throw new Error('ZIP-funktionen kunne ikke indlæses. Tjek internetforbindelsen og prøv igen.');
    let zip=new JSZip();
    let repo=await disasterAddRepositorySnapshot(zip);
    setBackupProgress('Henter database og uploads…');let raw=await collectSecurityBackup(),files=[],counter={value:1},portable=backupExtractEmbedded(raw,zip,['backup'],files,counter,raw);
    disasterWriteStructuredData(zip,portable);
    let counts={};Object.entries(raw.tables||{}).forEach(([key,value])=>counts[key]=Array.isArray(value)?value.length:0);Object.entries(raw.extensions||{}).forEach(([key,value])=>{if(Array.isArray(value))counts[key]=value.length});
    let manifest={format:raw.format,format_version:raw.format_version,created_at:raw.created_at,created_by:raw.created_by,repository:repo,record_counts:counts,uploaded_file_count:files.length,uploaded_files:files,recovery_policy:raw.recovery_policy,warnings:raw.warnings||[],verification:{repository_snapshot:repo.file_count>0?'complete':'failed',database_export:(raw.warnings||[]).length?'completed_with_warnings':'complete',uploads:'complete_if_listed',credentials:'reset_required'}};
    zip.file('manifest.json',JSON.stringify(manifest,null,2));
    zip.file('RESTORE.md',disasterRestoreGuide(raw,repo));
    zip.file('README.txt',`PALA FULD SYSTEMBACKUP\n\nGit commit: ${repo.commit_sha}\nOprettet: ${raw.created_at}\n\nSe RESTORE.md og manifest.json før gendannelse.\n`);
    setBackupProgress('Pakker fuld systembackup…');
    let blob=await zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:6}},meta=>setBackupProgress(`Pakker ZIP… ${Math.round(meta.percent)} %`));
    let date=new Date(),stamp=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`,url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`PALA-FULD-SYSTEMBACKUP-${stamp}.zip`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);localStorage.setItem(PALA_BACKUP_LAST_KEY,new Date().toISOString());showAdminBackup();
  }catch(error){console.error(error);alert('Systembackup kunne ikke oprettes: '+(error.message||error));setBackupProgress('Systembackup mislykkedes. Prøv igen.');if(button)button.disabled=false}
};
'''
text=text.replace(needle,block+'\n'+needle,1)
required=[marker,'disasterAddRepositorySnapshot','PALA-FULD-SYSTEMBACKUP','database/schema/','app-source/','RESTORE.md']
missing=[item for item in required if item not in text]
if missing:
    raise SystemExit('Verification failed: '+repr(missing))
path.write_text(text,encoding='utf-8')
