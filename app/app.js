/* =====================================================================
   APP — abertura, perfis, página inicial, janelas e galeria
   Não precisas de editar este ficheiro: tudo se muda no config.js.
   ===================================================================== */
(function () {
  'use strict';

  var CFG = window.CONFIG;
  var LISTA = window.LISTA_MIDIA || {};
  var I = (window.Player && Player.icones) || {};

  /* ---------- utilidades ---------- */
  function $(s, base) { return (base || document).querySelector(s); }
  function $$(s, base) { return Array.prototype.slice.call((base || document).querySelectorAll(s)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function hash(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function baralhar(arr) { var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function plural(n, um, varios) { return n + ' ' + (n === 1 ? um : varios); }

  var Guardar = {
    ler: function (k, def) { try { var v = localStorage.getItem('me-' + k); return v == null ? def : JSON.parse(v); } catch (e) { return def; } },
    gravar: function (k, v) { try { localStorage.setItem('me-' + k, JSON.stringify(v)); } catch (e) { /* sem armazenamento */ } }
  };

  var ICONE_INFO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9.5"/><path d="M12 11v6M12 7.5v.01"/></svg>';
  var ICONE_FILME = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/></svg>';
  var SETA_E = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';
  var SETA_D = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>';
  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

  /* ---------- erro no config.js ---------- */
  function mostrarErro(texto) {
    var ec = $('#erro-config');
    $$('.ecra, .ecra-inicio').forEach(function (e) { e.hidden = true; });
    ec.hidden = false;
    $('.erro-texto', ec).textContent = texto;
  }

  if (!CFG) {
    var e = (window.__errosCarga || []).filter(function (x) { return /config/i.test(x.ficheiro || ''); })[0] || (window.__errosCarga || [])[0];
    mostrarErro(e && e.linha ? ('config.js, linha ' + e.linha + ':\n' + e.msg) : 'O ficheiro config.js não foi lido. Provavelmente falta uma vírgula, uma aspa ou uma chaveta.');
    return;
  }

  /* ---------- valores por omissão ---------- */
  CFG.nomes = CFG.nomes || { ele: 'Ele', ela: 'Ela' };
  CFG.serie = CFG.serie || {};
  CFG.serie.titulo = CFG.serie.titulo || 'A Nossa História';
  CFG.serie.marca = CFG.serie.marca || CFG.serie.titulo;
  CFG.musica = CFG.musica || {};
  CFG.narrador = CFG.narrador || {};
  CFG.player = CFG.player || {};
  CFG.abertura = CFG.abertura || {};
  CFG.temporadas = CFG.temporadas || [];
  CFG.especiais = CFG.especiais || [];
  CFG.razoes = CFG.razoes || [];

  var MODO_PREP = CFG.modoPreparacao === true || (CFG.modoPreparacao !== false &&
    (location.protocol === 'file:' || /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|)$/.test(location.hostname) || /^192\.168\./.test(location.hostname)));

  /* ---------- datas ---------- */
  var INICIO = (function () {
    var m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(String(CFG.inicioNamoro || ''));
    if (!m) return null;
    var d = new Date(+m[1], +m[2] - 1, +m[3]);
    return isNaN(d) ? null : d;
  })();

  function diasNoMes(a, m) { return new Date(a, m + 1, 0).getDate(); }
  function juntos(agora) {
    if (!INICIO || agora < INICIO) return null;
    var anos = agora.getFullYear() - INICIO.getFullYear();
    var meses = agora.getMonth() - INICIO.getMonth();
    var dias = agora.getDate() - INICIO.getDate();
    if (dias < 0) { meses--; dias += diasNoMes(agora.getFullYear(), agora.getMonth() - 1); }
    if (meses < 0) { anos--; meses += 12; }
    var hoje0 = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    var totalDias = Math.round((hoje0 - INICIO) / 864e5);
    var resto = (agora - hoje0) / 1000;
    return {
      anos: anos, meses: meses, dias: dias, totalDias: totalDias, totalMeses: anos * 12 + meses,
      h: Math.floor(resto / 3600), min: Math.floor(resto % 3600 / 60), s: Math.floor(resto % 60)
    };
  }
  function proximoMesversario(agora) {
    if (!INICIO) return null;
    var hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    var dia = INICIO.getDate();
    var cand = new Date(hoje.getFullYear(), hoje.getMonth(), Math.min(dia, diasNoMes(hoje.getFullYear(), hoje.getMonth())));
    if (cand < hoje) {
      var a = hoje.getFullYear(), m = hoje.getMonth() + 1;
      if (m > 11) { m = 0; a++; }
      cand = new Date(a, m, Math.min(dia, diasNoMes(a, m)));
    }
    var meses = (cand.getFullYear() - INICIO.getFullYear()) * 12 + (cand.getMonth() - INICIO.getMonth());
    return { data: cand, faltam: Math.round((cand - hoje) / 864e5), meses: meses };
  }
  function dataTexto(d) { return d.getDate() + ' de ' + MESES[d.getMonth()] + ' de ' + d.getFullYear(); }

  /* ---------- textos com etiquetas ---------- */
  function fmt(t) {
    if (t == null) return '';
    var j = juntos(new Date());
    return String(t)
      .replace(/\{ele\}/g, CFG.nomes.ele || '')
      .replace(/\{ela\}/g, CFG.nomes.ela || '')
      .replace(/\{dias\}/g, j ? j.totalDias.toLocaleString('pt-PT') : '…')
      .replace(/\{meses\}/g, j ? String(j.totalMeses) : '…')
      .replace(/\{serie\}/g, CFG.serie.titulo);
  }
  function textoJuntos() {
    var j = juntos(new Date());
    return j ? ('Juntos há ' + j.totalDias.toLocaleString('pt-PT') + ' dias.') : '';
  }
  function tituloPartes() {
    var t = fmt(CFG.serie.titulo);
    var m = /^(.*\S)\s+(\S*&\S*)$/.exec(t);
    var l1 = m ? m[1] : '', l2 = m ? m[2] : t;
    return { linha1: l1, linha2Html: esc(l2).replace(/&amp;/g, '<span class="amp">&amp;</span>'), longo: l2.length > 7 };
  }
  function marcaHtml() {
    return esc(fmt(CFG.serie.marca)).replace(/&amp;/g, '<span class="amp">&amp;</span>');
  }

  /* =================================================================
     DADOS: episódios e mídia
     ================================================================= */
  function legendaDe(base) { var i = base.indexOf(' - '); return i >= 0 ? base.slice(i + 3).trim() : ''; }
  function normalizarItem(it) {
    if (typeof it === 'string') it = { f: it };
    if (!it || !it.f) return null;
    var nome = String(it.f).split('/').pop();
    try { nome = decodeURIComponent(nome); } catch (e) { /* nome já legível */ }
    var base = nome.replace(/\.[^.]+$/, '');
    var t = it.t || (/\.(mp4|webm|mov|m4v|ogv)$/i.test(nome) ? 'video' : 'foto');
    return { f: it.f, t: t, w: it.w, h: it.h, mini: it.mini, poster: it.poster, d: it.d, nome: base, legenda: it.legenda != null ? it.legenda : legendaDe(base) };
  }
  function itensDe(pasta) {
    var arr = LISTA[pasta] || [];
    return arr.map(normalizarItem).filter(Boolean);
  }
  /* Música e narração: a lista diz que ficheiros existem em musica/ e narracao/.
     Assim um mp3 com outro nome também serve, e não se pede um ficheiro que não existe. */
  var AUDIO = window.LISTA_AUDIO || null;
  // "New West - Those Eyes (Official).mp3" também serve para "musica/those-eyes.mp3"
  function soLetras(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]/g, ''); }
  function resolverAudio(caminho) {
    if (!caminho) return null;
    if (!AUDIO) return caminho;
    var m = /^(musica|narracao)\/(.+)$/.exec(String(caminho));
    if (!m) return caminho;
    var alvo = m[2].toLowerCase();
    var nomes = (AUDIO[m[1]] || []).map(function (f) {
      var n = String(f).split('/').pop();
      try { n = decodeURIComponent(n); } catch (e) { /* ok */ }
      return { f: f, n: n };
    });
    var achado = nomes.filter(function (x) { return x.n.toLowerCase() === alvo; })[0];
    if (!achado && soLetras(alvo).length >= 5) achado = nomes.filter(function (x) { return soLetras(x.n).indexOf(soLetras(alvo)) >= 0; })[0];
    return achado ? achado.f : null;
  }
  // "musica/x.mp3#t=45" → resolve o ficheiro e mantém o ponto de início (#t=45)
  function audioComInicio(c) {
    var m = /^(.*?)(#t=[\d.]+)?$/.exec(String(c || ''));
    var r = m && resolverAudio(m[1]);
    return r ? r + (m[2] || '') : null;
  }
  function musicaDe(ep) {
    var propria = ep && ep.musica && audioComInicio(ep.musica);
    if (propria) return propria;
    if (!ep && CFG.trailer && CFG.trailer.musica) { var mt = audioComInicio(CFG.trailer.musica); if (mt) return mt; }
    if (CFG.musica.tema === null) return null; // sem tema: os outros episódios ficam com o piano
    var tema = audioComInicio(CFG.musica.tema || 'musica/tema.mp3');
    if (tema) return tema;
    if (AUDIO && AUDIO.musica && AUDIO.musica.length) return AUDIO.musica[0];
    return null;
  }

  /* "midia/perfil/ela.jpg" → encontra ela.JPG, ela.png, etc. na lista */
  function resolverFoto(caminho, preferirMini) {
    if (!caminho) return null;
    var m = /^midia\/([^/]+)\/([^/]+)$/.exec(String(caminho));
    if (m) {
      var alvo = m[2].replace(/\.[^.]+$/, '').toLowerCase();
      var achado = itensDe(m[1]).filter(function (i) { return i.nome.toLowerCase() === alvo; })[0];
      if (achado) return preferirMini ? (achado.mini || achado.f) : achado.f;
      if (LISTA[m[1]]) return null; // a pasta foi lida e a foto não está lá
    }
    return caminho;
  }

  var TEMPORADAS = [], ESPECIAIS = [], TODOS = [], POR_CHAVE = {};
  var variasTemporadas = CFG.temporadas.length > 1;

  function criarEp(e, info) {
    var itens = itensDe(e.pasta);
    var capaItem = null;
    var midia = itens.filter(function (i) { if (i.nome.toLowerCase() === 'capa') { capaItem = i; return false; } return true; });
    var ep = {
      chave: info.regular ? ('t' + (info.t + 1) + 'e' + info.n) : ('esp-' + (e.pasta || hash(e.titulo))),
      pasta: e.pasta || '', tipo: e.tipo === 'carta' ? 'carta' : 'normal',
      titulo: e.titulo || 'Sem título', subtitulo: e.subtitulo || '', sinopse: e.sinopse || '',
      narracao: e.narracao || [], carta: e.carta || '', musica: e.musica || null, narracaoAudio: resolverAudio(e.narracaoAudio),
      segundosPorFoto: e.segundosPorFoto, data: e.data || '',
      midia: midia, capaItem: capaItem, regular: !!info.regular, temporada: info.t, numero: info.n,
      temporadaNome: info.temporadaNome || '',
      rotulo: info.regular ? ((variasTemporadas ? 'T' + (info.t + 1) + ' ' : '') + 'E' + info.n) : 'Especial',
      rotuloLongo: info.regular ? ((variasTemporadas ? info.temporadaNome + ', ' : '') + 'Episódio ' + info.n) : 'Um episódio especial',
      finalTemporada: false
    };
    POR_CHAVE[ep.chave] = ep;
    TODOS.push(ep);
    return ep;
  }
  function temConteudo(ep) { return ep.midia.length > 0 || (ep.tipo === 'carta' && String(ep.carta).trim().length > 0); }
  function visivel(ep) { return MODO_PREP || temConteudo(ep); }

  CFG.temporadas.forEach(function (t, ti) {
    var eps = (t.episodios || []).map(function (e, ei) {
      return criarEp(e, { regular: true, t: ti, n: ei + 1, temporadaNome: t.nome || ('Temporada ' + (ti + 1)) });
    });
    TEMPORADAS.push({ nome: t.nome || ('Temporada ' + (ti + 1)), eps: eps });
  });
  CFG.especiais.forEach(function (e) { ESPECIAIS.push(criarEp(e, { regular: false })); });
  TEMPORADAS.forEach(function (t) {
    var vis = t.eps.filter(visivel);
    if (vis.length) vis[vis.length - 1].finalTemporada = true;
  });

  var REGULARES_VISIVEIS = [];
  TEMPORADAS.forEach(function (t) { t.eps.forEach(function (ep) { if (visivel(ep)) REGULARES_VISIVEIS.push(ep); }); });

  var FOTOS_CAPA = itensDe('capa').filter(function (i) { return i.t === 'foto'; });
  function todasAsFotos() {
    var r = [];
    TODOS.forEach(function (ep) { if (temConteudo(ep)) ep.midia.forEach(function (m) { if (m.t === 'foto') r.push(m); }); });
    return r.length ? r : FOTOS_CAPA.slice();
  }
  function todosOsVideos() {
    var r = [];
    TODOS.forEach(function (ep) { ep.midia.forEach(function (m) { if (m.t === 'video') r.push(m); }); });
    return r;
  }
  function fotosAleatorias(n) { return baralhar(todasAsFotos()).slice(0, n); }
  function videosAleatorios(n) { return baralhar(todosOsVideos()).slice(0, n); }

  function primeiraFoto(ep) { for (var i = 0; i < ep.midia.length; i++) if (ep.midia[i].t === 'foto') return ep.midia[i]; return null; }
  function capa(ep) {
    if (!ep || !ep.midia) return null;
    if (ep.capaItem) return ep.capaItem.mini || ep.capaItem.f;
    var f = primeiraFoto(ep);
    if (f) return f.mini || f.f;
    for (var i = 0; i < ep.midia.length; i++) if (ep.midia[i].poster) return ep.midia[i].poster;
    return null;
  }
  function capaGrande(ep) {
    if (ep.capaItem) return ep.capaItem.f;
    var f = primeiraFoto(ep);
    if (f) return f.f;
    return capa(ep);
  }
  function primeiroVideo(ep) { for (var i = 0; i < ep.midia.length; i++) if (ep.midia[i].t === 'video') return ep.midia[i]; return null; }

  function duracaoSegundos(ep) {
    var seg = ep.segundosPorFoto || CFG.player.segundosPorFoto || 5.5;
    if (ep.tipo === 'carta') return 14 + String(ep.carta).length * 0.075;
    var s = 6;
    ep.midia.forEach(function (m) { s += m.t === 'video' ? (m.d || 12) : seg; });
    var falas = 0; (ep.narracao || []).forEach(function (f) { falas += Math.max(2.6, 1.6 + f.length * 0.06) + 0.5; });
    return Math.max(s, falas + 6);
  }
  function duracaoTexto(ep) {
    if (!temConteudo(ep)) return 'Pasta vazia';
    var s = duracaoSegundos(ep);
    return s < 60 ? Math.round(s) + ' s' : Math.round(s / 60) + ' min';
  }

  function proximo(ep) {
    if (!ep || !ep.regular) return null;
    var i = REGULARES_VISIVEIS.indexOf(ep);
    return i >= 0 && i < REGULARES_VISIVEIS.length - 1 ? REGULARES_VISIVEIS[i + 1] : null;
  }

  /* ---------- progresso ---------- */
  var progresso = Guardar.ler('progresso', {});
  var vistos = Guardar.ler('vistos', {});
  function fracaoVista(ep) {
    var p = progresso[ep.chave];
    if (p && p.n) return Math.max(0.04, Math.min(1, p.i / (p.n - 1)));
    return vistos[ep.chave] ? 1 : 0;
  }
  function emCurso() {
    return Object.keys(progresso)
      .map(function (k) { return { ep: POR_CHAVE[k], p: progresso[k] }; })
      .filter(function (x) { return x.ep && visivel(x.ep) && x.p.i > 0; })
      .sort(function (a, b) { return b.p.t - a.p.t; })
      .map(function (x) { return x.ep; });
  }

  /* =================================================================
     PONTE COM O PLAYER
     ================================================================= */
  var ponte = {
    fmt: fmt, modoPrep: MODO_PREP,
    capa: capa, tituloPartes: tituloPartes, textoJuntos: textoJuntos,
    fotosAleatorias: fotosAleatorias, videosAleatorios: videosAleatorios,
    proximo: proximo, duracaoTexto: duracaoTexto, musicaDe: musicaDe,
    porChave: function (k) { return POR_CHAVE[k]; },
    gruposPainel: function () {
      var g = TEMPORADAS.map(function (t) { return { nome: t.nome, eps: t.eps.filter(visivel) }; }).filter(function (x) { return x.eps.length; });
      var esp = ESPECIAIS.filter(visivel);
      if (esp.length) g.push({ nome: 'Especiais', eps: esp });
      return g;
    },
    aoProgresso: function (ep, i, n) {
      if (i <= 0) return;
      progresso[ep.chave] = { i: i, n: n, t: Date.now() };
      Guardar.gravar('progresso', progresso);
    },
    aoTerminar: function (ep) {
      delete progresso[ep.chave];
      vistos[ep.chave] = true;
      Guardar.gravar('progresso', progresso);
      Guardar.gravar('vistos', vistos);
    },
    aoFechar: function () {
      atualizarHeroBotao();
      renderizarFilas();
    }
  };

  /* =================================================================
     ECRÃS DE ENTRADA
     ================================================================= */
  function trocarEcra(sair, entrar, depois) {
    if (sair) {
      sair.classList.add('a-sair');
      setTimeout(function () { sair.hidden = true; sair.classList.remove('a-sair'); }, 480);
    }
    setTimeout(function () {
      if (entrar) { entrar.hidden = false; entrar.classList.add('a-entrar'); setTimeout(function () { entrar.classList.remove('a-entrar'); }, 800); }
      if (depois) depois();
    }, sair ? 420 : 0);
  }

  function prepararAbertura() {
    document.title = fmt(CFG.serie.titulo);
    $('.abertura-marca').innerHTML = marcaHtml();
    $('.abertura-frase').textContent = fmt(CFG.abertura.frase || 'Uma série nova, feita só para ti.');
    var btn = $('#btn-abrir');
    btn.textContent = fmt(CFG.abertura.botao || 'Abrir');
    btn.addEventListener('click', function () {
      Som.contexto(); Som.prepararSessao();
      revelar();
    }, { once: true });
  }

  function revelar() {
    var rev = $('#ecra-revelacao');
    var marca = fmt(CFG.serie.marca);
    var partes = marca.split('&');
    var esq = $('.rev-esq', rev), amp = $('.rev-amp', rev), dir = $('.rev-dir', rev);
    if (partes.length === 2) { esq.textContent = partes[0].trim(); amp.textContent = '&'; dir.textContent = partes[1].trim(); }
    else { esq.textContent = ''; dir.textContent = ''; amp.textContent = marca; amp.setAttribute('font-size', Math.min(240, 900 / Math.max(1, marca.length))); }
    var reduzir = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var terminado = false;
    var seguir = function () {
      if (terminado) return; terminado = true;
      rev.classList.add('a-sair');
      setTimeout(function () { rev.hidden = true; rev.classList.remove('a-sair', 'a-tocar'); depoisDaRevelacao(); }, 650);
    };
    trocarEcra($('#ecra-abertura'), rev, function () {
      var arrancarAnim = function () {
        rev.classList.add('a-tocar');
        Som.abertura();
        setTimeout(seguir, reduzir ? 1200 : 3300);
      };
      if (document.fonts && document.fonts.load) {
        Promise.race([
          Promise.all([document.fonts.load('italic 400 100px "Cormorant Garamond"'), document.fonts.load('500 100px "Cormorant Garamond"')]),
          new Promise(function (ok) { setTimeout(ok, 900); })
        ]).then(arrancarAnim, arrancarAnim);
      } else arrancarAnim();
    });
    $('.btn-saltar-rev', rev).addEventListener('click', seguir, { once: true });
  }

  function depoisDaRevelacao() {
    var s = CFG.senha;
    if (s && s.ativa && !Guardar.ler('desbloqueado', false)) mostrarSenha();
    else mostrarPerfis();
  }

  function mostrarSenha() {
    var ec = $('#ecra-senha');
    var s = CFG.senha;
    $('.senha-marca', ec).innerHTML = marcaHtml();
    $('.senha-pergunta', ec).textContent = fmt(s.pergunta || 'Qual é a nossa data?');
    var input = $('#senha-input');
    input.placeholder = s.dica || '';
    var digitos = function (x) { return String(x || '').replace(/\D/g, ''); };
    var texto = function (x) { return String(x || '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
    // "24/6/2026" e "24/06/2026" são a mesma data
    var data = function (x) {
      var m = /^\s*(\d{1,2})\D+(\d{1,2})\D+(\d{2,4})\s*$/.exec(String(x || ''));
      return m ? (+m[1]) + '-' + (+m[2]) + '-' + (m[3].length === 2 ? '20' + m[3] : +m[3]) : null;
    };
    var certo = function (v) {
      var r = s.resposta || '';
      if (data(r) && data(v)) return data(r) === data(v);
      if (digitos(r).length >= 4) return digitos(v) === digitos(r);
      return texto(v) === texto(r);
    };
    if (!/\d/.test(String(s.resposta || ''))) input.removeAttribute('inputmode');
    $('form', ec).addEventListener('submit', function (e) {
      e.preventDefault();
      if (certo(input.value)) {
        Guardar.gravar('desbloqueado', true);
        input.blur();
        trocarEcra(ec, null, mostrarPerfis);
      } else {
        $('.senha-erro', ec).textContent = fmt(s.erro || 'Tenta outra vez.');
        var caixa = $('.senha-caixa', ec);
        caixa.classList.remove('abanar'); void caixa.offsetWidth; caixa.classList.add('abanar');
      }
    });
    trocarEcra(null, ec, function () { setTimeout(function () { input.focus(); }, 300); });
  }

  function avatarHtml(perfil, i) {
    var inicial = esc((fmt(perfil.nome) || '?').trim().charAt(0).toUpperCase());
    var foto = resolverFoto(perfil.foto, true);
    return '<span class="perfil-avatar cor-' + (i % 3) + '" data-inicial="' + inicial + '">' +
      (foto ? '<img src="' + esc(foto) + '" alt="" onerror="this.parentNode.textContent=this.parentNode.getAttribute(\'data-inicial\')">' : inicial) + '</span>';
  }

  /* ---------- PIN dos perfis (controlo parental) ---------- */
  var ICONE_CADEADO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
  var pinsAbertos = {}; // perfis já desbloqueados nesta visita
  function pinDe(p) {
    var b = CFG.bloqueioPerfis;
    if (!b || !b.ativo) return '';
    var pin = p.pin != null ? p.pin : b.pin;
    return String(pin == null ? '' : pin).replace(/\D/g, '');
  }
  function perfilAberto(p) {
    var id = p.id || p.nome;
    return !pinDe(p) || pinsAbertos[id] || (CFG.bloqueioPerfis.lembrar && Guardar.ler('pin-ok-' + id, false));
  }

  function pedirPin(p, i, entrar) {
    var ecPerfis = $('#ecra-perfis'), ec = $('#ecra-pin');
    var pin = pinDe(p), n = pin.length;
    var caixa = $('.pin-caixa', ec), input = $('#pin-input'), digitos = $('.pin-digitos', ec), erro = $('.pin-erro', ec);
    $('.pin-avatar', ec).innerHTML = avatarHtml(p, i);
    $('.pin-titulo', ec).textContent = 'Introduz o PIN para entrar no perfil de ' + fmt(p.nome) + '.';
    digitos.innerHTML = new Array(n + 1).join('<span></span>');
    input.maxLength = n; input.value = ''; erro.textContent = '';
    caixa.classList.remove('certo', 'abanar');
    var tentativas = 0;
    var desenhar = function () {
      var v = input.value;
      Array.prototype.forEach.call(digitos.children, function (s, k) {
        s.classList.toggle('cheio', k < v.length);
        s.classList.toggle('atual', k === Math.min(v.length, n - 1));
      });
    };
    var sair = function () { input.blur(); trocarEcra(ec, ecPerfis); };
    input.oninput = function () {
      input.value = input.value.replace(/\D/g, '').slice(0, n);
      erro.textContent = '';
      desenhar();
      if (input.value.length < n) return;
      if (input.value === pin) {
        var id = p.id || p.nome;
        pinsAbertos[id] = true;
        if (CFG.bloqueioPerfis.lembrar) Guardar.gravar('pin-ok-' + id, true);
        caixa.classList.add('certo');
        input.blur();
        setTimeout(function () { trocarEcra(ec, null, entrar); }, 350);
      } else {
        tentativas++;
        erro.textContent = tentativas >= 3 ? 'PIN errado. Este perfil é só para quem sabe o segredo.' : 'PIN errado. Tenta outra vez.';
        caixa.classList.remove('abanar'); void caixa.offsetWidth; caixa.classList.add('abanar');
        setTimeout(function () { input.value = ''; desenhar(); }, 380);
      }
    };
    input.onfocus = function () { caixa.classList.add('focado'); };
    input.onblur = function () { caixa.classList.remove('focado'); };
    $('form', ec).onsubmit = function (e) { e.preventDefault(); };
    $('.pin-voltar', ec).onclick = sair;
    ec.onkeydown = function (e) { if (e.key === 'Escape') sair(); };
    desenhar();
    trocarEcra(ecPerfis, ec, function () { setTimeout(function () { input.focus(); }, 120); });
  }

  var perfilAtual = null;
  function mostrarPerfis() {
    var ec = $('#ecra-perfis');
    var lista = $('.perfis-lista', ec);
    var perfis = CFG.perfis && CFG.perfis.length ? CFG.perfis : [{ id: 'ela', nome: '{ela}' }, { id: 'ele', nome: '{ele}' }];
    lista.innerHTML = perfis.map(function (p, i) {
      var bloqueado = !perfilAberto(p);
      return '<li><button class="perfil-btn" type="button" data-i="' + i + '"' + (bloqueado ? ' aria-label="' + esc(fmt(p.nome)) + ' (bloqueado com PIN)"' : '') + '>' + avatarHtml(p, i) +
        '<span class="perfil-nome' + (bloqueado ? ' perfil-cadeado' : '') + '">' + esc(fmt(p.nome)) + (bloqueado ? ICONE_CADEADO : '') + '</span></button></li>';
    }).join('');
    $$('.perfil-btn', lista).forEach(function (b) {
      b.addEventListener('click', function () {
        var i = +b.getAttribute('data-i');
        var p = perfis[i];
        var entrar = function (sair) {
          perfilAtual = { p: p, i: i };
          Guardar.gravar('perfil', p.id || String(i));
          trocarEcra(sair, $('#ecra-inicio'), function () { entrarNoInicio(); });
        };
        if (perfilAberto(p)) entrar(ec);
        else pedirPin(p, i, function () { entrar(null); });
      });
    });
    trocarEcra(null, ec);
  }

  /* =================================================================
     PÁGINA INICIAL
     ================================================================= */
  var inicioMontado = false;
  function entrarNoInicio() {
    if (!inicioMontado) { montarInicio(); inicioMontado = true; }
    window.scrollTo(0, 0);
    var topoPerfil = $('#btn-trocar-perfil');
    if (perfilAtual) topoPerfil.innerHTML = avatarHtml(perfilAtual.p, perfilAtual.i).replace('perfil-avatar', 'perfil-avatar topo-avatar');
    var msg = perfilAtual && perfilAtual.p.boasVindas ? fmt(perfilAtual.p.boasVindas) : '';
    var pm = proximoMesversario(new Date());
    if (pm && pm.faltam === 0 && pm.meses > 0) {
      msg = pm.meses % 12 === 0 ? ('Feliz aniversário de namoro! Hoje fazemos ' + plural(pm.meses / 12, 'ano', 'anos') + '.') : ('Feliz mesversário! Hoje fazemos ' + plural(pm.meses, 'mês', 'meses') + '.');
    }
    if (msg) setTimeout(function () { toast(msg, 4200); }, 900);
  }

  function montarInicio() {
    var t = tituloPartes();
    $('.logo').innerHTML = marcaHtml();
    var h1 = $('.hero-titulo');
    h1.innerHTML = (t.linha1 ? '<span class="linha1">' + esc(t.linha1) + '</span>' : '') + '<span class="linha2">' + t.linha2Html + '</span>';
    h1.classList.toggle('longo', t.longo);
    $('.hero-top1').innerHTML = '<span class="selo-n1"><span>Nº<b>1</b></span></span><span>no meu coração hoje</span>';
    var nEps = REGULARES_VISIVEIS.length;
    $('.hero-meta').innerHTML =
      '<span class="compat">100% compatíveis</span>' +
      (CFG.serie.ano ? '<span>' + esc(CFG.serie.ano) + '</span>' : '') +
      '<span class="selo-idade">' + esc(fmt(CFG.serie.classificacao || 'Todo o amor')) + '</span>' +
      (nEps ? '<span>' + plural(nEps, 'episódio', 'episódios') + '</span>' : '');
    $('.hero-sinopse').textContent = fmt(CFG.serie.sinopse || '');
    $('#btn-trailer').innerHTML = ICONE_FILME + 'Trailer';
    $('#btn-info').innerHTML = ICONE_INFO;
    $('#btn-assistir').addEventListener('click', assistirPrincipal);
    $('#btn-trailer').addEventListener('click', function () { Player.trailer(); });
    $('#btn-info').addEventListener('click', function () { abrirModal(null); });
    $('#btn-trocar-perfil').addEventListener('click', function () {
      trocarEcra($('#ecra-inicio'), null, mostrarPerfis);
    });
    if (!todasAsFotos().length && !todosOsVideos().length) $('#btn-trailer').hidden = true;
    atualizarHeroBotao();
    iniciarHeroFundo();
    renderizarFilas();
    renderizarRodape();
    avisoPreparacao();

    var topo = $('.topo');
    window.addEventListener('scroll', function () { topo.classList.toggle('solido', window.scrollY > 60); }, { passive: true });
    setInterval(atualizarContador, 1000);
  }

  function epParaAssistir() {
    var c = emCurso().filter(function (e) { return e.regular; })[0];
    if (c) return { ep: c, continuar: true };
    for (var i = 0; i < REGULARES_VISIVEIS.length; i++) if (!vistos[REGULARES_VISIVEIS[i].chave]) return { ep: REGULARES_VISIVEIS[i], continuar: false };
    return REGULARES_VISIVEIS[0] ? { ep: REGULARES_VISIVEIS[0], continuar: false } : null;
  }
  function atualizarHeroBotao() {
    var b = $('#btn-assistir');
    var x = epParaAssistir();
    b.hidden = !x;
    if (!x) return;
    b.innerHTML = (I.play || '') + (x.continuar ? 'Continuar ' + esc(x.ep.rotulo) : (vistos[x.ep.chave] || x.ep.numero === 1 ? 'Assistir' : 'Assistir ' + esc(x.ep.rotulo)));
  }
  function assistirPrincipal() {
    var x = epParaAssistir();
    if (!x) return;
    var p = progresso[x.ep.chave];
    Player.reproduzir(x.ep, x.continuar && p ? { cena: p.i } : {});
  }

  function iniciarHeroFundo() {
    var fotos = FOTOS_CAPA.length ? FOTOS_CAPA.slice() : fotosAleatorias(6);
    var camadas = $$('.hero-img');
    var fundo = $('.hero-fundo');
    if (!fotos.length) { fundo.classList.add('sem-fotos'); return; }
    var i = 0, ativa = 0;
    var mostrar = function () {
      var f = fotos[i % fotos.length];
      var img = new Image();
      img.onload = function () {
        var alvo = camadas[ativa], outra = camadas[1 - ativa];
        alvo.style.backgroundImage = 'url("' + f.f + '")';
        alvo.classList.remove('visivel'); void alvo.offsetWidth; alvo.classList.add('visivel');
        outra.classList.remove('visivel');
        ativa = 1 - ativa;
      };
      img.src = f.f;
      i++;
    };
    mostrar();
    if (fotos.length > 1) setInterval(function () { if (!document.hidden && !Player.aberto()) mostrar(); }, 8000);
  }

  /* ---------- contador ---------- */
  function contadorHtml() {
    var j = juntos(new Date());
    if (!j) {
      return MODO_PREP ? '<section class="juntos"><p class="juntos-rotulo">Juntos há…</p><p class="juntos-relogio">Define a data <code>inicioNamoro</code> no config.js para ver o contador.</p></section>' : '';
    }
    var blocos = [];
    if (j.anos) blocos.push([j.anos, j.anos === 1 ? 'ano' : 'anos']);
    blocos.push([j.meses, j.meses === 1 ? 'mês' : 'meses']);
    blocos.push([j.dias, j.dias === 1 ? 'dia' : 'dias']);
    return '<section class="juntos" aria-label="Há quanto tempo estamos juntos">' +
      '<p class="juntos-rotulo">Juntos há</p>' +
      '<div class="juntos-numeros">' + blocos.map(function (b) { return '<div><b>' + b[0] + '</b><span>' + b[1] + '</span></div>'; }).join('') + '</div>' +
      '<p class="juntos-relogio"></p><p class="juntos-mes"></p></section>';
  }
  function atualizarContador() {
    if (Player.aberto() || document.hidden) return;
    var rel = $('.juntos-relogio'), mes = $('.juntos-mes');
    if (!rel || !INICIO) return;
    var agora = new Date(), j = juntos(agora);
    if (!j) return;
    var dd = function (n) { return (n < 10 ? '0' : '') + n; };
    rel.textContent = j.totalDias.toLocaleString('pt-PT') + ' dias, ' + j.h + ' h ' + dd(j.min) + ' min ' + dd(j.s) + ' s de nós';
    var pm = proximoMesversario(agora);
    if (pm && mes) {
      var ehAno = pm.meses % 12 === 0;
      var nome = ehAno ? ('o nosso ' + (pm.meses / 12) + '.º aniversário') : ('o nosso ' + pm.meses + '.º mesversário');
      if (pm.faltam === 0) { mes.textContent = 'Hoje é ' + nome + '. Feliz ' + (ehAno ? 'aniversário' : 'mesversário') + ', meu amor.'; mes.classList.add('hoje'); }
      else mes.textContent = (pm.faltam === 1 ? 'Amanhã é ' : 'Faltam ' + pm.faltam + ' dias para ') + nome;
    }
  }

  /* ---------- filas ---------- */
  function arteHtml(ep, texto) { return '<div class="arte arte-' + (hash(ep.chave || ep) % 5) + '">' + (texto ? esc(texto) : '') + '</div>'; }
  function imgOuArte(src, ep, textoArte) {
    if (!src) return arteHtml(ep, textoArte);
    return '<img src="' + esc(src) + '" alt="" loading="lazy" decoding="async" data-arte="' + (hash(ep.chave || ep) % 5) + '">';
  }
  function thumbHtml(ep, textoArte) {
    var c = capa(ep);
    if (c) return imgOuArte(c, ep, textoArte);
    var v = primeiroVideo(ep);
    if (v) return '<video src="' + esc(v.f) + '#t=0.8" preload="metadata" muted playsinline></video>';
    return arteHtml(ep, textoArte);
  }
  function progressoHtml(ep) {
    var f = fracaoVista(ep);
    return f > 0 ? '<div class="tile-progresso"><i style="width:' + Math.round(f * 100) + '%"></i></div>' : '';
  }
  function tileEp(ep) {
    var vazio = !temConteudo(ep);
    return '<button class="tile tile-ep" type="button" data-chave="' + esc(ep.chave) + '">' +
      '<div class="tile-img">' + thumbHtml(ep, fmt(ep.titulo)) +
        (vazio ? '<span class="selo-vazio">Pasta vazia: ' + esc(ep.pasta) + '</span>' : '') +
        (ep.regular ? '<span class="tile-num">' + ep.numero + '</span>' : '') + progressoHtml(ep) +
      '</div>' +
      '<div class="tile-info"><div class="tile-nome">' + esc(fmt(ep.titulo)) + '</div><div class="tile-dur">' + esc(ep.rotulo) + '  ' + esc(duracaoTexto(ep)) + '</div></div>' +
    '</button>';
  }
  function tileEspecial(ep) {
    var vazio = !temConteudo(ep);
    var titulo = fmt(ep.titulo);
    var curto = titulo.replace(/\s/g, '').length <= 4;
    return '<button class="tile tile-especial" type="button" data-chave="' + esc(ep.chave) + '">' +
      '<div class="tile-img">' + thumbHtml(ep, '') +
        (vazio ? '<span class="selo-vazio">Pasta vazia</span>' : '') +
        '<div class="cartaz-texto"><span class="cartaz-tipo">' + (ep.tipo === 'carta' ? 'Uma carta' : 'Especial') + '</span>' +
        '<span class="cartaz-titulo' + (curto ? ' curto' : '') + '">' + esc(titulo) + '</span>' +
        (ep.subtitulo ? '<span class="cartaz-sub">' + esc(fmt(ep.subtitulo)) + '</span>' : '') + '</div>' +
        progressoHtml(ep) +
      '</div></button>';
  }

  var RAZOES = [];
  function prepararRazoes() {
    var fotosDela = (POR_CHAVE['esp-especial-ela'] && POR_CHAVE['esp-especial-ela'].midia.filter(function (m) { return m.t === 'foto'; })) || [];
    var reserva = fotosDela.length ? baralhar(fotosDela) : fotosAleatorias(10);
    RAZOES = CFG.razoes.slice(0, 10).map(function (r, i) {
      var texto = typeof r === 'string' ? r : (r && r.texto) || '';
      var foto = (r && r.foto) ? { f: resolverFoto(r.foto) } : (reserva.length ? reserva[i % reserva.length] : null);
      return { texto: fmt(texto), foto: foto };
    });
  }

  function fila(id, titulo, conteudo, sub) {
    return '<section class="fila" id="' + id + '">' +
      '<h2 class="fila-titulo">' + esc(titulo) + (sub ? '<span class="fila-sub">' + esc(sub) + '</span>' : '') + '</h2>' +
      '<button class="fila-seta esq" type="button" aria-label="Anterior">' + SETA_E + '</button>' +
      '<div class="fila-trilho">' + conteudo + '</div>' +
      '<button class="fila-seta dir" type="button" aria-label="Seguinte">' + SETA_D + '</button>' +
    '</section>';
  }

  var MOMENTOS = [];
  function renderizarFilas() {
    var main = $('.filas');
    if (!main) return;
    var h = contadorHtml();

    var curso = emCurso();
    if (curso.length) h += fila('fila-continuar', 'Continuar a ver' + (perfilAtual ? ' como ' + fmt(perfilAtual.p.nome) : ''), curso.map(tileEp).join(''));

    TEMPORADAS.forEach(function (t, i) {
      var eps = t.eps.filter(visivel);
      if (!eps.length) return;
      h += fila('fila-temporada-' + i, TEMPORADAS.length > 1 ? t.nome : 'Episódios', eps.map(tileEp).join(''), TEMPORADAS.length > 1 ? '' : t.nome);
    });

    var esp = ESPECIAIS.filter(visivel);
    if (esp.length) h += fila('fila-especiais', 'Especiais', esp.map(tileEspecial).join(''));

    if (!RAZOES.length) prepararRazoes();
    if (RAZOES.length) {
      h += fila('fila-razoes', 'Top ' + RAZOES.length + ': razões por que te amo', RAZOES.map(function (r, i) {
        return '<button class="tile tile-top' + (i >= 9 ? ' dois-digitos' : '') + '" type="button" data-razao="' + i + '" aria-label="Razão ' + (i + 1) + '">' +
          '<span class="top-num" aria-hidden="true">' + (i + 1) + '</span>' +
          '<div class="tile-img">' + (r.foto ? imgOuArte(r.foto.mini || r.foto.f, 'razao' + i) : arteHtml('razao' + i)) +
          '<span class="top-frase">' + esc(r.texto) + '</span></div></button>';
      }).join(''));
    }

    if (!MOMENTOS.length) MOMENTOS = fotosAleatorias(24);
    if (MOMENTOS.length) {
      h += fila('fila-momentos', 'Momentos', MOMENTOS.map(function (m, i) {
        return '<button class="tile tile-momento" type="button" data-momento="' + i + '" aria-label="Abrir foto">' +
          '<div class="tile-img">' + imgOuArte(m.mini || m.f, 'm' + i) + '</div></button>';
      }).join(''), 'Toca numa foto para a ver em grande');
    }

    if (!REGULARES_VISIVEIS.length && !esp.length) {
      h += '<p class="fila-vazia">Ainda não há episódios com fotos.</p>';
    }

    main.innerHTML = h;
    ligarFilas(main);
    atualizarContador();
  }

  function ligarFilas(main) {
    $$('[data-chave]', main).forEach(function (b) {
      b.addEventListener('click', function () { var ep = POR_CHAVE[b.getAttribute('data-chave')]; if (ep) abrirModal(ep); });
    });
    $$('[data-razao]', main).forEach(function (b) {
      b.addEventListener('click', function () { abrirRazao(+b.getAttribute('data-razao')); });
    });
    $$('[data-momento]', main).forEach(function (b) {
      b.addEventListener('click', function () { abrirGaleria(MOMENTOS, +b.getAttribute('data-momento')); });
    });
    $$('img[data-arte]', main).forEach(function (img) {
      img.addEventListener('error', function () {
        var d = document.createElement('div'); d.className = 'arte arte-' + img.getAttribute('data-arte');
        img.replaceWith(d);
      });
    });
    $$('.fila', main).forEach(function (f) {
      var trilho = $('.fila-trilho', f);
      var esq = $('.fila-seta.esq', f), dir = $('.fila-seta.dir', f);
      if (!esq) return;
      var passo = function (s) { trilho.scrollBy({ left: s * trilho.clientWidth * 0.85, behavior: 'smooth' }); };
      esq.addEventListener('click', function () { passo(-1); });
      dir.addEventListener('click', function () { passo(1); });
      var verificar = function () {
        esq.style.visibility = trilho.scrollLeft > 4 ? 'visible' : 'hidden';
        dir.style.visibility = trilho.scrollLeft + trilho.clientWidth < trilho.scrollWidth - 4 ? 'visible' : 'hidden';
      };
      trilho.addEventListener('scroll', verificar, { passive: true });
      setTimeout(verificar, 50);
    });
  }

  function renderizarRodape() {
    var r = $('.rodape');
    r.innerHTML =
      '<p class="rodape-frase">' + esc(fmt('Feito com amor por {ele}, para {ela}.')) + '</p>' +
      (INICIO ? '<p>Juntos desde ' + dataTexto(INICIO) + '.</p>' : '') +
      '<p class="rodape-mini">' + esc(fmt(CFG.serie.titulo)) + (CFG.serie.ano ? ', ' + esc(CFG.serie.ano) : '') + '</p>';
  }

  function avisoPreparacao() {
    if (!MODO_PREP) return;
    var av = $('.aviso-prep');
    var vazios = TODOS.filter(function (ep) { return !temConteudo(ep); });
    var listaVazia = !Object.keys(LISTA).some(function (k) { return (LISTA[k] || []).length; });
    var h = '<b>Modo de preparação.</b> Este aviso e os episódios vazios só aparecem no teu computador; no link que lhe vais enviar ficam escondidos. ';
    if (listaVazia) h += 'Ainda não há fotos na lista. Coloca-as nas pastas de <code>midia/</code> e depois abre <code>ferramentas/organizador.html</code> para atualizar a lista.';
    else if (vazios.length) h += plural(vazios.length, 'episódio ainda está', 'episódios ainda estão') + ' sem fotos: ' + vazios.map(function (e) { return esc(fmt(e.titulo)); }).join(', ') + '.';
    else h += 'Todos os episódios têm fotos. Está pronta para publicar.';
    av.innerHTML = h;
    av.hidden = false;
  }

  /* =================================================================
     JANELA DE INFORMAÇÕES / EPISÓDIO
     ================================================================= */
  var modalAnteriorFoco = null;
  function abrirJanela(html, classe) {
    var m = $('#modal'), caixa = $('.modal-caixa', m);
    if (m.hidden) {
      modalAnteriorFoco = document.activeElement;
      Historia.entrar(function () { fecharJanela(true); });
    }
    caixa.className = 'modal-caixa' + (classe ? ' ' + classe : '');
    caixa.innerHTML = '<button class="btn-redondo modal-fechar" type="button" aria-label="Fechar" data-fechar>' + (I.fechar || '×') + '</button>' + html;
    m.hidden = false;
    m.scrollTop = 0;
    document.body.classList.add('travado');
    $$('[data-fechar]', m).forEach(function (b) { b.onclick = fecharJanela; });
    setTimeout(function () { var f = $('.modal-fechar', m); if (f) f.focus({ preventScroll: true }); }, 50);
    return caixa;
  }
  function fecharJanela(pelaHistoria) {
    var m = $('#modal');
    if (m.hidden) return;
    if (pelaHistoria !== true) Historia.sair();
    m.hidden = true;
    document.body.classList.remove('travado');
    if (modalAnteriorFoco && modalAnteriorFoco.focus) modalAnteriorFoco.focus({ preventScroll: true });
  }

  function listaEpisodiosHtml(eps, atual) {
    return '<ul class="ep-lista">' + eps.map(function (ep) {
      var c = capa(ep);
      return '<li class="ep-item' + (ep.regular ? '' : ' sem-num') + (atual && atual.chave === ep.chave ? ' atual' : '') + '" tabindex="0" data-play="' + esc(ep.chave) + '" data-num="' + (ep.regular ? ep.numero : '') + '">' +
        '<div class="ep-item-img">' + (c ? '<img src="' + esc(c) + '" alt="" loading="lazy">' : arteHtml(ep)) + '<div class="play-sobre">' + (I.play || '') + '</div>' + progressoHtml(ep) + '</div>' +
        '<div class="ep-item-nome">' + esc(fmt(ep.titulo)) + '<small>' + esc(ep.rotulo) + '  ' + esc(duracaoTexto(ep)) + (ep.data ? '  ' + esc(ep.data) : '') + '</small></div>' +
        '<p class="ep-item-sinopse">' + esc(fmt(ep.sinopse)) + '</p></li>';
    }).join('') + '</ul>';
  }

  function abrirModal(ep) {
    var cabecaImg, titulo, acoes, sinopse, meta;
    var x = epParaAssistir();
    if (ep) {
      var p = progresso[ep.chave];
      cabecaImg = capaGrande(ep);
      titulo = '<span class="pequeno">' + esc(ep.rotuloLongo) + '</span>' + esc(fmt(ep.titulo));
      acoes = '<button class="btn btn-primario" type="button" data-acao="play">' + (I.play || '') + (p ? 'Continuar' : 'Assistir') + '</button>' +
        (p ? '<button class="btn btn-secundario" type="button" data-acao="inicio">Ver desde o início</button>' : '');
      sinopse = fmt(ep.sinopse) + (ep.subtitulo ? '' : '');
      meta = '<span class="compat">100% compatíveis</span><span>' + esc(duracaoTexto(ep)) + '</span>' + (ep.data ? '<span>' + esc(ep.data) + '</span>' : '');
    } else {
      var fotoSerie = FOTOS_CAPA[0] || fotosAleatorias(1)[0];
      cabecaImg = fotoSerie ? fotoSerie.f : null;
      var t = tituloPartes();
      titulo = (t.linha1 ? '<span class="pequeno">' + esc(t.linha1) + '</span>' : '') + t.linha2Html;
      acoes = (x ? '<button class="btn btn-primario" type="button" data-acao="principal">' + (I.play || '') + (x.continuar ? 'Continuar ' + esc(x.ep.rotulo) : 'Assistir') + '</button>' : '') +
        (todasAsFotos().length ? '<button class="btn btn-secundario" type="button" data-acao="trailer">' + ICONE_FILME + 'Trailer</button>' : '');
      sinopse = fmt(CFG.serie.sinopse);
      meta = '<span class="compat">100% compatíveis</span>' + (CFG.serie.ano ? '<span>' + esc(CFG.serie.ano) + '</span>' : '') +
        '<span class="selo-idade">' + esc(fmt(CFG.serie.classificacao || 'Todo o amor')) + '</span><span>' + plural(REGULARES_VISIVEIS.length, 'episódio', 'episódios') + '</span>';
    }

    var temporadasVis = TEMPORADAS.map(function (tp, i) { return { i: i, nome: tp.nome, eps: tp.eps.filter(visivel) }; }).filter(function (tp) { return tp.eps.length; });
    var tempInicial = ep && ep.regular ? Math.max(0, temporadasVis.findIndex(function (tp) { return tp.i === ep.temporada; })) : 0;
    var esp = ESPECIAIS.filter(visivel);

    var h = '<div class="modal-cabeca">' + (cabecaImg ? '<img src="' + esc(cabecaImg) + '" alt="">' : arteHtml(ep ? ep.chave : 'serie')) +
      '<div class="modal-cabeca-texto"><h2 class="modal-titulo">' + titulo + '</h2><div class="modal-acoes">' + acoes + '</div></div></div>' +
      '<div class="modal-corpo">' +
        '<div><div class="modal-meta">' + meta + '</div><p class="modal-sinopse">' + esc(sinopse) + '</p></div>' +
        '<div class="modal-lado">' +
          '<div><b>Elenco:</b> ' + esc(fmt('{ela}, {ele}')) + '</div>' +
          (CFG.serie.generos ? '<div><b>Géneros:</b> ' + esc(CFG.serie.generos.map(fmt).join(', ')) + '</div>' : '') +
          (CFG.serie.estaSerieE ? '<div><b>Esta série é:</b> ' + esc(CFG.serie.estaSerieE.map(fmt).join(', ')) + '</div>' : '') +
        '</div>' +
        '<div class="largura-toda">';
    if (temporadasVis.length) {
      h += '<div class="modal-secao"><h3>Episódios</h3>' +
        (temporadasVis.length > 1 ? '<select aria-label="Temporada">' + temporadasVis.map(function (tp, k) { return '<option value="' + k + '"' + (k === tempInicial ? ' selected' : '') + '>' + esc(tp.nome) + '</option>'; }).join('') + '</select>' : '<span class="fila-sub">' + esc(temporadasVis[0].nome) + '</span>') +
        '</div><div class="modal-eps">' + listaEpisodiosHtml(temporadasVis[tempInicial].eps, ep) + '</div>';
    }
    if (esp.length) h += '<div class="modal-secao"><h3>Especiais</h3></div>' + listaEpisodiosHtml(esp, ep);
    h += '<div class="modal-nota"><div><span class="selo-idade">' + esc(fmt(CFG.serie.classificacao || 'Todo o amor')) + '</span>' + esc(fmt(CFG.serie.avisoClassificacao || '')) + '</div>' +
      (INICIO ? '<div>Em exibição desde ' + dataTexto(INICIO) + '.</div>' : '') + '</div>';
    h += '</div></div>';

    var caixa = abrirJanela(h);
    var sel = $('select', caixa);
    if (sel) sel.addEventListener('change', function () {
      $('.modal-eps', caixa).innerHTML = listaEpisodiosHtml(temporadasVis[+sel.value].eps, ep);
      ligarListaEps(caixa);
    });
    ligarListaEps(caixa);
    $$('[data-acao]', caixa).forEach(function (b) {
      b.addEventListener('click', function () {
        var a = b.getAttribute('data-acao');
        fecharJanela();
        if (a === 'principal') assistirPrincipal();
        else if (a === 'trailer') Player.trailer();
        else if (a === 'play') { var pr = progresso[ep.chave]; Player.reproduzir(ep, pr ? { cena: pr.i } : {}); }
        else if (a === 'inicio') Player.reproduzir(ep);
      });
    });
  }
  function ligarListaEps(caixa) {
    $$('[data-play]', caixa).forEach(function (li) {
      var ir = function () { var e = POR_CHAVE[li.getAttribute('data-play')]; fecharJanela(); if (e) { var pr = progresso[e.chave]; Player.reproduzir(e, pr ? { cena: pr.i } : {}); } };
      li.onclick = ir;
      li.onkeydown = function (ev) { if (ev.key === 'Enter') ir(); };
    });
  }

  /* ---------- razões ---------- */
  function abrirRazao(i) {
    var r = RAZOES[i]; if (!r) return;
    var h = '<div class="razao-caixa"><div class="razao-foto">' + (r.foto ? '<img src="' + esc(r.foto.f) + '" alt="">' : arteHtml('razao' + i)) + '</div>' +
      '<div class="razao-corpo"><div class="razao-num" aria-hidden="true">' + (i + 1) + '</div>' +
      '<p class="razao-rotulo">Razão ' + (i + 1) + ' de ' + RAZOES.length + '</p>' +
      '<p class="razao-texto">' + esc(r.texto) + '</p>' +
      '<div class="razao-nav">' +
        (i > 0 ? '<button class="btn btn-secundario" type="button" data-ir="' + (i - 1) + '">Anterior</button>' : '') +
        (i < RAZOES.length - 1 ? '<button class="btn btn-primario" type="button" data-ir="' + (i + 1) + '">Próxima razão</button>' : '<button class="btn btn-primario" type="button" data-fechar>Fechar</button>') +
      '</div></div></div>';
    var caixa = abrirJanela(h, 'razao-janela');
    $$('[data-ir]', caixa).forEach(function (b) { b.addEventListener('click', function () { abrirRazao(+b.getAttribute('data-ir')); }); });
    $$('[data-fechar]', caixa).forEach(function (b) { b.onclick = fecharJanela; });
  }

  /* ---------- galeria ---------- */
  var G = { lista: [], i: 0 };
  function abrirGaleria(lista, i) {
    G.lista = lista; G.i = i;
    var g = $('#galeria');
    g.innerHTML = '<img alt=""><p class="galeria-legenda"></p>' +
      '<button class="btn-redondo g-fechar" type="button" aria-label="Fechar">' + (I.fechar || '×') + '</button>' +
      '<button class="btn-redondo g-ant" type="button" aria-label="Foto anterior">' + SETA_E + '</button>' +
      '<button class="btn-redondo g-seg" type="button" aria-label="Foto seguinte">' + SETA_D + '</button>';
    if (g.hidden) Historia.entrar(function () { fecharGaleria(true); });
    g.hidden = false;
    document.body.classList.add('travado');
    $('.g-fechar', g).onclick = fecharGaleria;
    $('.g-ant', g).onclick = function () { mudarGaleria(-1); };
    $('.g-seg', g).onclick = function () { mudarGaleria(1); };
    var x0 = null;
    g.ontouchstart = function (e) { x0 = e.touches[0].clientX; };
    g.ontouchend = function (e) { if (x0 == null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) mudarGaleria(dx < 0 ? 1 : -1); x0 = null; };
    mostrarGaleria();
    $('.g-fechar', g).focus({ preventScroll: true });
  }
  function mostrarGaleria() {
    var g = $('#galeria'), m = G.lista[G.i];
    var img = $('img', g);
    var nova = img.cloneNode(); nova.src = m.f; nova.alt = m.legenda || '';
    img.replaceWith(nova);
    $('.galeria-legenda', g).innerHTML = (m.legenda ? '<b>' + esc(m.legenda) + '</b>' : '') + (G.i + 1) + ' de ' + G.lista.length;
  }
  function mudarGaleria(d) { G.i = (G.i + d + G.lista.length) % G.lista.length; mostrarGaleria(); }
  function fecharGaleria(pelaHistoria) {
    var g = $('#galeria');
    if (g.hidden) return;
    if (pelaHistoria !== true) Historia.sair();
    g.hidden = true;
    document.body.classList.remove('travado');
  }

  /* ---------- toast ---------- */
  var toastTimer = 0;
  function toast(msg, ms) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('visivel');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('visivel'); }, ms || 3000);
  }

  /* ---------- teclado global ---------- */
  document.addEventListener('keydown', function (e) {
    if (Player.aberto()) return;
    if (e.key === 'Escape') {
      if (!$('#galeria').hidden) fecharGaleria();
      else fecharJanela();
    }
    if (!$('#galeria').hidden) {
      if (e.key === 'ArrowRight') mudarGaleria(1);
      if (e.key === 'ArrowLeft') mudarGaleria(-1);
    }
  });
  $('.modal-fundo').addEventListener('click', fecharJanela);

  /* =================================================================
     ARRANQUE
     ================================================================= */
  try {
    Player.configurar(CFG, ponte);
    prepararAbertura();
  } catch (err) {
    mostrarErro('Erro ao arrancar: ' + (err && err.message ? err.message : err) + '\nVerifica o config.js (nomes de campos, listas e aspas).');
    if (window.console) console.error(err);
  }

  // para testes e para o organizador
  window.__app = { POR_CHAVE: POR_CHAVE, TODOS: TODOS, MODO_PREP: MODO_PREP, juntos: juntos, proximoMesversario: proximoMesversario, fmt: fmt };
})();
