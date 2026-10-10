(()=>{
 const dialog=document.getElementById('researchSummary'),button=document.getElementById('summaryAgain');let previousFocus=null;
 const open=()=>{const game=window.__researchGame;if(!game?.state.ending||dialog.open)return;previousFocus=document.activeElement;game.state.modal=true;dialog.showModal();dialog.querySelector('.summary-scroll').scrollTop=0;};
 dialog.addEventListener('close',()=>{if(window.__researchGame)window.__researchGame.state.modal=false;(previousFocus?.isConnected?previousFocus:document.querySelector('#viewport canvas'))?.focus({preventScroll:true});});
 document.getElementById('summaryClose').onclick=()=>dialog.close();button.onclick=open;
 window.ResearchConclusion={open};
})();
