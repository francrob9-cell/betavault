const portfolio = [
  {name:"Sheraton Denver Downtown Hotel",code:"dends",url:"https://www.marriott.com/en-us/hotels/dends-sheraton-denver-downtown-hotel/overview/"},
  {name:"Element Denver Downtown East",code:"denel",url:"https://www.marriott.com/en-us/hotels/denel-element-denver-downtown-east/overview/"},
  {name:"The Brown Palace Hotel and Spa, Autograph Collection",code:"denak",url:"https://www.marriott.com/en-us/hotels/denak-the-brown-palace-hotel-and-spa-autograph-collection/overview/"},
  {name:"Le Méridien Denver Downtown",code:"denmd",url:"https://www.marriott.com/en-us/hotels/denmd-le-meridien-denver-downtown/overview/"},
  {name:"Renaissance Denver Downtown City Center Hotel",code:"dendr",url:"https://www.marriott.com/en-us/hotels/dendr-renaissance-denver-downtown-city-center-hotel/overview/"},
  {name:"Residence Inn by Marriott Denver City Center",code:"dencd",url:"https://www.marriott.com/en-us/hotels/dencd-residence-inn-denver-city-center/overview/"},
  {name:"The Westin Denver Downtown",code:"denwi",url:"https://www.marriott.com/en-us/hotels/denwi-the-westin-denver-downtown/overview/"}
];

const sellerNames=["Official Site","Marriott.com","Booking.com","Expedia.com","Hotels.com","Priceline","Agoda","Travelocity","Orbitz","Super.com","Vio.com","Trip.com"];
let issues=[],offers=[],selected=null,severityFilter="all",lastObservation=null;
const $=s=>document.querySelector(s);
const money=n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);
const pct=i=>i.direct?((i.direct-i.observed)/i.direct*100).toFixed(1):"0.0";

function init(){
  const arrival=new Date();arrival.setDate(arrival.getDate()+14);$("#scanArrival").value=arrival.toISOString().slice(0,10);
  portfolio.forEach(p=>{
    $("#scanHotel").insertAdjacentHTML("beforeend",`<option value="${p.code}">${p.name}</option>`);
    $("#propertyFilter").insertAdjacentHTML("beforeend",`<option value="${p.name}">${p.name}</option>`);
  });
  renderIssues();renderChannels();
  document.querySelectorAll("[data-severity]").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll("[data-severity]").forEach(x=>x.classList.remove("active"));b.classList.add("active");severityFilter=b.dataset.severity;renderIssues()}));
  $("#propertyFilter").addEventListener("change",renderIssues);
  $("#windowFilter").addEventListener("change",e=>$("#scanNights").value=e.target.value);
  $("#openScanner").addEventListener("click",()=>$("#scannerDialog").showModal());
  $("#scannerForm").addEventListener("submit",runLiveScan);
  $("#markInvestigating").addEventListener("click",()=>{$("#markInvestigating").textContent="Investigation opened";$("#markInvestigating").disabled=true});
  restoreLiveShop();
}

function visibleIssues(){const property=$("#propertyFilter").value;return issues.filter(i=>(property==="all"||i.property===property)&&(severityFilter==="all"||i.severity===severityFilter))}
function renderIssues(){
  const list=visibleIssues(),rows=$("#issueRows");rows.innerHTML="";$("#emptyState").hidden=!!list.length;
  $("#emptyState").textContent=issues.length?"No disparities match this filter.":"No live disparities loaded. Run a Marriott shop to populate this queue.";
  list.forEach(i=>rows.insertAdjacentHTML("beforeend",`<tr data-id="${i.id}" class="${selected&&selected.id===i.id?"active":""}"><td><span class="property-cell"><strong>${i.property}</strong><span>${i.arrival} · public seller stack</span></span></td><td>${i.channel}</td><td class="money">${money(i.direct)}</td><td class="money">${money(i.observed)}</td><td class="money negative">−${money(i.direct-i.observed)}<br><small>−${pct(i)}%</small></td><td><span class="severity ${i.severity}">${i.severity}</span></td></tr>`));
  rows.querySelectorAll("tr").forEach(r=>r.addEventListener("click",()=>{selected=issues.find(i=>i.id===r.dataset.id);renderIssues();renderDetail(selected)}));
}
function renderDetail(i){if(!i)return;
  $("#detailSeverity").textContent=i.severity;$("#detailSeverity").style.color=i.severity==="critical"?"var(--red)":i.severity==="high"?"var(--amber)":"var(--green)";
  $("#detailConfidence").textContent="Observed live";$("#detailTitle").textContent=`${i.channel} undercuts Marriott`;$("#detailSummary").textContent=`${i.property} · ${i.arrival}`;
  $("#detailDirect").textContent=money(i.direct);$("#detailObserved").textContent=money(i.observed);$("#detailGap").textContent=`−${money(i.direct-i.observed)}`;$("#detailChannel").textContent=i.channel;
  $("#detailDirectTerms").textContent="Official public offer";$("#detailObservedTerms").textContent="OTA public offer";
  $("#detailWhy").textContent=`The observed ${i.channel} offer is ${pct(i)}% below Marriott's official offer in the same seller stack. Final parity requires checkout-level validation of room and terms.`;
  $("#detailAction").textContent="Open the live source, confirm identical room, cancellation, occupancy, tax, membership, and device conditions, then preserve evidence before escalation.";
  $("#roomMatch").textContent="Headline offer";$("#cancelMatch").textContent="Verify at checkout";$("#taxMatch").textContent="Displayed with fees";$("#detailExposure").textContent=formatTimestamp(i.observedAt);$("#sourceLink").href=i.source;
  $("#sourceLink").textContent="Open live source";
  $("#markInvestigating").textContent="Start investigation";$("#markInvestigating").disabled=false;
}
function updateMetrics(){
  const direct=offers.find(o=>o.isDirect),undercuts=issues.length,score=direct?Math.max(0,Math.round(100-(undercuts/Math.max(offers.length-1,1))*100)):null;
  $("#parityScore").textContent=score??"—";$("#scoreRing").style.setProperty("--score",score??0);$("#scoreStatus").textContent=score===null?"No official rate returned":score===100?"No public undercut":"Review live disparities";$("#scoreDelta").textContent=lastObservation?formatTimestamp(lastObservation):"No modeled rates";
  $("#openIssues").textContent=undercuts;const critical=issues.filter(i=>i.severity==="critical").length;$("#criticalIssues").textContent=`${critical} critical`;
  const largest=issues.length?Math.max(...issues.map(i=>(i.direct-i.observed)/i.direct*100)):0;$("#leakage").textContent=issues.length?`${largest.toFixed(1)}%`:"0%";$("#repeatOffenders").textContent=offers.length;$("#offenderDetail").textContent=offers.map(o=>o.seller).join(" · ")||"No sources returned";
  $("#updatedAt").textContent=lastObservation?formatTimestamp(lastObservation):"not yet shopped";$("#dataMode").textContent=lastObservation?"Live observation loaded":"Live shop ready";
}
function renderChannels(){
  const grid=$("#channelGrid");
  if(!offers.length){grid.innerHTML=`<article class="channel-card"><header><h3>No live seller stack</h3><span class="risk low">READY</span></header><div class="risk-bar"><i style="width:0"></i></div><footer><span>Run a shop</span><b>Current offers only</b></footer></article>`;return}
  const direct=offers.find(o=>o.isDirect)?.rate;
  grid.innerHTML=offers.map(o=>{const gap=direct?((direct-o.rate)/direct*100):0,level=o.isDirect||gap<=0?"low":gap>=10?"high":"medium",risk=o.isDirect?0:Math.max(0,Math.min(100,Math.round(gap*8)));return `<article class="channel-card ${level}"><header><h3>${o.seller}</h3><span class="risk ${level}">${o.isDirect?"DIRECT":gap>0?"UNDERCUT":"IN PARITY"}</span></header><div class="risk-bar"><i style="width:${risk}%"></i></div><footer><span>${money(o.rate)}</span><b>${o.isDirect?"baseline":`${gap>0?"−":"+"}${Math.abs(gap).toFixed(1)}%`}</b></footer></article>`}).join("")
}

function formatTimestamp(value){return new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit",second:"2-digit"}).format(new Date(value))}
function checkoutDate(arrival,nights){const d=new Date(`${arrival}T12:00:00`);d.setDate(d.getDate()+Number(nights));return d.toISOString().slice(0,10)}
function liveSourceUrl(property,arrival,nights){
  const departure=checkoutDate(arrival,nights),query=encodeURIComponent(property.name);
  return `https://www.google.com/travel/search?q=${query}&checkin=${arrival}&checkout=${departure}&curr=USD`;
}
async function fetchSellerStack(property,arrival,nights){
  const source=liveSourceUrl(property,arrival,nights),reader=`https://r.jina.ai/http://${source.replace(/^https?:\/\//,"")}`;
  const response=await fetch(reader,{headers:{Accept:"text/plain"}});if(!response.ok)throw new Error(`Live source returned ${response.status}`);
  const text=await response.text();return {source,text,offers:parseOffers(text),stay:parseObservedStay(text)};
}
function parseObservedStay(text){const match=text.match(/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\s*[–-]\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+)?\d{1,2}\b/);return match?match[0]:null}
function parseOffers(text){
  const lines=text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean),found=[];
  for(let i=0;i<lines.length;i++){
    const seller=sellerNames.find(name=>lines[i].toLowerCase()===name.toLowerCase());if(!seller)continue;
    const window=lines.slice(i+1,i+9).join(" "),match=window.match(/\$\s?([0-9]{1,3}(?:,[0-9]{3})*|[0-9]{2,5})/);if(!match)continue;
    const rate=Number(match[1].replace(",",""));if(rate<40||rate>10000)continue;
    const normalized=seller==="Official Site"||seller==="Marriott.com"?"Marriott Official":seller;
    if(!found.some(o=>o.seller===normalized))found.push({seller:normalized,rate,isDirect:normalized==="Marriott Official"});
  }
  return found;
}
async function runLiveScan(event){
  event.preventDefault();if(event.submitter&&event.submitter.value==="cancel")return;
  const progress=$("#scanProgress"),result=$("#scanResults"),button=$("#runScan"),property=portfolio.find(p=>p.code===$("#scanHotel").value),arrival=$("#scanArrival").value,nights=$("#scanNights").value;
  progress.hidden=false;result.hidden=true;button.disabled=true;
  try{
    const live=await fetchSellerStack(property,arrival,nights);offers=live.offers;lastObservation=new Date().toISOString();
    const direct=offers.find(o=>o.isDirect);issues=[];
    if(direct){offers.filter(o=>!o.isDirect&&o.rate<direct.rate).forEach(o=>{const gap=(direct.rate-o.rate)/direct.rate*100;issues.push({id:`${property.code}-${o.seller}`,property:property.name,arrival:live.stay||arrival,channel:o.seller,direct:direct.rate,observed:o.rate,severity:gap>=10?"critical":gap>=5?"high":"medium",observedAt:lastObservation,source:live.source})})}
    selected=issues[0]||null;renderIssues();renderChannels();updateMetrics();if(selected)renderDetail(selected);
    $("#propertyFilter").value=property.name;
    result.innerHTML=`<b>${offers.length} live seller offer${offers.length===1?"":"s"} returned</b><br>${offers.map(o=>`${o.seller}: ${money(o.rate)}`).join(" · ")||"No readable seller prices were returned."}<br><small>${live.stay?`Source stay: ${live.stay}. `:""}Observed ${formatTimestamp(lastObservation)}. Verify room and policy terms at checkout before taking action.</small>`;result.hidden=false;
    localStorage.setItem("paritypulse-live-shop",JSON.stringify({property,arrival,nights,offers,issues,lastObservation,source:live.source}));
  }catch(error){result.innerHTML=`<b>Live shop unavailable</b><br>${error.message}<br><small>No rates were created or inferred.</small>`;result.hidden=false}
  finally{progress.hidden=true;button.disabled=false}
}
function restoreLiveShop(){
  try{const saved=JSON.parse(localStorage.getItem("paritypulse-live-shop")||"null");if(!saved)return;offers=saved.offers||[];issues=saved.issues||[];lastObservation=saved.lastObservation;selected=issues[0]||null;renderIssues();renderChannels();updateMetrics();if(selected)renderDetail(selected)}catch{}
}
document.addEventListener("DOMContentLoaded",init);
