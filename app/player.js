/* =====================================================================
   PLAYER — transforma fotos e vídeos num episódio
   Cenas: título → fotos/vídeos (com transições, Ken Burns, legendas,
   narrador e música) → créditos (final da temporada) → fim.
   Não precisas de editar este ficheiro.
   ===================================================================== */
(function () {
  'use strict';

  var Player = {};
  var cfg = null;
  var app = null;

  /* Botão "voltar" do celular: fecha o player/janela em vez de sair do site */
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) { /* sem suporte */ }
  var Historia = window.Historia = {
    pilha: [], ignorar: 0, pendentes: 0, timer: 0,
    entrar: function (fechar) {
      this.pilha.push(fechar);
      try {
        if (this.pendentes > 0) {
          // uma janela acabou de fechar e outra abre no mesmo toque: reaproveita a entrada
          this.pendentes--;
          history.replaceState({ me: this.pilha.length }, '');
        } else {
          history.pushState({ me: this.pilha.length }, '');
        }
      } catch (e) { /* sem suporte */ }
    },
    sair: function () {
      if (!this.pilha.length) return;
      this.pilha.pop();
      this.pendentes++;
      var self = this;
      clearTimeout(this.timer);
      this.timer = setTimeout(function () {
        var n = self.pendentes; self.pendentes = 0;
        if (n > 0) { self.ignorar++; try { history.go(-n); } catch (e) { self.ignorar--; } }
      }, 0);
    }
  };
  window.addEventListener('popstate', function () {
    if (Historia.ignorar > 0) { Historia.ignorar--; return; }
    var fechar = Historia.pilha.pop();
    if (fechar) fechar(true);
  });

  /* ---------- utilidades ---------- */
  function $(s, base) { return (base || document).querySelector(s); }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function hash(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function aleatorio(semente) {
    var a = semente >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0; var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function lerOpcoes() { try { return JSON.parse(localStorage.getItem('me-opcoes-player') || '{}'); } catch (e) { return {}; } }
  function gravarOpcoes(o) { try { localStorage.setItem('me-opcoes-player', JSON.stringify(o)); } catch (e) { /* sem armazenamento */ } }
  function tempoTexto(seg) {
    seg = Math.max(0, Math.round(seg));
    var m = Math.floor(seg / 60), s = seg % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }
  function duracaoLeitura(t) { return Math.max(2.6, Math.min(7.5, 1.6 + String(t).length * 0.06)); }

  /* ---------- ícones ---------- */
  var I = {
    voltar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z"/></svg>',
    pausa: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="5.5" y="4" width="4.5" height="16" rx="1"/><rect x="14" y="4" width="4.5" height="16" rx="1"/></svg>',
    ant: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 17l-5-5 5-5M18 17l-5-5 5-5"/></svg>',
    seg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 17l5-5-5-5M6 17l5-5-5-5"/></svg>',
    musica: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
    narrador: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v4M8 21h8"/></svg>',
    legendas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M7 15h4M13 15h4M7 11h10"/></svg>',
    episodios: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="15" height="13" rx="2"/><path d="M6 3h14a2 2 0 0 1 2 2v11"/></svg>',
    proximo: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 5.5v13a1 1 0 0 0 1.53.85L16 13.2V18a1 1 0 0 0 2 0V6a1 1 0 0 0-2 0v4.8L6.53 4.65A1 1 0 0 0 5 5.5z"/></svg>',
    ecra: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    som: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>',
    fechar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',
    coracao: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.6-10-9.3C.3 8.4 2.2 4.5 6 4.5c2.2 0 3.6 1.2 4.4 2.4L12 9l1.6-2.1c.8-1.2 2.2-2.4 4.4-2.4 3.8 0 5.7 3.9 4 7.2C19.5 16.4 12 21 12 21z"/></svg>'
  };
  Player.icones = I;

  /* ---------- estado ---------- */
  var E = {
    aberto: false, pausado: false, aCarregar: false,
    ep: null, modo: 'episodio', cenas: [], i: -1, t: 0, dur: 0,
    ativa: 0, limparEm: null, velha: null, nav: 0,
    falaIdx: 0, falasFeitas: true, aFalar: false, falaFimEm: null, proximaFalaEm: null, falaToken: 0,
    abafos: {}, wake: null, esconderTimer: 0, ultimo: 0, ultimaBarra: 0,
    opcoes: { musica: true, voz: true, legendas: true },
    fimEstado: null
  };
  var R = {}; // referências ao DOM

  /* =================================================================
     NARRADOR (voz do próprio aparelho)
     ================================================================= */
  var Narrador = {
    voz: null, disponivel: false, _u: null,
    iniciar: function () {
      if (!('speechSynthesis' in window)) return;
      var self = this;
      var escolher = function () { self.escolher(); if (R.bVoz) atualizarBotoes(); };
      escolher();
      try { speechSynthesis.addEventListener('voiceschanged', escolher); }
      catch (e) { speechSynthesis.onvoiceschanged = escolher; }
    },
    escolher: function () {
      var vozes = [];
      try { vozes = speechSynthesis.getVoices() || []; } catch (e) { vozes = []; }
      var pref = String((cfg.narrador && cfg.narrador.idioma) || 'pt-PT').toLowerCase();
      var pt = vozes.filter(function (v) { return v.lang && v.lang.toLowerCase().replace('_', '-').indexOf('pt') === 0; });
      if (!pt.length) { this.voz = null; this.disponivel = false; return; }
      var pontos = function (v) {
        var s = 0, l = v.lang.toLowerCase().replace('_', '-');
        if (l === pref) s += 10; else if (l.slice(0, 2) === pref.slice(0, 2)) s += 3;
        if (/natural|premium|enhanced|neural|online/i.test(v.name)) s += 4;
        if (/google/i.test(v.name)) s += 2;
        return s;
      };
      pt.sort(function (a, b) { return pontos(b) - pontos(a); });
      this.voz = pt[0]; this.disponivel = true;
    },
    desbloquear: function () {
      if (!this.disponivel) return;
      try { var u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } catch (e) { /* ok */ }
    },
    falar: function (texto, fim) {
      if (!this.disponivel) { fim(); return; }
      var feito = false, timer = 0;
      var acabar = function () { if (feito) return; feito = true; clearTimeout(timer); fim(); };
      var limpo = String(texto).replace(/[«»"“”]/g, '').replace(/…/g, '... ').trim();
      if (!limpo) { fim(); return; }
      var u = new SpeechSynthesisUtterance(limpo);
      u.voice = this.voz; u.lang = this.voz.lang;
      u.rate = (cfg.narrador && cfg.narrador.velocidade) || 0.92;
      u.pitch = (cfg.narrador && cfg.narrador.tom) || 1;
      u.onend = acabar; u.onerror = acabar;
      this._u = u;
      var falarAgora = function () { try { speechSynthesis.speak(u); } catch (e) { acabar(); } };
      try {
        if (speechSynthesis.speaking || speechSynthesis.pending) { speechSynthesis.cancel(); setTimeout(falarAgora, 80); }
        else falarAgora();
      } catch (e) { acabar(); return; }
      timer = setTimeout(acabar, 3000 + limpo.length * 130);
    },
    parar: function () { try { speechSynthesis.cancel(); } catch (e) { /* ok */ } }
  };

  /* =================================================================
     MÚSICA (mp3 ou gerada)
     ================================================================= */
  /* "musica/x.mp3#t=45" → toca x.mp3 a partir dos 0:45 (e recomeça aí quando acaba) */
  function partirInicio(src) {
    var m = /^(.*?)#t=([\d.]+)$/.exec(String(src));
    return m ? { base: m[1], inicio: +m[2] } : { base: String(src), inicio: 0 };
  }

  var Musica = {
    el: null, ctl: null, src: null, ficheiro: null, inicio: 0, pendenteInicio: null, modo: null, falhou: {},
    iniciar: function () {
      this.el = new Audio();
      this.el.loop = false; this.el.preload = 'auto';
      this.el.setAttribute('playsinline', '');
      this.ctl = Som.controloVolume(this.el);
      var self = this;
      this.el.addEventListener('error', function () {
        if (self.modo === 'ficheiro' && self.src) { self.falhou[self.src] = true; self.gerada(); }
      });
      this.el.addEventListener('loadedmetadata', function () {
        if (self.pendenteInicio) { try { self.el.currentTime = self.pendenteInicio; } catch (e) { /* ok */ } }
        self.pendenteInicio = null;
      });
      // no fim da música, volta à parte escolhida para este episódio, com uma entrada suave
      this.el.addEventListener('ended', function () {
        if (self.modo !== 'ficheiro' || !E.aberto) return;
        try { self.el.currentTime = self.inicio || 0; } catch (e) { /* ok */ }
        self.ctl.definir(0, 0);
        self.reproduzirEl();
        self.aplicar(3);
      });
    },
    base: function () { var v = cfg.musica && cfg.musica.volume; return v == null ? 0.7 : v; },
    fator: function () {
      var f = 1; for (var k in E.abafos) if (E.abafos[k] != null) f = Math.min(f, E.abafos[k]);
      return f;
    },
    alvo: function () { return E.opcoes.musica ? this.base() * this.fator() : 0; },
    tocar: function (src) {
      if (!E.opcoes.musica) return;
      if (!src || this.falhou[src]) { this.gerada(); return; }
      if (this.modo === 'ficheiro' && this.src === src) {
        if (this.el.paused) this.reproduzirEl();
        this.aplicar(1.5); return;
      }
      Som.musicaGerada.parar(1);
      var p = partirInicio(src);
      var mesmoFicheiro = this.modo === 'ficheiro' && this.ficheiro === p.base && this.el.readyState >= 1;
      this.modo = 'ficheiro'; this.src = src; this.ficheiro = p.base; this.inicio = p.inicio;
      this.ctl.definir(0, 0);
      if (mesmoFicheiro) {
        try { this.el.currentTime = p.inicio; } catch (e) { /* ok */ }
      } else {
        this.pendenteInicio = p.inicio || null;
        this.el.src = p.base;
      }
      this.reproduzirEl();
      this.aplicar(2.5);
    },
    reproduzirEl: function () {
      var p = this.el.play();
      if (p && p.catch) p.catch(function (e) { if (e && e.name === 'NotAllowedError') mostrarBotaoSom(); });
    },
    gerada: function () {
      try { this.el.pause(); } catch (e) { /* ok */ }
      this.src = null;
      if (cfg.musica && cfg.musica.gerarSeFaltar === false) { this.modo = null; return; }
      this.modo = 'gerada';
      Som.musicaGerada.iniciar(this.alvo() * 0.85);
    },
    aplicar: function (tempo) {
      var v = this.alvo();
      if (this.modo === 'ficheiro') this.ctl.definir(v, tempo == null ? 0.6 : tempo);
      else if (this.modo === 'gerada') Som.musicaGerada.volume(v * 0.85, tempo == null ? 0.6 : tempo);
    },
    pausar: function () {
      if (this.modo === 'ficheiro') {
        this.ctl.definir(0, 0.35);
        var el = this.el; setTimeout(function () { if (E.pausado || !E.aberto) el.pause(); }, 380);
      } else if (this.modo === 'gerada') Som.musicaGerada.parar(0.5);
    },
    retomar: function () {
      if (!E.opcoes.musica) return;
      if (this.modo === 'ficheiro') { this.reproduzirEl(); this.aplicar(0.8); }
      else if (this.modo === 'gerada') Som.musicaGerada.iniciar(this.alvo() * 0.85);
    },
    parar: function (fade) {
      fade = fade == null ? 1.2 : fade;
      if (this.modo === 'ficheiro') {
        this.ctl.definir(0, fade);
        var el = this.el; setTimeout(function () { if (!E.aberto) el.pause(); }, fade * 1000 + 60);
      } else if (this.modo === 'gerada') Som.musicaGerada.parar(fade);
      this.modo = null; this.src = null;
    }
  };

  function abafar(motivo, fator, tempo) {
    E.abafos[motivo] = fator;
    Musica.aplicar(tempo);
  }

  /* =================================================================
     DOM
     ================================================================= */
  function construirDOM() {
    var raiz = R.raiz = $('#player');
    raiz.innerHTML = '';
    R.palco = el('div', 'palco');
    R.camadas = [el('div', 'camada'), el('div', 'camada')];
    R.camadas.forEach(function (c) { R.palco.appendChild(c); });
    R.vazamento = el('div', 'vazamento');
    R.palco.appendChild(R.vazamento);
    R.palco.appendChild(el('div', 'vinheta'));
    R.palco.appendChild(el('div', 'grao'));
    raiz.appendChild(R.palco);

    R.legenda = el('div', 'legenda', '<span></span>');
    R.legendaSpan = R.legenda.firstChild;
    raiz.appendChild(R.legenda);

    R.carregar = el('div', 'pl-carregar', I.coracao);
    raiz.appendChild(R.carregar);

    R.saltar = el('button', 'pl-saltar', 'Saltar introdução');
    R.saltar.type = 'button'; R.saltar.hidden = true;
    raiz.appendChild(R.saltar);

    R.som = el('button', 'pl-som', I.som + '<span>Tocar com som</span>');
    R.som.type = 'button'; R.som.hidden = true;
    raiz.appendChild(R.som);

    var ctr = R.controlos = el('div', 'pl-controlos');
    ctr.innerHTML =
      '<div class="pl-topo">' +
        '<button class="pl-btn pl-voltar" type="button" aria-label="Voltar">' + I.voltar + '</button>' +
        '<div class="pl-titulo"><span class="pl-serie"></span><span class="pl-ep"></span></div>' +
        '<button class="pl-btn pl-ecra" type="button" aria-label="Ecrã inteiro">' + I.ecra + '</button>' +
      '</div>' +
      '<div class="pl-centro">' +
        '<button class="pl-btn pl-ant" type="button" aria-label="Cena anterior">' + I.ant + '</button>' +
        '<button class="pl-btn pl-play" type="button" aria-label="Pausar">' + I.pausa + '</button>' +
        '<button class="pl-btn pl-seg" type="button" aria-label="Cena seguinte">' + I.seg + '</button>' +
      '</div>' +
      '<div class="pl-baixo">' +
        '<div class="pl-linha-barra">' +
          '<div class="pl-barra" role="slider" aria-label="Progresso do episódio" tabindex="0"><div class="pl-barra-fundo"><div class="pl-barra-cheia"></div></div><div class="pl-bolinha"></div></div>' +
          '<span class="pl-tempo">0:00</span>' +
        '</div>' +
        '<div class="pl-botoes">' +
          '<button class="pl-btn pl-b-musica" type="button" aria-pressed="true">' + I.musica + '<span>Música</span></button>' +
          '<button class="pl-btn pl-b-voz" type="button" aria-pressed="true">' + I.narrador + '<span>Narrador</span></button>' +
          '<button class="pl-btn pl-b-legendas" type="button" aria-pressed="true">' + I.legendas + '<span>Legendas</span></button>' +
          '<span class="espaco"></span>' +
          '<button class="pl-btn pl-b-episodios" type="button">' + I.episodios + '<span>Episódios</span></button>' +
          '<button class="pl-btn pl-b-proximo" type="button">' + I.proximo + '<span>Próximo episódio</span></button>' +
        '</div>' +
      '</div>';
    raiz.appendChild(ctr);

    R.serie = $('.pl-serie', ctr); R.epTitulo = $('.pl-ep', ctr);
    R.play = $('.pl-play', ctr); R.barra = $('.pl-barra', ctr);
    R.cheia = $('.pl-barra-cheia', ctr); R.bolinha = $('.pl-bolinha', ctr); R.tempo = $('.pl-tempo', ctr);
    R.bMusica = $('.pl-b-musica', ctr); R.bVoz = $('.pl-b-voz', ctr); R.bLegendas = $('.pl-b-legendas', ctr);
    R.bEpisodios = $('.pl-b-episodios', ctr); R.bProximo = $('.pl-b-proximo', ctr); R.bEcra = $('.pl-ecra', ctr);

    R.painel = el('aside', 'pl-painel'); R.painel.hidden = true;
    raiz.appendChild(R.painel);
    R.proximo = el('div', 'pl-proximo'); R.proximo.hidden = true;
    raiz.appendChild(R.proximo);

    // vídeos reutilizáveis (desbloqueados no primeiro toque — necessário no iPhone)
    R.reserva = el('div'); R.reserva.style.display = 'none'; raiz.appendChild(R.reserva);
    R.videos = [0, 1].map(function () {
      var v = document.createElement('video');
      v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', '');
      v.preload = 'auto'; v.playsInline = true;
      R.reserva.appendChild(v);
      return v;
    });
    R.narracao = new Audio(); R.narracao.preload = 'auto';
    R.narracaoCtl = Som.controloVolume(R.narracao);

    if (!(raiz.requestFullscreen || raiz.webkitRequestFullscreen)) R.bEcra.hidden = true;

    ligarEventos();
  }

  function ligarEventos() {
    var raiz = R.raiz;
    $('.pl-voltar', raiz).addEventListener('click', function () { Player.fechar(); });
    R.play.addEventListener('click', function (e) { e.stopPropagation(); alternarPausa(); });
    $('.pl-ant', raiz).addEventListener('click', function (e) { e.stopPropagation(); anterior(); });
    $('.pl-seg', raiz).addEventListener('click', function (e) { e.stopPropagation(); seguinte(); });
    R.saltar.addEventListener('click', function (e) { e.stopPropagation(); seguinte(); });
    R.som.addEventListener('click', function (e) { e.stopPropagation(); desbloquearSom(); });
    R.bEcra.addEventListener('click', function () { alternarEcraInteiro(); });

    R.bMusica.addEventListener('click', function () {
      E.opcoes.musica = !E.opcoes.musica; gravarOpcoes(E.opcoes);
      if (E.opcoes.musica) { if (!Musica.modo) Musica.tocar(fonteMusica()); else Musica.retomar(); }
      else Musica.aplicar(0.5);
      atualizarBotoes();
    });
    R.bVoz.addEventListener('click', function () {
      E.opcoes.voz = !E.opcoes.voz; gravarOpcoes(E.opcoes);
      if (!E.opcoes.voz && E.aFalar) { Narrador.parar(); E.aFalar = false; E.falaToken++; abafar('voz', null); E.falaFimEm = E.t + 1.5; }
      atualizarBotoes();
    });
    R.bLegendas.addEventListener('click', function () {
      E.opcoes.legendas = !E.opcoes.legendas; gravarOpcoes(E.opcoes);
      R.raiz.classList.toggle('sem-legendas', !E.opcoes.legendas);
      atualizarBotoes();
    });
    R.bEpisodios.addEventListener('click', function () { abrirPainel(); });
    R.bProximo.addEventListener('click', function () { var p = app.proximo(E.ep); if (p) Player.reproduzir(p); });

    // barra de progresso
    var arrastar = false;
    var posicionar = function (x, soltar) {
      var r = R.barra.getBoundingClientRect();
      var f = Math.max(0, Math.min(1, (x - r.left) / r.width));
      R.cheia.style.width = (f * 100) + '%'; R.bolinha.style.left = (f * 100) + '%';
      if (soltar) irParaFracao(f);
    };
    R.barra.addEventListener('pointerdown', function (e) { arrastar = true; R.barra.setPointerCapture && R.barra.setPointerCapture(e.pointerId); posicionar(e.clientX); mostrarControlos(); });
    R.barra.addEventListener('pointermove', function (e) { if (arrastar) posicionar(e.clientX); });
    R.barra.addEventListener('pointerup', function (e) { if (arrastar) { arrastar = false; posicionar(e.clientX, true); } });
    R.barra.addEventListener('pointercancel', function () { arrastar = false; });
    R.barra.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); seguinte(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); anterior(); }
    });

    // mostrar / esconder controlos
    R.palco.addEventListener('click', function () {
      if (raiz.classList.contains('controlos-ocultos')) mostrarControlos();
      else if (!E.pausado) esconderControlos();
    });
    raiz.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') mostrarControlos(); });

    document.addEventListener('keydown', function (e) {
      if (!E.aberto) return;
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
      var k = e.key;
      if (k === ' ' || k === 'k' || k === 'K') { e.preventDefault(); alternarPausa(); }
      else if (k === 'ArrowRight' && e.target !== R.barra) { seguinte(); }
      else if (k === 'ArrowLeft' && e.target !== R.barra) { anterior(); }
      else if (k === 'f' || k === 'F') { alternarEcraInteiro(); }
      else if (k === 'm' || k === 'M') { R.bMusica.click(); }
      else if (k === 'Escape') {
        if (!R.painel.hidden) fecharPainel();
        else if (!document.fullscreenElement && !document.webkitFullscreenElement) Player.fechar();
      }
      mostrarControlos();
    });

    document.addEventListener('visibilitychange', function () {
      if (!E.aberto) return;
      if (document.hidden) { if (!E.pausado) { pausar(); mostrarControlos(true); } }
      else {
        var c = Som.contexto(); // reanima o áudio no iPhone
        if (!E.pausado) manterEcra(true);
      }
    });
  }

  /* =================================================================
     CONTROLOS
     ================================================================= */
  function mostrarControlos(fixo) {
    R.raiz.classList.remove('controlos-ocultos');
    clearTimeout(E.esconderTimer);
    if (!fixo && !E.pausado) E.esconderTimer = setTimeout(esconderControlos, 3200);
  }
  function esconderControlos() {
    if (E.pausado || !R.painel.hidden) return;
    R.raiz.classList.add('controlos-ocultos');
  }

  function atualizarBotoes() {
    R.play.innerHTML = E.pausado ? I.play : I.pausa;
    R.play.setAttribute('aria-label', E.pausado ? 'Continuar' : 'Pausar');
    R.bMusica.setAttribute('aria-pressed', String(E.opcoes.musica));
    var temNarracaoGravada = E.ep && E.ep.narracaoAudio;
    R.bVoz.disabled = !Narrador.disponivel || !!temNarracaoGravada || E.modo === 'trailer';
    R.bVoz.title = !Narrador.disponivel ? 'Este aparelho não tem voz em português' : (temNarracaoGravada ? 'Este episódio tem narração gravada' : '');
    R.bVoz.setAttribute('aria-pressed', String(E.opcoes.voz && Narrador.disponivel && !temNarracaoGravada));
    R.bLegendas.setAttribute('aria-pressed', String(E.opcoes.legendas));
    var prox = E.modo === 'episodio' && app.proximo(E.ep);
    R.bProximo.hidden = !prox;
    R.bEpisodios.hidden = E.modo !== 'episodio';
  }

  function alternarPausa() { if (E.pausado) retomar(); else pausar(); }

  function pausar() {
    if (E.pausado) return;
    E.pausado = true;
    R.raiz.classList.add('pausado');
    var c = E.cenas[E.i];
    if (c && c._video) { try { c._video.pause(); } catch (e) { /* ok */ } }
    if (E.aFalar) { Narrador.parar(); E.aFalar = false; E.falaToken++; abafar('voz', null); E.proximaFalaEm = E.t + 0.4; }
    if (!R.narracao.paused) { R.narracao.pause(); E.narracaoPausada = true; }
    Musica.pausar();
    manterEcra(false);
    atualizarBotoes();
    mostrarControlos(true);
  }

  function retomar() {
    if (!E.pausado) return;
    Som.contexto();
    E.pausado = false;
    E.ultimo = performance.now();
    R.raiz.classList.remove('pausado');
    var c = E.cenas[E.i];
    if (c && c._video && !c._terminou) tocarVideo(c);
    if (E.narracaoPausada) { E.narracaoPausada = false; R.narracao.play().catch(function () {}); }
    Musica.retomar();
    manterEcra(true);
    atualizarBotoes();
    mostrarControlos();
  }

  function alternarEcraInteiro() {
    var r = R.raiz;
    var dentro = document.fullscreenElement || document.webkitFullscreenElement;
    try {
      if (dentro) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else (r.requestFullscreen || r.webkitRequestFullscreen).call(r);
    } catch (e) { /* sem suporte */ }
  }

  function manterEcra(ligar) {
    try {
      if (ligar) {
        if ('wakeLock' in navigator && !E.wake) {
          navigator.wakeLock.request('screen').then(function (w) {
            E.wake = w; w.addEventListener('release', function () { E.wake = null; });
          }).catch(function () {});
        }
      } else if (E.wake) { E.wake.release().catch(function () {}); E.wake = null; }
    } catch (e) { /* sem suporte */ }
  }

  function mostrarBotaoSom() { if (R.som) R.som.hidden = false; }
  function desbloquearSom() {
    R.som.hidden = true;
    Som.contexto();
    var c = E.cenas[E.i];
    if (c && c._video) { c._video.muted = false; c._video.play().catch(function () {}); }
    if (Musica.modo === 'ficheiro') Musica.reproduzirEl();
    if (E.ep && E.ep.narracaoAudio && R.narracao.src && R.narracao.paused && E.narracaoIniciada) R.narracao.play().catch(function () {});
  }

  function desbloquearMedia() {
    // Num toque do utilizador: "abençoa" os elementos de vídeo/áudio para poderem tocar com som depois (iPhone).
    if (E.desbloqueado) return;
    E.desbloqueado = true;
    R.videos.concat([R.narracao]).forEach(function (m) {
      try {
        m.muted = false; m.src = 'app/silencio.mp4';
        var p = m.play(); if (p && p.then) p.then(function () { m.pause(); }).catch(function () {});
      } catch (e) { /* ok */ }
    });
    Narrador.desbloquear();
  }

  /* =================================================================
     PAINEL DE EPISÓDIOS
     ================================================================= */
  function abrirPainel() {
    var grupos = app.gruposPainel();
    var h = '<div class="pl-painel-topo"><h3>Episódios</h3><button class="btn-redondo" type="button" aria-label="Fechar">' + I.fechar + '</button></div>';
    grupos.forEach(function (g) {
      h += '<h4>' + esc(g.nome) + '</h4><ul class="ep-lista">';
      g.eps.forEach(function (ep) {
        var capa = app.capa(ep);
        h += '<li class="ep-item sem-num' + (E.ep && ep.chave === E.ep.chave ? ' atual' : '') + '" tabindex="0" data-chave="' + esc(ep.chave) + '">' +
          '<div class="ep-item-img">' + (capa ? '<img src="' + esc(capa) + '" alt="" loading="lazy">' : '<div class="arte arte-' + (hash(ep.chave) % 5) + '"></div>') +
          '<div class="play-sobre">' + I.play + '</div></div>' +
          '<div class="ep-item-nome">' + esc(ep.titulo) + '<small>' + esc(ep.rotulo) + '  ' + esc(app.duracaoTexto(ep)) + '</small></div></li>';
      });
      h += '</ul>';
    });
    R.painel.innerHTML = h;
    R.painel.hidden = false;
    mostrarControlos(true);
    $('.btn-redondo', R.painel).addEventListener('click', fecharPainel);
    Array.prototype.forEach.call(R.painel.querySelectorAll('.ep-item'), function (li) {
      var ir = function () { var ep = app.porChave(li.getAttribute('data-chave')); fecharPainel(); if (ep) Player.reproduzir(ep); };
      li.addEventListener('click', ir);
      li.addEventListener('keydown', function (e) { if (e.key === 'Enter') ir(); });
    });
  }
  function fecharPainel() { R.painel.hidden = true; mostrarControlos(); }

  /* =================================================================
     CENAS
     ================================================================= */
  var TRANSICOES = [
    ['dissolver', 30], ['desfocar', 20], ['luz', 16], ['zoom', 14], ['coracao', 8], ['cortina', 6], ['deslizar', 6]
  ];
  var DURACAO_TRANS = { dissolver: 1.2, desfocar: 1.4, luz: 1.4, zoom: 1.3, coracao: 1.7, cortina: 1.3, deslizar: 1.1 };

  function escolherTransicao(r, anterior) {
    var total = 0; TRANSICOES.forEach(function (t) { total += t[1]; });
    for (var tentativa = 0; tentativa < 4; tentativa++) {
      var x = r() * total, acc = 0;
      for (var i = 0; i < TRANSICOES.length; i++) {
        acc += TRANSICOES[i][1];
        if (x < acc) { if (TRANSICOES[i][0] !== anterior || TRANSICOES[i][0] === 'dissolver') return TRANSICOES[i][0]; break; }
      }
    }
    return 'dissolver';
  }

  function construirCenas(ep) {
    var r = aleatorio(hash(ep.chave || ep.titulo || 'x'));
    var seg = ep.segundosPorFoto || (cfg.player && cfg.player.segundosPorFoto) || 5.5;
    var cenas = [{ tipo: 'titulo', dur: 5.4, transicao: 'dissolver' }];

    if (ep.tipo === 'carta') {
      var fotos = ep.midia.filter(function (m) { return m.t === 'foto'; });
      if (!fotos.length) fotos = app.fotosAleatorias(10);
      cenas.push({ tipo: 'carta', texto: app.fmt(ep.carta || ''), fotos: fotos, transicao: 'dissolver', falas: [] });
    } else {
      var media = ep.midia;
      var inicio = cenas.length;
      if (media.length) {
        media.forEach(function (m) {
          if (m.t === 'video') cenas.push({ tipo: 'video', src: m.f, poster: m.poster, legenda: m.legenda, dur: m.d || 0, falas: [] });
          else cenas.push({ tipo: 'foto', src: m.f, mini: m.mini, legenda: m.legenda, w: m.w, h: m.h, dur: seg, falas: [] });
        });
      } else if (app.modoPrep) {
        var n = Math.max(3, (ep.narracao || []).length);
        for (var k = 0; k < n; k++) cenas.push({ tipo: 'vazio', dur: seg, falas: [] });
      }
      // distribui a narração, de preferência pelas fotos
      var falas = (ep.narracao || []).map(app.fmt).filter(Boolean);
      var alvos = [];
      for (var j = inicio; j < cenas.length; j++) if (cenas[j].tipo !== 'video') alvos.push(j);
      if (!alvos.length) for (var j2 = inicio; j2 < cenas.length; j2++) alvos.push(j2);
      if (alvos.length && falas.length) {
        falas.forEach(function (f, idx) {
          var pos = Math.min(alvos.length - 1, Math.floor(idx * alvos.length / falas.length));
          cenas[alvos[pos]].falas.push(f);
        });
      }
    }
    if (ep.finalTemporada) cenas.push({ tipo: 'creditos', dur: 45, transicao: 'dissolver' });
    cenas.push({ tipo: 'fim', dur: 0, transicao: 'dissolver' });

    // transições e sorte de cada cena
    var ant = null;
    cenas.forEach(function (c, idx) {
      c.sorte = r(); c.sorte2 = r();
      if (!c.transicao) {
        if (idx === 1) c.transicao = 'luz';
        else if (c.tipo === 'video') c.transicao = r() < 0.6 ? 'dissolver' : 'desfocar';
        else c.transicao = escolherTransicao(r, ant);
      }
      ant = c.transicao;
    });
    return cenas;
  }

  function construirTrailer() {
    var r = aleatorio(Date.now());
    var frases = ((cfg.trailer && cfg.trailer.frases) || []).map(app.fmt);
    var fotos = app.fotosAleatorias(16);
    var videos = app.videosAleatorios(2);
    var cenas = [];
    var fi = 0, vi = 0;
    var blocos = Math.max(frases.length, 1);
    var porBloco = Math.max(1, Math.ceil(fotos.length / blocos));
    for (var b = 0; b < blocos; b++) {
      if (frases[b]) cenas.push({ tipo: 'texto', texto: frases[b], dur: 2.9, transicao: 'dissolver', tt: 0.8 });
      for (var k = 0; k < porBloco && fi < fotos.length; k++) {
        var m = fotos[fi++];
        cenas.push({ tipo: 'foto', src: m.f, mini: m.mini, w: m.w, h: m.h, legenda: '', dur: b === blocos - 1 ? 1.9 : 2.5, falas: [], sem: 'polaroid' });
      }
      if (b % 2 === 1 && vi < videos.length) {
        var v = videos[vi++];
        cenas.push({ tipo: 'video', src: v.f, poster: v.poster, dur: 4, maxDur: 4, mudo: true, falas: [] });
      }
    }
    cenas.push({ tipo: 'logo', dur: 5.5, transicao: 'dissolver', tt: 1.2 });
    cenas.push({ tipo: 'fim', dur: 0, transicao: 'dissolver' });
    var rapidas = ['dissolver', 'zoom', 'luz', 'deslizar', 'desfocar', 'dissolver', 'cortina'];
    cenas.forEach(function (c, i) {
      c.sorte = r(); c.sorte2 = r();
      if (!c.transicao) { c.transicao = rapidas[Math.floor(r() * rapidas.length)]; c.tt = 0.75; }
      if (i === 0) c.transicao = 'dissolver';
    });
    return cenas;
  }

  function estimativa(c) {
    if (c.tipo === 'fim') return 0;
    if (c.tipo === 'video') return c.maxDur || c.dur || 12;
    if (c.tipo === 'carta') return c._durEstimada || (String(c.texto).length * 0.06 + 10);
    var base = c.dur || 0;
    if (c.falas && c.falas.length) {
      var soma = 0.9; c.falas.forEach(function (f) { soma += duracaoLeitura(f) + 0.5; });
      base = Math.max(base, soma);
    }
    return base;
  }
  function total() { var s = 0; E.cenas.forEach(function (c) { s += estimativa(c); }); return s; }
  function decorrido() {
    var s = 0;
    for (var k = 0; k < E.i; k++) s += estimativa(E.cenas[k]);
    var c = E.cenas[E.i];
    if (!c) return s;
    if (c.tipo === 'video' && c._video) return s + Math.min(estimativa(c), c._video.currentTime || 0);
    return s + Math.min(estimativa(c), E.t);
  }

  /* ---------- pré-carregamento ---------- */
  function preparar(idx) {
    var c = E.cenas[idx];
    if (c && c.tipo === 'video' && c._pronto && (!c._video || c._video._dono !== c)) c._pronto = null;
    if (!c || c._pronto) return c ? c._pronto : Promise.resolve(false);
    if (c.tipo === 'foto') {
      c._pronto = new Promise(function (ok) {
        var img = new Image();
        img.decoding = 'async';
        img.onload = function () { c._img = img; ok(true); };
        img.onerror = function () { ok(false); };
        img.src = c.src;
      });
    } else if (c.tipo === 'video') {
      var vi = videoLivre();
      if (vi < 0) { E.preCarregarPendente = null; limparVelha(true); vi = videoLivre(); }
      if (vi < 0) vi = 0;
      var v = R.videos[vi];
      v._dono = c;
      c._video = v;
      c._pronto = new Promise(function (ok) {
        var feito = false;
        var acabar = function (r) { if (feito) return; feito = true; v.removeEventListener('loadeddata', sim); v.removeEventListener('error', nao); ok(r); };
        var sim = function () { acabar(true); };
        var nao = function () { acabar(false); };
        v.addEventListener('loadeddata', sim);
        v.addEventListener('error', nao);
        v.muted = !!c.mudo || !(cfg.player && cfg.player.somDosVideos !== false);
        v.loop = false;
        v.poster = c.poster || '';
        v.src = c.src;
        try { v.load(); } catch (e) { /* ok */ }
        if (v.readyState >= 2) acabar(true);
        setTimeout(function () { acabar(v.readyState >= 1); }, 9000);
      });
    } else {
      c._pronto = Promise.resolve(true);
    }
    return c._pronto;
  }
  /* Há dois elementos de vídeo reutilizáveis. Um está "livre" se não está
     visível em nenhuma camada e não foi já reservado para uma cena à frente. */
  function videoLivre() {
    var livres = [];
    R.videos.forEach(function (v, i) {
      var visivel = R.camadas.some(function (cam) { return cam.contains(v); });
      if (!visivel) livres.push(i);
    });
    if (!livres.length) return -1;
    for (var j = 0; j < livres.length; j++) {
      var dono = R.videos[livres[j]]._dono;
      if (!dono || E.cenas.indexOf(dono) <= E.i) return livres[j];
    }
    return livres[0];
  }
  function preCarregar(idx) {
    E.preCarregarPendente = null;
    for (var k = idx; k < Math.min(E.cenas.length, idx + 3); k++) {
      var c = E.cenas[k];
      if (!c) continue;
      if (c.tipo === 'video') {
        // só um vídeo à frente; se os dois elementos estão no ecrã, espera pelo fim da transição
        var jaPronto = c._pronto && c._video && c._video._dono === c;
        if (jaPronto || videoLivre() >= 0) preparar(k);
        else E.preCarregarPendente = k;
        break;
      }
      preparar(k);
    }
  }

  /* ---------- navegação ---------- */
  function irPara(idx, opts) {
    opts = opts || {};
    if (idx < 0 || idx >= E.cenas.length) return;
    var meu = ++E.nav;
    var c = E.cenas[idx];
    E.aCarregar = true;
    var timerCarregar = setTimeout(function () { R.carregar.classList.add('visivel'); }, 450);
    preparar(idx).then(function (ok) {
      clearTimeout(timerCarregar);
      R.carregar.classList.remove('visivel');
      if (meu !== E.nav || !E.aberto) return;
      E.aCarregar = false;
      if (!ok) {
        c._falhou = true;
        var prox = idx + (opts.recuar ? -1 : 1);
        if (prox > 0 && prox < E.cenas.length) irPara(prox, opts);
        return;
      }
      mostrarCena(idx, opts);
    });
  }

  function avancar() {
    if (E.aCarregar) return;
    var c = E.cenas[E.i];
    if (c && c.tipo === 'fim') return;
    irPara(E.i + 1);
  }
  function seguinte() {
    var c = E.cenas[E.i];
    if (c && c.tipo === 'fim') { var p = app.proximo(E.ep); if (p && E.modo === 'episodio') Player.reproduzir(p); return; }
    irPara(Math.min(E.cenas.length - 1, E.i + 1), { rapido: true });
    mostrarControlos();
  }
  function anterior() {
    if (E.t > 2.5 || E.i <= 0) irPara(Math.max(0, E.i), { rapido: true });
    else irPara(E.i - 1, { rapido: true, recuar: true });
    mostrarControlos();
  }
  function irParaFracao(f) {
    var alvo = f * total(), acc = 0;
    for (var k = 0; k < E.cenas.length; k++) {
      var d = estimativa(E.cenas[k]);
      if (acc + d > alvo || k === E.cenas.length - 1) { irPara(k === E.cenas.length - 1 && E.cenas[k].tipo === 'fim' ? Math.max(0, k - 1) : k, { rapido: true }); return; }
      acc += d;
    }
  }

  /* ---------- mostrar ---------- */
  function mostrarCena(idx, opts) {
    opts = opts || {};
    var anteriorCena = E.cenas[E.i];
    // pára o vídeo anterior se não vai continuar a aparecer na transição
    if (anteriorCena && anteriorCena._video && anteriorCena !== E.cenas[idx]) {
      anteriorCena._token = (anteriorCena._token || 0) + 1;
      abafar('video', null, 0.8);
    }
    limparVelha(true);
    esconderLegenda();
    pararFalas();
    R.proximo.hidden = true;
    clearInterval(E.contagemTimer);

    E.i = idx; E.t = 0;
    var c = E.cenas[idx];
    c._terminou = false;
    E.dur = c.dur || 0;
    E.falaIdx = 0;
    E.falasFeitas = !(c.falas && c.falas.length);
    E.proximaFalaEm = E.falasFeitas ? null : 1.0;
    E.falaFimEm = null;

    var nova = R.camadas[1 - E.ativa], velha = R.camadas[E.ativa];
    nova.innerHTML = '';
    var conteudo = renderizar(c);
    nova.appendChild(conteudo);

    var tr = c.transicao || 'dissolver';
    var tt = c.tt || DURACAO_TRANS[tr] || 1.2;
    if (opts.rapido) { tr = 'dissolver'; tt = 0.45; }
    var reduzir = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduzir && tr !== 'dissolver') { tr = 'dissolver'; tt = 0.8; }

    velha.className = 'camada anterior sai-' + tr;
    nova.className = 'camada ativa entra-' + tr;
    nova.style.setProperty('--tt', tt + 's');
    velha.style.setProperty('--tt', tt + 's');
    if (tr === 'luz') { R.vazamento.classList.remove('ativo'); void R.vazamento.offsetWidth; R.vazamento.classList.add('ativo'); }
    E.ativa = 1 - E.ativa;
    E.velha = velha;
    E.limparEm = tt + 0.1;

    aoEntrar(c, conteudo);
    R.saltar.hidden = !(c.tipo === 'titulo' && E.modo === 'episodio');
    R.raiz.classList.toggle('no-fim', c.tipo === 'fim');
    if (E.modo === 'episodio' && app.aoProgresso && c.tipo !== 'fim') app.aoProgresso(E.ep, idx, E.cenas.length);
    preCarregar(idx + 1);
    atualizarBarra(true);
  }

  function limparVelha(forcar) {
    if (E.limparEm == null && !forcar) return;
    var v = E.velha;
    E.limparEm = null;
    if (!v) return;
    var vid = v.querySelector('video');
    if (vid) { try { vid.pause(); } catch (e) { /* ok */ } R.reserva.appendChild(vid); }
    v.className = 'camada';
    v.innerHTML = '';
    E.velha = null;
    var ativa = R.camadas[E.ativa];
    ativa.className = 'camada ativa';
    if (E.preCarregarPendente != null && E.preCarregarPendente > E.i) {
      var k = E.preCarregarPendente; E.preCarregarPendente = null; preparar(k);
    }
  }

  /* ---------- renderização de cada tipo ---------- */
  function renderizar(c) {
    switch (c.tipo) {
      case 'titulo': return renderTitulo();
      case 'foto': return renderFoto(c);
      case 'video': return renderVideo(c);
      case 'texto': var d = el('div', 'cena cena-texto'); var p = el('p'); p.textContent = c.texto; d.style.setProperty('--d', c.dur + 's'); d.appendChild(p); return d;
      case 'logo': return renderLogo();
      case 'carta': return renderCarta(c);
      case 'creditos': return renderCreditos(c);
      case 'vazio': return renderVazio();
      case 'fim': return renderFim();
    }
    return el('div', 'cena');
  }

  function renderTitulo() {
    var ep = E.ep;
    var d = el('div', 'cena cena-titulo');
    var capa = app.capa(ep);
    if (capa) { var f = el('div', 'ct-fundo'); f.style.backgroundImage = 'url("' + capa + '")'; d.appendChild(f); }
    d.appendChild(el('div', 'ct-brilho'));
    var serie = el('p', 'ct-serie'); serie.textContent = app.fmt(cfg.serie.titulo); d.appendChild(serie);
    var num = el('p', 'ct-num'); num.textContent = ep.rotuloLongo; d.appendChild(num);
    var nome = el('h2', 'ct-nome');
    var n = 0;
    app.fmt(ep.titulo).split(/\s+/).forEach(function (palavra, k) {
      if (k > 0) nome.appendChild(document.createTextNode(' '));
      var p = el('span', 'palavra');
      Array.prototype.forEach.call(palavra, function (ch) {
        var s = el('span', 'l'); s.textContent = ch; s.style.setProperty('--i', n++); p.appendChild(s);
      });
      nome.appendChild(p);
    });
    nome.setAttribute('aria-label', ep.titulo);
    d.appendChild(nome);
    if (ep.subtitulo) { var sub = el('p', 'ct-sub'); sub.textContent = app.fmt(ep.subtitulo); d.appendChild(sub); }
    return d;
  }

  function renderFoto(c) {
    var img = c._img;
    var w = (img && img.naturalWidth) || c.w || 4, h = (img && img.naturalHeight) || c.h || 3;
    var ar = w / h, vw = window.innerWidth, vh = window.innerHeight, vr = vw / vh;
    var diff = Math.abs(Math.log(ar / vr));
    var estilo;
    if (diff < 0.2) estilo = 'cheio';
    else if (c.sem !== 'polaroid' && (c.sorte < 0.2 || (c.legenda && c.sorte < 0.55))) estilo = 'polaroid';
    else estilo = 'cinema';
    c._estilo = estilo;

    var d = el('div', 'cena cena-foto estilo-' + estilo);
    var kb = el('div', 'kb');
    var dirX = c.sorte2 < 0.5 ? -1 : 1, dirY = c.sorte < 0.5 ? -1 : 1;
    var dur = estimativa(c) + 2.5;
    kb.style.setProperty('--d', dur + 's');
    if (estilo === 'cheio') {
      var zoomIn = c.sorte2 > 0.35;
      kb.style.setProperty('--s0', zoomIn ? 1.04 : 1.17);
      kb.style.setProperty('--s1', zoomIn ? 1.17 : 1.04);
      kb.style.setProperty('--x0', (dirX * -1.5) + '%'); kb.style.setProperty('--x1', (dirX * 1.5) + '%');
      kb.style.setProperty('--y0', (dirY * -1) + '%'); kb.style.setProperty('--y1', (dirY * 1) + '%');
    } else {
      kb.style.setProperty('--s0', 1); kb.style.setProperty('--s1', 1.07);
      kb.style.setProperty('--x0', '0%'); kb.style.setProperty('--x1', (dirX * 1) + '%');
      kb.style.setProperty('--y0', '0%'); kb.style.setProperty('--y1', (dirY * 0.8) + '%');
    }

    if (estilo !== 'cheio') {
      var fundo = el('div', 'cena-desfoque');
      fundo.style.backgroundImage = 'url("' + (c.mini || c.src) + '")';
      d.appendChild(fundo);
    }

    var foto = el('img', 'cena-img' + (estilo === 'cheio' ? ' cobrir' : ''));
    foto.alt = c.legenda || '';
    foto.src = c.src;
    foto.draggable = false;

    if (estilo === 'polaroid') {
      var arP = Math.max(0.8, Math.min(1.25, ar));
      var maxW = Math.min(vw * 0.82, 560), maxH = vh * 0.76;
      var pw = Math.min(maxW, maxH / (0.215 + 0.91 / arP));
      var fig = el('figure', 'polaroid');
      fig.style.setProperty('--pw', Math.round(pw) + 'px');
      fig.style.setProperty('--ar', arP);
      fig.style.setProperty('--rot', ((c.sorte2 - 0.5) * 6).toFixed(2) + 'deg');
      var moldura = el('div', 'polaroid-moldura');
      foto.className = 'cena-img cobrir';
      kb.appendChild(foto); moldura.appendChild(kb); fig.appendChild(moldura);
      var cap = el('figcaption');
      cap.textContent = c.legenda || '♥';
      fig.appendChild(cap);
      d.appendChild(fig);
    } else {
      kb.appendChild(foto);
      d.appendChild(kb);
      if (c.legenda) { var mao = el('p', 'cena-mao'); mao.textContent = c.legenda; d.appendChild(mao); }
    }
    return d;
  }

  function renderVideo(c) {
    var d = el('div', 'cena cena-video');
    if (c.poster) { var fundo = el('div', 'cena-desfoque'); fundo.style.backgroundImage = 'url("' + c.poster + '")'; d.appendChild(fundo); }
    // fundo "ambiente": as cores do próprio vídeo, desfocadas, à volta dele
    var amb = el('canvas', 'cena-ambiente');
    amb.width = 32; amb.height = 18;
    d.appendChild(amb);
    c._ambiente = amb;
    var v = c._video;
    var vwid = v.videoWidth || 16, vhei = v.videoHeight || 9;
    if (Math.abs(Math.log((vwid / vhei) / (window.innerWidth / window.innerHeight))) < 0.2) d.classList.add('cobrir');
    d.appendChild(v);
    if (c.legenda) { var mao = el('p', 'cena-mao'); mao.textContent = c.legenda; d.appendChild(mao); }
    return d;
  }

  function renderLogo() {
    var d = el('div', 'cena cena-logo');
    d.appendChild(el('div', 'ct-brilho'));
    var t = app.tituloPartes();
    var h = el('h2', 'logo-grande', (t.linha1 ? '<span class="linha1">' + esc(t.linha1) + '</span>' : '') + '<span class="linha2">' + t.linha2Html + '</span>');
    d.appendChild(h);
    var p = el('p', 'logo-disponivel'); p.textContent = app.fmt((cfg.trailer && cfg.trailer.final) || 'Já disponível.');
    d.appendChild(p);
    return d;
  }

  function renderVazio() {
    var d = el('div', 'cena cena-vazia');
    d.innerHTML = '<p>Modo de preparação: esta pasta ainda está vazia.<br>Coloca fotos e vídeos em <code>midia/' + esc(E.ep.pasta) + '/</code></p>';
    return d;
  }

  function renderFim() {
    var d = el('div', 'cena cena-fim');
    var capa = app.capa(E.ep);
    if (capa && E.modo === 'episodio') { var f = el('div', 'ct-fundo'); f.style.backgroundImage = 'url("' + capa + '")'; d.appendChild(f); }
    var p = el('p', 'fim-frase');
    var prox = E.modo === 'episodio' && app.proximo(E.ep);
    p.textContent = E.modo === 'trailer' ? '' : (prox ? 'Continua…' : (E.ep.finalTemporada ? 'Fim da temporada' : 'Fim'));
    d.appendChild(p);
    return d;
  }

  function renderCarta(c) {
    var d = el('div', 'cena cena-carta');
    var fundo = el('div', 'carta-fundo');
    c._fundos = [el('div'), el('div')];
    c._fundos.forEach(function (x) { fundo.appendChild(x); });
    d.appendChild(fundo);
    var centro = el('div', 'carta-centro');
    var papel = el('div', 'carta-papel');
    var texto = el('div', 'carta-texto');
    var cursor = el('span', 'carta-cursor', '♥');
    papel.appendChild(texto); papel.appendChild(cursor);
    centro.appendChild(papel);
    d.appendChild(centro);
    c._papel = papel; c._texto = texto; c._cursor = cursor;
    c._pos = 0; c._acc = 0; c._atraso = 0.6; c._fimEm = null; c._fundoIdx = -1; c._fundoTroca = 0;
    // duração estimada
    var s = 0; for (var k = 0; k < c.texto.length; k++) s += atrasoLetra(c.texto[k]);
    c._durEstimada = s + 8;
    trocarFundoCarta(c);
    return d;
  }
  function atrasoLetra(ch) {
    if (ch === '\n') return 0.32;
    if (ch === '.' || ch === '!' || ch === '?') return 0.5;
    if (ch === ',' || ch === ';' || ch === ':') return 0.26;
    if (ch === ' ') return 0.035;
    return 0.052;
  }
  function trocarFundoCarta(c) {
    if (!c.fotos || !c.fotos.length) return;
    c._fundoIdx = (c._fundoIdx + 1) % c.fotos.length;
    var alvo = c._fundos[c._fundoIdx % 2], outro = c._fundos[(c._fundoIdx + 1) % 2];
    var f = c.fotos[c._fundoIdx];
    alvo.style.backgroundImage = 'url("' + (f.f || f) + '")';
    alvo.classList.remove('visivel'); void alvo.offsetWidth; alvo.classList.add('visivel');
    outro.classList.remove('visivel');
    // pré-carrega a seguinte
    var seguinteFoto = c.fotos[(c._fundoIdx + 1) % c.fotos.length];
    if (seguinteFoto) { var im = new Image(); im.src = seguinteFoto.f || seguinteFoto; }
  }
  function atualizarCarta(c, dt) {
    if (E.t - c._fundoTroca > 8) { c._fundoTroca = E.t; trocarFundoCarta(c); }
    if (c._pos < c.texto.length) {
      c._acc += dt;
      var mudou = false;
      while (c._acc >= c._atraso && c._pos < c.texto.length) {
        c._acc -= c._atraso;
        c._pos++;
        c._atraso = atrasoLetra(c.texto[c._pos - 1]);
        mudou = true;
      }
      if (mudou) {
        c._texto.textContent = c.texto.slice(0, c._pos);
        c._papel.scrollTop = c._papel.scrollHeight;
      }
    } else {
      if (c._fimEm == null) c._fimEm = E.t + 8;
      if (E.t >= c._fimEm) avancar();
    }
  }

  function renderCreditos(c) {
    var d = el('div', 'cena cena-creditos');
    var mos = el('div', 'cred-mosaico');
    app.fotosAleatorias(16).forEach(function (f) { var x = el('div'); x.style.backgroundImage = 'url("' + (f.mini || f.f) + '")'; mos.appendChild(x); });
    d.appendChild(mos);
    var rolo = el('div', 'cred-rolo');
    var t = app.tituloPartes();
    var h = '<h2 class="cred-titulo">' + (t.linha1 ? '<span class="linha1">' + esc(t.linha1) + '</span>' : '') + '<span class="linha2">' + t.linha2Html + '</span></h2>';
    (cfg.creditos || []).forEach(function (b) {
      h += '<div class="cred-bloco"><p class="cred-funcao">' + esc(app.fmt(b.funcao)) + '</p>';
      (b.nomes || []).forEach(function (n) { h += '<p class="cred-nome">' + esc(app.fmt(n)) + '</p>'; });
      h += '</div>';
    });
    if (cfg.notaFinalCreditos) h += '<p class="cred-nota">' + esc(app.fmt(cfg.notaFinalCreditos)) + '</p>';
    h += '<p class="cred-final">' + esc(app.fmt(cfg.proximaTemporada || '')) + '<small>' + esc(app.textoJuntos()) + '</small></p>';
    rolo.innerHTML = h;
    d.appendChild(rolo);
    c._rolo = rolo;
    return d;
  }

  /* ---------- ao entrar numa cena ---------- */
  function aoEntrar(c, conteudo) {
    if (c.tipo === 'video') {
      var v = c._video;
      c._token = (c._token || 0) + 1;
      var meu = c._token;
      v.onended = function () { if (meu === c._token && E.cenas[E.i] === c) { c._terminou = true; abafar('video', null, 1); avancar(); } };
      v.onerror = function () { if (meu === c._token && E.cenas[E.i] === c) avancar(); };
      v.onloadedmetadata = function () { if (v.duration && isFinite(v.duration)) c.dur = v.duration; };
      if (v.duration && isFinite(v.duration)) c.dur = v.duration;
      try { v.currentTime = 0; } catch (e) { /* ok */ }
      if (!E.pausado) tocarVideo(c);
    }
    if (c.tipo === 'creditos') {
      requestAnimationFrame(function () {
        var altura = c._rolo.offsetHeight + window.innerHeight;
        var vel = window.innerWidth < 600 ? 40 : 50;
        c.dur = E.dur = Math.max(20, altura / vel);
        c._rolo.style.setProperty('--d', E.dur + 's');
      });
    }
    if (c.tipo === 'fim') aoFim();

    // narração gravada: começa na primeira cena depois do título
    if (E.modo === 'episodio' && E.ep.narracaoAudio && c.tipo !== 'titulo' && c.tipo !== 'fim' && !E.narracaoIniciada) {
      E.narracaoIniciada = true;
      R.narracao.src = E.ep.narracaoAudio;
      R.narracao.onended = function () { abafar('narracao', null, 1.5); };
      R.narracao.onerror = function () { abafar('narracao', null, 1); };
      R.narracaoCtl.definir(1, 0);
      abafar('narracao', 0.35, 1);
      if (!E.pausado) R.narracao.play().catch(function (e) { if (e && e.name === 'NotAllowedError') mostrarBotaoSom(); });
    }
  }

  function tocarVideo(c) {
    var v = c._video;
    if (!v.muted) abafar('video', Math.min(1, ((cfg.player && cfg.player.volumeMusicaNosVideos) || 0.15) / Musica.base()), 0.8);
    var p = v.play();
    if (p && p.catch) p.catch(function (e) {
      if (e && e.name === 'NotAllowedError') {
        v.muted = true; abafar('video', null, 0.5);
        v.play().catch(function () {});
        mostrarBotaoSom();
      }
    });
  }

  function aoFim() {
    manterEcra(false);
    if (E.modo === 'trailer') { setTimeout(function () { if (E.aberto && E.cenas[E.i] && E.cenas[E.i].tipo === 'fim') Player.fechar(); }, 900); return; }
    if (R.narracao && !R.narracao.paused) { R.narracao.pause(); }
    if (app.aoTerminar) app.aoTerminar(E.ep);
    var prox = app.proximo(E.ep);
    var auto = cfg.player && cfg.player.proximoAutomatico !== false;
    var espera = (cfg.player && cfg.player.segundosAteProximo) || 10;
    var capa = prox ? app.capa(prox) : null;
    var h;
    if (prox) {
      h = '<div class="pl-proximo-img">' + (capa ? '<img src="' + esc(capa) + '" alt="">' : '<div class="arte arte-' + (hash(prox.chave) % 5) + '"></div>') + '</div>' +
        '<div><div class="pl-proximo-rot">Próximo episódio' + (auto ? ' <span class="contagem">em ' + espera + ' s</span>' : '') + '</div>' +
        '<div class="pl-proximo-nome">' + esc(prox.rotulo) + '  ' + esc(app.fmt(prox.titulo)) + '</div></div>' +
        '<div class="pl-proximo-acoes"><button class="btn btn-primario" data-a="seguir" type="button">' + I.play + 'Ver agora</button>' +
        '<button class="btn btn-secundario" data-a="sair" type="button">Voltar ao início</button></div>' +
        (auto ? '<div class="pl-proximo-barra" style="--d:' + espera + 's"></div>' : '');
    } else {
      h = '<div class="pl-proximo-img">' + (app.capa(E.ep) ? '<img src="' + esc(app.capa(E.ep)) + '" alt="">' : '<div class="arte arte-1"></div>') + '</div>' +
        '<div><div class="pl-proximo-rot">' + (E.ep.finalTemporada ? 'Fim da temporada' : 'Terminaste') + '</div>' +
        '<div class="pl-proximo-nome">' + esc(app.fmt(E.ep.titulo)) + '</div></div>' +
        '<div class="pl-proximo-acoes"><button class="btn btn-primario" data-a="sair" type="button">Voltar ao início</button>' +
        '<button class="btn btn-secundario" data-a="repetir" type="button">Ver outra vez</button></div>';
    }
    R.proximo.innerHTML = h;
    R.proximo.hidden = false;
    mostrarControlos(true);
    E.fimEstado = { prox: prox, auto: auto && !!prox, espera: espera, mostrado: 0 };
    Array.prototype.forEach.call(R.proximo.querySelectorAll('[data-a]'), function (b) {
      b.addEventListener('click', function () {
        var a = b.getAttribute('data-a');
        if (a === 'seguir') Player.reproduzir(prox);
        else if (a === 'repetir') Player.reproduzir(E.ep);
        else Player.fechar();
      });
    });
    if (!prox) Musica.parar(6);
  }

  /* ---------- narração (texto + voz) ---------- */
  function vozAtiva() {
    return E.modo === 'episodio' && E.opcoes.voz && Narrador.disponivel && !(E.ep && E.ep.narracaoAudio);
  }
  function iniciarFala() {
    var c = E.cenas[E.i];
    if (!c || !c.falas || E.falaIdx >= c.falas.length) { E.falasFeitas = true; return; }
    var texto = c.falas[E.falaIdx];
    mostrarLegenda(texto);
    if (vozAtiva()) {
      E.aFalar = true;
      var meu = ++E.falaToken;
      abafar('voz', 0.45, 0.5);
      Narrador.falar(texto, function () {
        if (meu !== E.falaToken) return;
        E.aFalar = false;
        abafar('voz', null, 1.2);
        E.falaFimEm = E.t + 0.7;
      });
    } else {
      E.falaFimEm = E.t + duracaoLeitura(texto);
    }
  }
  function gerirFalas() {
    if (E.falasFeitas || E.aFalar) return;
    if (E.proximaFalaEm != null && E.t >= E.proximaFalaEm) { E.proximaFalaEm = null; iniciarFala(); return; }
    if (E.falaFimEm != null && E.t >= E.falaFimEm) {
      E.falaFimEm = null;
      E.falaIdx++;
      var c = E.cenas[E.i];
      if (E.falaIdx < c.falas.length) { esconderLegenda(); E.proximaFalaEm = E.t + 0.55; }
      else E.falasFeitas = true;
    }
  }
  function pararFalas() {
    E.falaToken++;
    if (E.aFalar) { Narrador.parar(); E.aFalar = false; }
    abafar('voz', null, 0.8);
  }
  function mostrarLegenda(t) {
    if (cfg.narrador && cfg.narrador.legendas === false) return;
    R.legendaSpan.textContent = t;
    R.legendaSpan.classList.remove('visivel'); void R.legendaSpan.offsetWidth;
    R.legendaSpan.classList.add('visivel');
  }
  function esconderLegenda() { R.legendaSpan.classList.remove('visivel'); }

  /* ---------- relógio principal ---------- */
  function ciclo(agora) {
    if (!E.aberto) return;
    E.raf = requestAnimationFrame(ciclo);
    var dt = Math.min(0.25, Math.max(0, (agora - E.ultimo) / 1000));
    E.ultimo = agora;
    if (E.pausado || E.aCarregar) return;
    E.t += dt;
    if (E.limparEm != null && E.t >= E.limparEm) limparVelha();
    var c = E.cenas[E.i];
    if (!c) return;
    gerirFalas();

    var narracaoSegura = E.ep && E.ep.narracaoAudio && E.narracaoIniciada && !R.narracao.paused && !R.narracao.ended && proximaEhFim();

    if (c.tipo === 'video') {
      if (c._ambiente && agora - (E.ultimoAmbiente || 0) > 220) {
        E.ultimoAmbiente = agora;
        try { if (c._video.readyState >= 2) c._ambiente.getContext('2d').drawImage(c._video, 0, 0, 32, 18); } catch (e) { c._ambiente = null; }
      }
      if (c.maxDur && E.t >= c.maxDur) avancar();
    } else if (c.tipo === 'carta') {
      atualizarCarta(c, dt);
    } else if (c.tipo === 'fim') {
      if (E.fimEstado && E.fimEstado.auto) {
        var resta = Math.ceil(E.fimEstado.espera - E.t);
        var cont = R.proximo.querySelector('.contagem');
        if (cont && resta >= 0) cont.textContent = 'em ' + resta + ' s';
        if (E.t >= E.fimEstado.espera) { E.fimEstado.auto = false; Player.reproduzir(E.fimEstado.prox); return; }
      }
    } else if (E.t >= E.dur && E.falasFeitas && !narracaoSegura) {
      avancar();
    }
    if (agora - E.ultimaBarra > 200) { E.ultimaBarra = agora; atualizarBarra(); }
  }
  function proximaEhFim() {
    var n = E.cenas[E.i + 1];
    return n && (n.tipo === 'fim' || n.tipo === 'creditos');
  }

  function atualizarBarra(forcar) {
    if (!forcar && R.raiz.classList.contains('controlos-ocultos')) return;
    var tot = total(), dec = decorrido();
    var f = tot ? Math.min(1, dec / tot) : 0;
    R.cheia.style.width = (f * 100) + '%';
    R.bolinha.style.left = (f * 100) + '%';
    R.tempo.textContent = '-' + tempoTexto(tot - dec);
    R.barra.setAttribute('aria-valuenow', Math.round(f * 100));
  }

  /* =================================================================
     API
     ================================================================= */
  Player.configurar = function (config, ponte) {
    cfg = config; app = ponte;
    var o = lerOpcoes();
    E.opcoes.musica = o.musica !== undefined ? o.musica : true;
    E.opcoes.legendas = o.legendas !== undefined ? o.legendas : true;
    E.opcoes.voz = o.voz !== undefined ? o.voz : !(cfg.narrador && cfg.narrador.vozLigada === false);
    E.vozDecidida = o.voz !== undefined;
    construirDOM();
    Musica.iniciar();
    Narrador.iniciar();
  };

  function abrir(modo, ep, cenas, inicio) {
    // chamado dentro do toque: desbloqueia som e vídeo
    Som.contexto(); Som.prepararSessao();
    desbloquearMedia();

    var jaAberto = E.aberto;
    E.nav++;
    if (jaAberto) {
      // limpa o episódio anterior
      var antigo = E.cenas[E.i];
      if (antigo && antigo._video) { antigo._token = (antigo._token || 0) + 1; try { antigo._video.pause(); } catch (e) { /* ok */ } }
      pararFalas();
      try { R.narracao.pause(); } catch (e) { /* ok */ }
    }
    E.modo = modo; E.ep = ep; E.cenas = cenas; E.i = -1; E.t = 0;
    E.abafos = {}; E.narracaoIniciada = false; E.narracaoPausada = false; E.fimEstado = null;
    E.pausado = false; E.aCarregar = false;
    R.raiz.classList.remove('pausado');
    R.raiz.classList.toggle('sem-legendas', !E.opcoes.legendas);
    R.proximo.hidden = true; R.painel.hidden = true; R.som.hidden = true;
    R.camadas.forEach(function (c) {
      var v = c.querySelector('video'); if (v) R.reserva.appendChild(v);
      c.innerHTML = ''; c.className = 'camada';
    });
    E.velha = null; E.limparEm = null;
    R.videos.forEach(function (v) { try { v.pause(); } catch (e) { /* ok */ } });

    R.serie.textContent = app.fmt(cfg.serie.titulo);
    R.epTitulo.textContent = modo === 'trailer' ? 'Trailer' : (ep.rotulo + '  ' + app.fmt(ep.titulo));

    if (!jaAberto) {
      R.raiz.hidden = false;
      document.body.classList.add('travado');
      E.aberto = true;
      E.ultimo = performance.now();
      E.raf = requestAnimationFrame(ciclo);
      Historia.entrar(function () { Player.fechar(true); });
    }
    manterEcra(true);
    atualizarBotoes();
    // começa limpo: um toque no ecrã mostra os controlos
    clearTimeout(E.esconderTimer);
    R.raiz.classList.add('controlos-ocultos');
    Musica.tocar(fonteMusica());
    irPara(inicio || 0, inicio ? { rapido: true } : {});
  }

  function fonteMusica() {
    return app.musicaDe(E.modo === 'episodio' ? E.ep : null);
  }

  Player.reproduzir = function (ep, opts) {
    opts = opts || {};
    var cenas = construirCenas(ep);
    var inicio = 0;
    if (opts.cena && opts.cena > 0 && opts.cena < cenas.length - 1) inicio = opts.cena;
    abrir('episodio', ep, cenas, inicio);
  };

  Player.trailer = function () {
    abrir('trailer', { chave: 'trailer', titulo: 'Trailer', rotulo: '', rotuloLongo: '', midia: [] }, construirTrailer(), 0);
  };

  Player.fechar = function (pelaHistoria) {
    if (!E.aberto) return;
    E.aberto = false;
    if (pelaHistoria !== true) Historia.sair();
    E.nav++;
    cancelAnimationFrame(E.raf);
    pararFalas();
    var c = E.cenas[E.i];
    if (c && c._video) { c._token = (c._token || 0) + 1; }
    R.videos.forEach(function (v) { try { v.pause(); } catch (e) { /* ok */ } });
    try { R.narracao.pause(); } catch (e) { /* ok */ }
    Musica.parar(0.9);
    manterEcra(false);
    clearTimeout(E.esconderTimer);
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      try { (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch (e) { /* ok */ }
    }
    R.camadas.forEach(function (cam) {
      var v = cam.querySelector('video'); if (v) R.reserva.appendChild(v);
      cam.innerHTML = ''; cam.className = 'camada';
    });
    esconderLegenda();
    R.raiz.hidden = true;
    document.body.classList.remove('travado');
    if (app.aoFechar) app.aoFechar(E.modo === 'episodio' ? E.ep : null);
  };

  Player.aberto = function () { return E.aberto; };
  Player.estado = E; // para testes
  Player._musica = Musica;

  window.Player = Player;
})();
