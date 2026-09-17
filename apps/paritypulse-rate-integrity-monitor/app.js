const issues = [
  {id:1,property:"Boulder Marriott",arrival:"Sep 24",channel:"Booking.com",direct:249,observed:218,severity:"critical",type:"Mobile-only discount",confidence:94,room:"Deluxe King",terms:"Flexible · tax included",observedTerms:"Mobile · tax included",why:"This offer is 12.4% below direct and may shift high-intent demand to a commissioned channel.",action:"Review the mobile promotion and wholesaler distribution path. Capture evidence before requesting a channel correction.",exposure:4280,roomMatch:"Exact",cancelMatch:"Matched",taxMatch:"Matched",repeat:true,source:"https://www.booking.com/"},
  {id:2,property:"Denver Tech Center Hotel",arrival:"Sep 27",channel:"Kayak",direct:189,observed:166,severity:"critical",type:"Metasearch undercut",confidence:91,room:"Standard King",terms:"Flexible · tax included",observedTerms:"Flexible · fees unclear",why:"Kayak surfaces a lower public offer before the guest reaches the direct booking path, creating a measurable conversion risk.",action:"Trace the displayed seller, verify final checkout taxes, then escalate the source-of-inventory leak.",exposure:3640,roomMatch:"Likely",cancelMatch:"Matched",taxMatch:"Review",repeat:true,source:"https://www.kayak.com/hotels"},
  {id:3,property:"Cherry Creek Suites",arrival:"Oct 02",channel:"Expedia",direct:312,observed:281,severity:"critical",type:"Member rate exposed",confidence:88,room:"One-bedroom Suite",terms:"Flexible · room only",observedTerms:"Member · room only",why:"A gated rate appears to be indexed in a public shopping path and is 9.9% below direct.",action:"Confirm whether the offer requires sign-in. If publicly accessible, audit Expedia campaign eligibility and rate-plan mapping.",exposure:2980,roomMatch:"Exact",cancelMatch:"Matched",taxMatch:"Matched",repeat:true,source:"https://www.expedia.com/Hotels"},
  {id:4,property:"Boulder Marriott",arrival:"Oct 06",channel:"Agoda",direct:229,observed:211,severity:"high",type:"Wholesale leakage",confidence:86,room:"Deluxe King",terms:"Flexible · tax included",observedTerms:"Non-refundable · tax included",why:"The visible price is lower, but cancellation terms differ. It still merits review because the gap exceeds the policy-adjusted threshold.",action:"Compare the fenced non-refundable direct rate, then identify whether a wholesaler supplied the inventory.",exposure:1730,roomMatch:"Exact",cancelMatch:"Different",taxMatch:"Matched",repeat:true,source:"https://www.agoda.com/"},
  {id:5,property:"Union Station Hotel",arrival:"Oct 08",channel:"Google Hotels",direct:274,observed:260,severity:"high",type:"Tax display mismatch",confidence:82,room:"Classic Queen",terms:"Flexible · tax included",observedTerms:"Flexible · pre-tax",why:"The headline rate is 5.1% lower, but taxes may explain part of the gap. The guest still sees an apparent undercut in search.",action:"Validate the landing-page total and align tax-display settings in the metasearch feed.",exposure:1420,roomMatch:"Exact",cancelMatch:"Matched",taxMatch:"Different",repeat:false,source:"https://www.google.com/travel/hotels"},
  {id:6,property:"Airport Gateway Hotel",arrival:"Oct 10",channel:"Hotels.com",direct:175,observed:166,severity:"high",type:"Loyalty discount",confidence:78,room:"Standard Two Queen",terms:"Flexible · tax included",observedTerms:"Member · tax included",why:"The 5.1% difference is tied to a loyalty offer. It is not necessarily a contract breach, but it weakens the direct-value proposition.",action:"Confirm the loyalty fence and consider a matching direct-member benefit.",exposure:980,roomMatch:"Exact",cancelMatch:"Matched",taxMatch:"Matched",repeat:false,source:"https://www.hotels.com/"},
  {id:7,property:"Golden Foothills Lodge",arrival:"Oct 13",channel:"Priceline",direct:204,observed:198,severity:"medium",type:"Small public gap",confidence:95,room:"Mountain King",terms:"Flexible · tax included",observedTerms:"Flexible · tax included",why:"The public offer is 2.9% below direct. The dollar gap is small, but exact comparability makes it worth monitoring.",action:"Watch the next two shops and open an investigation if the undercut persists.",exposure:470,roomMatch:"Exact",cancelMatch:"Matched",taxMatch:"Matched",repeat:false,source:"https://www.priceline.com/"},
  {id:8,property:"Union Station Hotel",arrival:"Oct 15",channel:"Booking.com",direct:289,observed:282,severity:"medium",type:"Geo-targeted offer",confidence:73,room:"Classic King",terms:"Flexible · tax included",observedTerms:"Geo offer · tax included",why:"The offer may be point-of-sale restricted. It is visible enough to affect selected markets but should not be treated as a universal disparity.",action:"Re-shop from the target point of sale and verify the geo fence before escalation.",exposure:390,roomMatch:"Likely",cancelMatch:"Matched",taxMatch:"Matched",repeat:false,source:"https://www.booking.com/"}
];

const properties=[...new Set(issues.map(i=>i.property))];
const channels=[
  {name:"Booking.com",risk:89,issues:4,gap:"−8.7%",level:"high"},{name:"Kayak",risk:81,issues:3,gap:"−7.1%",level:"high"},{name:"Expedia",risk:64,issues:2,gap:"−5.4%",level:"medium"},{name:"Agoda",risk:58,issues:2,gap:"−4.8%",level:"medium"},{name:"Google Hotels",risk:31,issues:1,gap:"−2.2%",level:"low"}
];

const $=s=>document.querySelector(s);
const money=n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);
const pct=i=>((i.direct-i.observed)/i.direct*100).toFixed(1);
let selected=issues[0], severityFilter="all";

function init(){
  $("#updatedAt").textContent=new Intl.DateTimeFormat("en-US",{hour:"numeric",minute:"2-digit"}).format(new Date());
  const arrival=new Date();arrival.setDate(arrival.getDate()+7);$("#scanArrival").value=arrival.toISOString().slice(0,10);
  properties.forEach(p=>$("#propertyFilter").insertAdjacentHTML("beforeend",`<option>${p}</option>`));
  renderIssues();renderDetail(selected);renderChannels();restoreLiveScans();
  document.querySelectorAll("[data-severity]").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll("[data-severity]").forEach(x=>x.classList.remove("active"));b.classList.add("active");severityFilter=b.dataset.severity;renderIssues()}));
  $("#propertyFilter").addEventListener("change",renderIssues);
  $("#openScanner").addEventListener("click",()=>$("#scannerDialog").showModal());
  $("#scannerForm").addEventListener("submit",runLiveScan);
  $("#markInvestigating").addEventListener("click",()=>{$("#markInvestigating").textContent="Investigation opened";$("#markInvestigating").disabled=true});
}

function visibleIssues(){const property=$("#propertyFilter").value;return issues.filter(i=>(property==="all"||i.property===property)&&(severityFilter==="all"||i.severity===severityFilter))}
function renderIssues(){
  const list=visibleIssues(),rows=$("#issueRows");rows.innerHTML="";$("#emptyState").hidden=!!list.length;
  list.forEach(i=>rows.insertAdjacentHTML("beforeend",`<tr data-id="${i.id}" class="${selected.id===i.id?"active":""}"><td><span class="property-cell"><strong>${i.property}</strong><span>${i.arrival} · ${i.room}</span></span></td><td>${i.channel}</td><td class="money">${money(i.direct)}</td><td class="money">${money(i.observed)}</td><td class="money negative">−${money(i.direct-i.observed)}<br><small>−${pct(i)}%</small></td><td><span class="severity ${i.severity}">${i.severity}</span></td></tr>`));
  rows.querySelectorAll("tr").forEach(r=>r.addEventListener("click",()=>{selected=issues.find(i=>i.id===Number(r.dataset.id));renderIssues();renderDetail(selected)}));
}
function renderDetail(i){
  $("#detailSeverity").textContent=i.severity;$("#detailSeverity").style.color=i.severity==="critical"?"var(--red)":i.severity==="high"?"var(--amber)":"var(--green)";
  $("#detailConfidence").textContent=`${i.confidence}% confidence`;$("#detailTitle").textContent=i.type;$("#detailSummary").textContent=`${i.property} · ${i.arrival} · ${i.room}`;
  $("#detailDirect").textContent=money(i.direct);$("#detailObserved").textContent=money(i.observed);$("#detailGap").textContent=`−${money(i.direct-i.observed)}`;$("#detailChannel").textContent=i.channel;
  $("#detailDirectTerms").textContent=i.terms;$("#detailObservedTerms").textContent=i.observedTerms;$("#detailWhy").textContent=i.why;$("#detailAction").textContent=i.action;
  $("#roomMatch").textContent=i.roomMatch;$("#cancelMatch").textContent=i.cancelMatch;$("#taxMatch").textContent=i.taxMatch;$("#detailExposure").textContent=money(i.exposure);$("#sourceLink").href=i.source;
  $("#markInvestigating").textContent="Start investigation";$("#markInvestigating").disabled=false;
}
function renderChannels(){$("#channelGrid").innerHTML=channels.map(c=>`<article class="channel-card ${c.level}"><header><h3>${c.name}</h3><span class="risk ${c.level}">${c.risk}/100</span></header><div class="risk-bar"><i style="width:${c.risk}%"></i></div><footer><span>${c.issues} issues</span><b>${c.gap} avg.</b></footer></article>`).join("")}

async function fetchPublicPage(url){
  const reader=`https://r.jina.ai/http://${url.replace(/^https?:\/\//,"")}`;
  const response=await fetch(reader,{headers:{Accept:"text/plain"}});
  if(!response.ok)throw new Error(`Source blocked (${response.status})`);
  return {text:await response.text(),reader};
}
function extractRate(text){
  const normalized=text.replace(/,/g,"");
  const patterns=[/(?:total|nightly|per night|room rate|price)[^$]{0,60}\$\s?(\d{2,5}(?:\.\d{2})?)/ig,/\$\s?(\d{2,5}(?:\.\d{2})?)[^\n]{0,45}(?:per night|nightly|total)/ig];
  const values=[];patterns.forEach(re=>{let m;while((m=re.exec(normalized))&&values.length<25){const n=Number(m[1]);if(n>=40&&n<=5000)values.push(n)}});
  return values.length?Math.min(...values):null;
}
async function runLiveScan(event){
  event.preventDefault();
  const submitter=event.submitter;if(submitter&&submitter.value==="cancel")return;
  const progress=$("#scanProgress"),result=$("#scanResults"),button=$("#runScan");progress.hidden=false;result.hidden=true;button.disabled=true;
  const urls=[$("#scanDirectUrl").value,$("#scanOtaUrl").value];
  try{
    const settled=await Promise.allSettled(urls.map(fetchPublicPage));
    const rates=settled.map(s=>s.status==="fulfilled"?extractRate(s.value.text):null);
    const blocked=settled.map((s,index)=>s.status==="rejected"?`${index===0?"Direct":"Comparison"}: ${s.reason.message}`:null).filter(Boolean);
    if(rates.every(Boolean)){
      const gap=rates[0]-rates[1],gapPct=gap/rates[0]*100;
      result.innerHTML=`<b>${gap>0?"Potential disparity found":"No undercut found"}</b><br>Direct ${money(rates[0])} · comparison ${money(rates[1])} · ${gap>0?`${gapPct.toFixed(1)}% below direct`:`${Math.abs(gapPct).toFixed(1)}% at or above direct`}<br><small>Candidate prices extracted from the public pages. Confirm room, tax, occupancy, and cancellation terms before action.</small>`;
      saveLiveScan({hotel:$("#scanHotel").value,arrival:$("#scanArrival").value,urls,rates,at:new Date().toISOString()});
    }else{
      const found=rates.map((r,i)=>r?`${i===0?"Direct":"Comparison"} ${money(r)}`:null).filter(Boolean).join(" · ");
      result.innerHTML=`<b>Comparison needs review</b><br>${found||"No defensible public rate could be extracted."}${blocked.length?`<br>${blocked.join(" · ")}`:""}<br><small>ParityPulse does not invent values when a page is dynamic, gated, or blocked.</small>`;
    }
    result.hidden=false;$("#dataMode").textContent="Live source checked";$("#updatedAt").textContent="just now";
  }catch(error){result.innerHTML=`<b>Live scan could not finish</b><br>${error.message}`;result.hidden=false}
  finally{progress.hidden=true;button.disabled=false}
}
function saveLiveScan(scan){const scans=JSON.parse(localStorage.getItem("paritypulse-live-scans")||"[]");scans.unshift(scan);localStorage.setItem("paritypulse-live-scans",JSON.stringify(scans.slice(0,10)))}
function restoreLiveScans(){const scans=JSON.parse(localStorage.getItem("paritypulse-live-scans")||"[]");if(scans.length){$("#dataMode").textContent=`${scans.length} saved live scan${scans.length===1?"":"s"}`}}
document.addEventListener("DOMContentLoaded",init);
