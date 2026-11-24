(()=>{
 const filters=document.querySelector('.filters');
 if(filters){filters.hidden=false;filters.addEventListener('click',event=>{const button=event.target.closest('[data-filter]');if(!button)return;const value=button.dataset.filter;let visible=0;document.querySelectorAll('.work-card').forEach(card=>{card.hidden=value!=='all'&&card.dataset.category!==value;if(!card.hidden)visible++;});filters.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));document.querySelector('#filter-status').textContent=`Showing ${visible} ${visible===1?'project':'projects'}.`;});}
 const dialog=document.querySelector('#image-viewer');
 const links=[...document.querySelectorAll('[data-zoom]')];
 if(!dialog||!links.length||typeof dialog.showModal!=='function')return;
 let index=0,opener=null;
 const image=document.querySelector('#viewer-image');
 const render=()=>{const current=links[index];image.src=current.href;image.alt=current.dataset.caption;document.querySelector('#viewer-title').textContent=current.dataset.caption;document.querySelector('#viewer-count').textContent=`${index+1} / ${links.length}`;document.querySelector('#viewer-prev').disabled=index===0;document.querySelector('#viewer-next').disabled=index===links.length-1;};
 links.forEach((link,i)=>link.addEventListener('click',event=>{event.preventDefault();index=i;opener=link;render();dialog.showModal();document.body.style.overflow='hidden';document.querySelector('#viewer-close').focus();}));
 document.querySelector('#viewer-close').addEventListener('click',()=>dialog.close());
 document.querySelector('#viewer-prev').addEventListener('click',()=>{if(index>0){index--;render();}});
 document.querySelector('#viewer-next').addEventListener('click',()=>{if(index<links.length-1){index++;render();}});
 dialog.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'&&index>0){event.preventDefault();index--;render();}if(event.key==='ArrowRight'&&index<links.length-1){event.preventDefault();index++;render();}});
 dialog.addEventListener('close',()=>{document.body.style.overflow='';if(opener)opener.focus();});
})();
