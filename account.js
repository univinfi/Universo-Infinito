/* ============================================================
   UniversoAccount — perfil local compartido para UniversoInfinito
   Sin contraseña, sin servidor: vive en el localStorage del
   navegador y lo comparten los 4 mundos + la portada, siempre que
   se sirvan desde el mismo dominio/carpeta.
   ============================================================ */
(function(window){
  var PROFILE_KEY = 'ui_profile';
  var BADGES_KEY  = 'ui_badges';

  var WORLDS = {
    caja:      { label:'La Caja Mágica de Historias',        icon:'📦', file:'caja-magica-historias.html' },
    noticias:  { label:'Noticias del Universo X',             icon:'🛸', file:'noticias-universo-x.html' },
    periodico: { label:'El Cronista Prehistórico',            icon:'🦕', file:'periodico-dragon-marino.html' },
    manual:    { label:'El Gran Manual de la Lógica Absurda', icon:'📐', file:'manual-logica-absurda.html' }
  };

  var AVATARS = ['🦊','🐙','🦄','🐲','🚀','🌟','🦖','🐸'];

  function getProfile(){
    try{
      var raw = localStorage.getItem(PROFILE_KEY);
      return raw ? JSON.parse(raw) : null;
    }catch(e){ return null; }
  }

  function saveProfile(name, avatar){
    var clean = String(name || '').trim().slice(0, 40);
    var profile = { name: clean, avatar: avatar || AVATARS[0], createdAt: Date.now() };
    try{ localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); }catch(e){}
    return profile;
  }

  function clearProfile(){
    try{ localStorage.removeItem(PROFILE_KEY); }catch(e){}
  }

  function getBadges(){
    var badges = {};
    try{ badges = JSON.parse(localStorage.getItem(BADGES_KEY)) || {}; }catch(e){ badges = {}; }
    Object.keys(WORLDS).forEach(function(key){
      if(typeof badges[key] !== 'boolean') badges[key] = false;
    });
    return badges;
  }

  function setBadge(worldKey){
    if(!WORLDS[worldKey]) return getBadges();
    var badges = getBadges();
    if(!badges[worldKey]){
      badges[worldKey] = true;
      try{ localStorage.setItem(BADGES_KEY, JSON.stringify(badges)); }catch(e){}
    }
    return badges;
  }

  function badgeCount(){
    var badges = getBadges();
    return Object.keys(WORLDS).filter(function(k){ return badges[k]; }).length;
  }

  function clearBadges(){
    try{ localStorage.removeItem(BADGES_KEY); }catch(e){}
  }

  function resetAll(){
    clearProfile();
    clearBadges();
  }

  // Prefills a text input with the saved name, only if the input is empty.
  function prefillName(inputEl){
    var profile = getProfile();
    if(profile && profile.name && inputEl && !inputEl.value){
      inputEl.value = profile.name;
    }
    return profile;
  }

  // Renders a small "avatar + name + back to portal" pill into a container.
  // Safe against special characters (uses textContent, not innerHTML).
  function renderNavChip(container){
    if(!container) return null;
    container.innerHTML = '';
    var profile = getProfile();
    if(!profile) return null;

    var chip = document.createElement('a');
    chip.href = 'index.html';
    chip.title = 'Volver al portal de UniversoInfinito';
    chip.style.cssText = 'display:inline-flex;align-items:center;gap:8px;'
      + 'padding:6px 12px 6px 6px;border-radius:999px;'
      + 'background:rgba(13,12,29,.55);border:1px solid rgba(255,255,255,.25);'
      + 'color:#fff;text-decoration:none;font-family:system-ui,-apple-system,sans-serif;'
      + 'font-size:.82rem;font-weight:700;backdrop-filter:blur(6px);white-space:nowrap;';

    var av = document.createElement('span');
    av.style.cssText = 'width:26px;height:26px;border-radius:50%;flex:none;'
      + 'background:rgba(255,255,255,.18);display:flex;align-items:center;'
      + 'justify-content:center;font-size:15px;';
    av.textContent = profile.avatar;

    var nm = document.createElement('span');
    nm.textContent = profile.name;

    var back = document.createElement('span');
    back.style.cssText = 'opacity:.7;font-size:.72rem;font-weight:600;';
    back.textContent = '↩ Portal';

    chip.appendChild(av);
    chip.appendChild(nm);
    chip.appendChild(back);
    container.appendChild(chip);
    return chip;
  }

  window.UniversoAccount = {
    WORLDS: WORLDS,
    AVATARS: AVATARS,
    getProfile: getProfile,
    saveProfile: saveProfile,
    clearProfile: clearProfile,
    getBadges: getBadges,
    setBadge: setBadge,
    clearBadges: clearBadges,
    resetAll: resetAll,
    badgeCount: badgeCount,
    prefillName: prefillName,
    renderNavChip: renderNavChip
  };
})(window);
