/* ============================================================
   UniversoAccount — perfil local compartido para UniversoInfinito
   Sin contraseña, sin servidor: vive en el localStorage del
   navegador y lo comparten los 4 mundos + la portada, siempre que
   se sirvan desde el mismo dominio/carpeta.
   ============================================================ */
(function(window){
  var PROFILE_KEY  = 'ui_profile';
  var BADGES_KEY   = 'ui_badges';
  var STATS_KEY    = 'ui_stats';
  var PLAYER_ID_KEY = 'ui_player_id';

  var LEADERBOARD_COLLECTION = 'leaderboard';

  var WORLDS = {
    caja:      { label:'La Caja Mágica de Historias',        icon:'📦', file:'caja-magica-historias.html' },
    noticias:  { label:'Noticias del Universo X',             icon:'🛸', file:'noticias-universo-x.html' },
    periodico: { label:'El Cronista Prehistórico',            icon:'🦕', file:'periodico-dragon-marino.html' },
    manual:    { label:'El Gran Manual de la Lógica Absurda', icon:'📐', file:'manual-logica-absurda.html' }
  };

  var AVATARS = ['🦊','🐙','🦄','🐲','🚀','🌟','🦖','🐸'];

  // stat key -> puntos que vale cada unidad al calcular el puntaje total
  var STAT_WEIGHTS = {
    caja_historias:          6,
    noticias_ediciones:      6,
    noticias_palabras:       1,
    periodico_transmisiones: 6,
    manual_patentes:         8
  };
  var BADGE_WEIGHT = 20; // puntos por cada uno de los 4 mundos completado

  var STAT_LABELS = {
    caja_historias:          'Historias creadas',
    noticias_ediciones:      'Ediciones publicadas',
    noticias_palabras:       'Palabras inventadas',
    periodico_transmisiones: 'Noticieros transmitidos',
    manual_patentes:         'Inventos patentados'
  };

  function getPlayerId(){
    var id = null;
    try{ id = localStorage.getItem(PLAYER_ID_KEY); }catch(e){}
    if(!id){
      id = (window.crypto && crypto.randomUUID)
        ? crypto.randomUUID()
        : 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
      try{ localStorage.setItem(PLAYER_ID_KEY, id); }catch(e){}
    }
    return id;
  }

  function getStats(){
    var stats = {};
    try{ stats = JSON.parse(localStorage.getItem(STATS_KEY)) || {}; }catch(e){ stats = {}; }
    Object.keys(STAT_WEIGHTS).forEach(function(key){
      if(typeof stats[key] !== 'number') stats[key] = 0;
    });
    return stats;
  }

  function incrementStat(key, amount){
    if(!(key in STAT_WEIGHTS)) return getStats();
    var stats = getStats();
    stats[key] += (typeof amount === 'number' ? amount : 1);
    try{ localStorage.setItem(STATS_KEY, JSON.stringify(stats)); }catch(e){}
    syncToCloud();
    return stats;
  }

  function clearStats(){
    try{ localStorage.removeItem(STATS_KEY); }catch(e){}
  }

  function computeScore(badges, stats){
    badges = badges || getBadges();
    stats = stats || getStats();
    var score = 0;
    Object.keys(WORLDS).forEach(function(k){ if(badges[k]) score += BADGE_WEIGHT; });
    Object.keys(STAT_WEIGHTS).forEach(function(k){ score += (stats[k] || 0) * STAT_WEIGHTS[k]; });
    return score;
  }

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
    syncToCloud();
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
      syncToCloud();
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
    deleteFromCloud();
    clearProfile();
    clearBadges();
    clearStats();
    try{ localStorage.removeItem(PLAYER_ID_KEY); }catch(e){}
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

  /* ============================================================
     Sincronización con la nube (Firestore) — OPCIONAL.
     Si no existe window.FIREBASE_CONFIG (o el SDK de Firebase no
     está cargado), estas funciones no hacen nada y todo sigue
     funcionando 100% local, como antes.
     ============================================================ */
  var _db = null;
  var _cloudReady = false;

  function _initCloud(){
    if(_cloudReady) return _db;
    if(typeof firebase === 'undefined' || !window.FIREBASE_CONFIG) return null;
    try{
      if(!firebase.apps || !firebase.apps.length){
        firebase.initializeApp(window.FIREBASE_CONFIG);
      }
      _db = firebase.firestore();
      _cloudReady = true;
    }catch(e){
      _db = null;
    }
    return _db;
  }

  function isCloudEnabled(){
    return !!_initCloud();
  }

  function syncToCloud(){
    var db = _initCloud();
    if(!db) return;
    var profile = getProfile();
    if(!profile || !profile.name) return;
    var badges = getBadges();
    var stats = getStats();
    var data = {
      name: profile.name,
      avatar: profile.avatar,
      badges: badges,
      stats: stats,
      score: computeScore(badges, stats),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    db.collection(LEADERBOARD_COLLECTION).doc(getPlayerId()).set(data, { merge:true })
      .catch(function(err){ console.warn('UniversoAccount: no se pudo sincronizar', err); });
  }

  function deleteFromCloud(){
    var db = _initCloud();
    if(!db) return;
    db.collection(LEADERBOARD_COLLECTION).doc(getPlayerId()).delete().catch(function(){});
  }

  // callback(list, status) — list ordenada de mayor a menor puntaje.
  // status: 'ok' | 'offline' (no hay Firebase configurado) | 'error'
  // devuelve una función para cancelar la suscripción.
  function subscribeLeaderboard(callback){
    var db = _initCloud();
    if(!db){
      callback([], 'offline');
      return function(){};
    }
    return db.collection(LEADERBOARD_COLLECTION)
      .orderBy('score', 'desc')
      .limit(100)
      .onSnapshot(function(snapshot){
        var list = [];
        snapshot.forEach(function(doc){
          var d = doc.data();
          list.push({
            id: doc.id,
            name: d.name || '???',
            avatar: d.avatar || '🌟',
            badges: d.badges || {},
            stats: d.stats || {},
            score: typeof d.score === 'number' ? d.score : 0
          });
        });
        callback(list, 'ok');
      }, function(err){
        console.warn('UniversoAccount: error leyendo la tabla de posiciones', err);
        callback([], 'error');
      });
  }

  window.UniversoAccount = {
    WORLDS: WORLDS,
    AVATARS: AVATARS,
    STAT_LABELS: STAT_LABELS,
    getProfile: getProfile,
    saveProfile: saveProfile,
    clearProfile: clearProfile,
    getBadges: getBadges,
    setBadge: setBadge,
    clearBadges: clearBadges,
    resetAll: resetAll,
    badgeCount: badgeCount,
    prefillName: prefillName,
    renderNavChip: renderNavChip,
    getStats: getStats,
    incrementStat: incrementStat,
    clearStats: clearStats,
    computeScore: computeScore,
    getPlayerId: getPlayerId,
    isCloudEnabled: isCloudEnabled,
    syncToCloud: syncToCloud,
    deleteFromCloud: deleteFromCloud,
    subscribeLeaderboard: subscribeLeaderboard
  };
})(window);
