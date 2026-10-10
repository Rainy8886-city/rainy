(()=>{const dialog=document.getElementById('dedicationDialog');let savedFocus=null;
 function open(){const game=window.__researchGame;if(!game?.state.ending||game.state.hall!==3||game.state.modal||dialog.open)return;savedFocus=document.activeElement;window.dispatchEvent(new Event('research-clear-input'));game.state.modal=true;dialog.showModal();dialog.querySelector('.dedication-body').scrollTop=0;}
 dialog.addEventListener('close',()=>{if(window.__researchGame)window.__researchGame.state.modal=false;window.dispatchEvent(new Event('research-clear-input'));(savedFocus?.isConnected?savedFocus:document.querySelector('#viewport canvas'))?.focus({preventScroll:true});});
 document.getElementById('dedicationClose').onclick=()=>dialog.close();document.getElementById('dedicationReplay').onclick=()=>document.getElementById('replay').click();
 window.ResearchDedication={open};
})();
