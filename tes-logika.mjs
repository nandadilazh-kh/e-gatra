import * as L from './src/logic.js';
let bad=0;
for (const s of [1,2,3,4]) for (const m of L.MISSIONS[s]) {
  if(!m.f){console.log('NOFAC',s,m.no);bad++;continue;}
  const tiles=L.solutionTiles(m.f).map((t,i)=>({...t,id:i}));
  const ev=L.evaluate(tiles);
  const tot=L.baseTotals(m,false), c=L.countsOf(tiles);
  const dx=c.x-tot.x, dnx=c.nx-tot.nx;
  // net check
  const net={a:c.x2,b:c.x-c.nx,c:c.u-c.nu};
  const okNet=net.a===m.a&&net.b===m.b&&net.c===m.c;
  const okEv=ev.status==='rect'&&ev.W.p*ev.H.q===m.a&&(ev.W.p*ev.H.n+ev.H.q*ev.W.m)===m.b&&ev.W.m*ev.H.n===m.c;
  const pairs=dx; const okPairs = dx===dnx && dx>=0 && (c.u-tot.u)===(c.nu-tot.nu);
  // sequential placement via snap
  let placed=[]; let okSnap=true; const x=3;
  for(const t of tiles){
    const d=L.dims(t); const dx0=L.GEO.ox+L.val(t.X,x)*L.GEO.u, dy0=L.GEO.oy+L.val(t.Y,x)*L.GEO.u;
    const r=L.snap({key:t.key,rot:t.rot},placed,x,placed.length?dx0+3:dx0,placed.length?dy0-2:dy0);
    if(!r.ok||(placed.length&&(!L.eq(r.X,t.X)||!L.eq(r.Y,t.Y)))){ if(placed.length||!r.ok){okSnap=false;console.log('snapfail',s,m.no,t,r);break;} }
    placed.push({...t,X:placed.length?r.X:r.X,Y:r.Y}); 
    if(!placed.length)0;
  }
  if(!okNet||!okEv||!okPairs||!okSnap){bad++;console.log('FAIL',s,m.no,m.a,m.b,m.c,m.f,okNet,okEv,okPairs,okSnap,ev.status)}
}
// mismatch test: flower beside x2
const b={id:0,key:'x2',X:[0,1],Y:[0,1]};
console.log('flower beside x2:',L.snap({key:'u'},[b],3,28+3*28+28+1,28+28*2));
console.log('jalan right of x2 :',L.snap({key:'x',rot:true},[b],3,28+4*28+28,28+28));
console.log(bad?'BAD '+bad:'ALL OK');
