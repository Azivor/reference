document.querySelectorAll('[data-copy]').forEach(button=>{
 button.addEventListener('click',async()=>{
  const field=document.getElementById(button.dataset.copy);
  const status=document.getElementById('copy-status');
  try{
   await navigator.clipboard.writeText(field.value);
   button.textContent='Copied';
   status.textContent=button.dataset.copy==='server-url'?'Server address copied.':button.dataset.copy==='plugin-name'?'Plugin name copied.':'Example prompt copied.';
  }catch{
   field.focus();field.select();
   status.textContent='The text is selected. Copy it with your keyboard or touch menu.';
  }
 });
});
