/* =====================================================================
   SOM
   - Contexto de áudio partilhado (desbloqueado no primeiro toque)
   - Música de piano gerada no momento, usada quando não há mp3
   - Som da abertura (sinos + batimento de coração)
   - Controlo de volume que também funciona no iPhone
   Não precisas de editar este ficheiro.
   ===================================================================== */
(function () {
  'use strict';

  var Som = {};
  var ctx = null;
  var bufferImpulso = null;

  Som.contexto = function () {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { return null; }
    }
    if (ctx.state === 'suspended' && ctx.resume) { ctx.resume().catch(function () {}); }
    return ctx;
  };

  /* No iPhone, faz o som tocar mesmo com o botão de silêncio ligado
     (como num leitor de vídeo normal). */
  Som.prepararSessao = function () {
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* sem suporte */ }
  };

  function freq(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  function impulso(c) {
    if (bufferImpulso && bufferImpulso.sampleRate === c.sampleRate) return bufferImpulso;
    var dur = 3.4, len = Math.floor(c.sampleRate * dur);
    var buf = c.createBuffer(2, len, c.sampleRate);
    for (var ch = 0; ch < 2; ch++) {
      var d = buf.getChannelData(ch);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    bufferImpulso = buf;
    return buf;
  }

  /* Cadeia de saída: bus → (seco + reverberação) → volume → compressor → colunas */
  function criarCadeia(c, molhadoNivel) {
    var volume = c.createGain(); volume.gain.value = 0;
    var comp = c.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 3;
    comp.attack.value = 0.01; comp.release.value = 0.4;
    volume.connect(comp); comp.connect(c.destination);

    var bus = c.createGain();
    var seco = c.createGain(); seco.gain.value = 0.82;
    var conv = c.createConvolver(); conv.buffer = impulso(c);
    var escuro = c.createBiquadFilter(); escuro.type = 'lowpass'; escuro.frequency.value = 4200;
    var molhado = c.createGain(); molhado.gain.value = molhadoNivel;
    bus.connect(seco); seco.connect(volume);
    bus.connect(escuro); escuro.connect(conv); conv.connect(molhado); molhado.connect(volume);
    return { bus: bus, volume: volume };
  }

  /* Uma nota de "piano" suave */
  function piano(c, destino, t, midi, vel, dur, pan) {
    var f = freq(midi);
    var g = c.createGain();
    var filtro = c.createBiquadFilter(); filtro.type = 'lowpass'; filtro.Q.value = 0.3;
    var brilho = 900 + vel * 2600 + (midi - 50) * 22;
    filtro.frequency.setValueAtTime(brilho, t);
    filtro.frequency.exponentialRampToValueAtTime(Math.max(320, brilho * 0.33), t + 1.5);

    var o1 = c.createOscillator(); o1.type = 'triangle'; o1.frequency.setValueAtTime(f, t);
    var o2 = c.createOscillator(); o2.type = 'sine'; o2.frequency.setValueAtTime(f * 2, t); o2.detune.setValueAtTime(4, t);
    var o3 = c.createOscillator(); o3.type = 'sine'; o3.frequency.setValueAtTime(f, t); o3.detune.setValueAtTime(-6, t);
    var g2 = c.createGain(); g2.gain.value = 0.16;
    var g3 = c.createGain(); g3.gain.value = 0.55;
    o1.connect(filtro); o2.connect(g2); g2.connect(filtro); o3.connect(g3); g3.connect(filtro);
    filtro.connect(g);

    var pico = 0.15 * vel;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(pico, t + 0.008);
    g.gain.exponentialRampToValueAtTime(pico * 0.33, t + 0.45);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    var ultimo = g;
    if (c.createStereoPanner) {
      var p = c.createStereoPanner(); p.pan.value = pan || 0; g.connect(p); ultimo = p;
    }
    ultimo.connect(destino);
    var fim = t + dur + 0.05;
    o1.start(t); o2.start(t); o3.start(t);
    o1.stop(fim); o2.stop(fim); o3.stop(fim);
    o1.onended = function () { try { ultimo.disconnect(); if (ultimo !== g) g.disconnect(); } catch (e) { /* já desligado */ } };
  }

  /* Camada de fundo quente (acordes sustentados) */
  function pad(c, destino, t, notas, dur, nivel) {
    var g = c.createGain();
    var f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 620; f.Q.value = 0.4;
    f.connect(g); g.connect(destino);
    nivel = nivel || 0.02;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(nivel, t + 1.6);
    g.gain.setValueAtTime(nivel, t + Math.max(1.7, dur - 0.2));
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 1.6);
    var oscs = [];
    notas.forEach(function (m) {
      [-7, 7].forEach(function (d) {
        var o = c.createOscillator(); o.type = 'sawtooth';
        o.frequency.value = freq(m); o.detune.value = d;
        o.connect(f); o.start(t); o.stop(t + dur + 1.7); oscs.push(o);
      });
    });
    oscs[0].onended = function () { try { g.disconnect(); } catch (e) { /* ok */ } };
  }

  /* Sino (som da abertura) */
  function sino(c, destino, t, midi, vel) {
    var f = freq(midi);
    [[1, 1], [2.0, 0.32], [3.01, 0.14], [5.4, 0.05]].forEach(function (p) {
      var o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f * p[0];
      var g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.12 * vel * p[1], t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2 / Math.sqrt(p[0]));
      o.connect(g); g.connect(destino);
      o.start(t); o.stop(t + 3.4);
    });
  }

  function batida(c, destino, t, forca) {
    var o = c.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(95, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.16);
    var g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.55 * forca, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    o.connect(g); g.connect(destino);
    o.start(t); o.stop(t + 0.35);
  }

  /* ---------------------------------------------------------------
     Som da abertura — sincronizado com a animação do logótipo
     --------------------------------------------------------------- */
  Som.abertura = function () {
    var c = Som.contexto(); if (!c) return;
    var cadeia = criarCadeia(c, 0.6);
    var t0 = c.currentTime + 0.05;
    cadeia.volume.gain.setValueAtTime(0.9, t0);
    // o "&" desenha-se
    [[74, 0.1], [78, 0.42], [81, 0.74], [86, 1.08]].forEach(function (n, i) {
      sino(c, cadeia.bus, t0 + n[1], n[0], 0.55 + i * 0.1);
    });
    pad(c, cadeia.bus, t0 + 1.0, [62, 66, 69], 2.4, 0.016);
    // coração bate
    batida(c, cadeia.bus, t0 + 2.0, 1);
    batida(c, cadeia.bus, t0 + 2.22, 0.75);
    // acorde que floresce
    [50, 57, 62, 66, 69, 76].forEach(function (m, i) {
      piano(c, cadeia.bus, t0 + 2.02 + i * 0.035, m, 0.75, 4.2, (i - 2.5) * 0.12);
    });
    cadeia.volume.gain.setValueAtTime(0.9, t0 + 3.2);
    cadeia.volume.gain.linearRampToValueAtTime(0.0001, t0 + 6.5);
    setTimeout(function () { try { cadeia.volume.disconnect(); } catch (e) { /* ok */ } }, 7500);
  };

  /* ---------------------------------------------------------------
     Música gerada — balada de piano em Ré maior, ~70 bpm
     --------------------------------------------------------------- */
  var ACORDES = [
    { b: 50, t: [57, 62, 64, 66, 69], p: [62, 66, 69] }, // D(add9)
    { b: 49, t: [57, 61, 64, 69, 71], p: [61, 64, 69] }, // A/C#
    { b: 47, t: [54, 59, 61, 62, 66], p: [59, 62, 66] }, // Bm(add9)
    { b: 43, t: [55, 59, 62, 66, 69], p: [59, 62, 66] }, // Gmaj7
    { b: 52, t: [55, 59, 62, 64, 67], p: [59, 62, 67] }, // Em7
    { b: 54, t: [57, 62, 64, 66, 69], p: [62, 66, 69] }, // D/F#
    { b: 43, t: [55, 59, 62, 66, 69], p: [59, 62, 67] }, // Gmaj7
    { b: 45, t: [57, 61, 64, 69, 71], p: [61, 64, 69] }  // A(add9)
  ];
  var ARPEJOS = [
    ['b', 0, 1, 2, 3, 2, 1, 0],
    ['b', 1, 2, 4, 3, 2, 1, 2]
  ];
  var VELS = [0.82, 0.42, 0.48, 0.55, 0.6, 0.5, 0.44, 0.4];
  var RITMOS = [ // em colcheias; 0 = pausa
    [[2, 1], [2, 1], [4, 1]],
    [[3, 1], [1, 1], [4, 1]],
    [[4, 0], [2, 1], [2, 1]],
    [[6, 1], [2, 1]],
    [[8, 1]],
    [[2, 0], [2, 1], [4, 1]]
  ];

  function aleatorio(semente) {
    var a = semente >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* Compõe uma melodia de 8 compassos que acompanha os acordes */
  function comporMelodia(semente) {
    var r = aleatorio(semente);
    var notas = []; // {passo (colcheia dentro do ciclo), midi, dur}
    var anterior = 74;
    for (var compasso = 0; compasso < 8; compasso++) {
      var acorde = ACORDES[compasso];
      var candidatos = [];
      acorde.t.concat(acorde.p).forEach(function (m) {
        [12, 24].forEach(function (o) { var n = m + o; if (n >= 69 && n <= 83 && candidatos.indexOf(n) < 0) candidatos.push(n); });
      });
      candidatos.sort(function (a, b) { return a - b; });
      var ritmo = RITMOS[Math.floor(r() * RITMOS.length)];
      if (compasso === 7) ritmo = [[2, 1], [6, 1]];
      var pos = 0;
      ritmo.forEach(function (seg, k) {
        if (seg[1]) {
          var alvoSubida = compasso < 4 ? 1 : -1;
          var idx = 0, melhor = 1e9;
          candidatos.forEach(function (n, i) { var d = Math.abs(n - anterior); if (d < melhor) { melhor = d; idx = i; } });
          var salto = Math.round((r() - 0.2 * alvoSubida - 0.5) * 2.4) * -1;
          idx = Math.max(0, Math.min(candidatos.length - 1, idx + salto));
          if (candidatos[idx] === anterior && r() < 0.6) {
            idx = Math.max(0, Math.min(candidatos.length - 1, idx + (idx >= candidatos.length - 1 ? -1 : alvoSubida)));
          }
          var n = candidatos[idx];
          if (compasso === 7 && k === ritmo.length - 1) n = 74; // resolve em Ré
          notas.push({ passo: compasso * 8 + pos, midi: n, dur: seg[0] });
          anterior = n;
        }
        pos += seg[0];
      });
    }
    return notas;
  }

  var Musica = (function () {
    var cadeia = null, timer = null, passo = 0, proxima = 0, ativo = false;
    var melodias = null, token = 0, volumeAlvo = 0.6;
    var BPM = 70, colcheia = 60 / BPM / 2;

    function tocarPasso(c, n, t) {
      var ciclo = Math.floor(n / 64) % 4;
      var dentro = n % 64;
      var compasso = Math.floor(dentro / 8);
      var e = dentro % 8;
      var acorde = ACORDES[compasso];
      var arp = ARPEJOS[ciclo === 2 ? 1 : 0];
      var jit = (Math.random() - 0.5) * 0.02;
      var vel = VELS[e] * (0.94 + Math.random() * 0.12) * (ciclo === 0 && compasso < 2 ? 0.8 : 1);
      var item = arp[e];
      if (item === 'b') {
        piano(c, cadeia.bus, t + jit, acorde.b, vel, 4.8, -0.15);
        piano(c, cadeia.bus, t + jit, acorde.b - 12, vel * 0.35, 4.8, -0.1);
        if (ciclo !== 0 || compasso >= 4) pad(c, cadeia.bus, t, acorde.p, colcheia * 8, ciclo === 2 ? 0.012 : 0.02);
      } else {
        piano(c, cadeia.bus, t + jit, acorde.t[item], vel, 2.8, (item - 2) * 0.14);
      }
      // melodia nos ciclos 1, 2 e 3
      if (ciclo > 0) {
        var mel = melodias[ciclo === 2 ? 1 : 0];
        for (var i = 0; i < mel.length; i++) {
          if (mel[i].passo === dentro) {
            var oitava = ciclo === 3 ? 12 : 0;
            piano(c, cadeia.bus, t + jit * 0.5, mel[i].midi + oitava, ciclo === 3 ? 0.5 : 0.62, 2.4 + mel[i].dur * colcheia, 0.1);
          }
        }
      }
    }

    function agendar() {
      var c = Som.contexto(); if (!c || !ativo) return;
      if (proxima < c.currentTime) proxima = c.currentTime + 0.05;
      while (proxima < c.currentTime + 1.3) {
        tocarPasso(c, passo, proxima);
        passo++; proxima += colcheia;
      }
    }

    function rampa(v, tempo) {
      var c = Som.contexto(); if (!c || !cadeia) return;
      var g = cadeia.volume.gain, agora = c.currentTime;
      g.cancelScheduledValues(agora);
      g.setValueAtTime(Math.max(0.0001, g.value), agora);
      g.linearRampToValueAtTime(Math.max(0.0001, v), agora + Math.max(0.02, tempo));
    }

    return {
      iniciar: function (volume) {
        var c = Som.contexto(); if (!c) return false;
        volumeAlvo = volume == null ? 0.6 : volume;
        token++;
        if (!cadeia) {
          cadeia = criarCadeia(c, 0.48);
          melodias = [comporMelodia(14022025), comporMelodia(7)];
        }
        if (!ativo) {
          ativo = true; passo = 0; proxima = c.currentTime + 0.15;
          agendar();
          timer = setInterval(agendar, 180);
        }
        rampa(volumeAlvo, 2.5);
        return true;
      },
      parar: function (fade) {
        if (!ativo) return;
        fade = fade == null ? 1.5 : fade;
        rampa(0.0001, fade);
        var meu = ++token;
        setTimeout(function () {
          if (meu !== token) return;
          ativo = false; clearInterval(timer); timer = null;
        }, fade * 1000 + 100);
      },
      volume: function (v, tempo) { volumeAlvo = v; if (ativo) rampa(v, tempo == null ? 0.6 : tempo); },
      ativo: function () { return ativo; }
    };
  })();

  Som.musicaGerada = Musica;

  /* ---------------------------------------------------------------
     Volume de elementos <audio>/<video>.
     No iPhone o volume é só de leitura; aí passamos o som pelo
     Web Audio para conseguir baixar a música durante vídeos e voz.
     --------------------------------------------------------------- */
  Som.volumeEditavel = (function () {
    try { var a = document.createElement('audio'); a.volume = 0.5; return Math.abs(a.volume - 0.5) < 0.01; }
    catch (e) { return true; }
  })();

  Som.controloVolume = function (el) {
    var ganho = null, raf = 0;
    function webAudio() {
      if (ganho !== null) return ganho;
      ganho = false;
      if (Som.volumeEditavel || location.protocol === 'file:') return ganho;
      var c = Som.contexto(); if (!c) return ganho;
      try {
        var fonte = c.createMediaElementSource(el);
        var g = c.createGain(); fonte.connect(g); g.connect(c.destination);
        ganho = g;
      } catch (e) { ganho = false; }
      return ganho;
    }
    return {
      definir: function (v, tempo) {
        v = Math.max(0, Math.min(1, v));
        tempo = tempo == null ? 0.5 : tempo;
        var g = webAudio();
        if (g) {
          var c = Som.contexto(), agora = c.currentTime;
          g.gain.cancelScheduledValues(agora);
          g.gain.setValueAtTime(g.gain.value, agora);
          g.gain.linearRampToValueAtTime(v, agora + Math.max(0.02, tempo));
          return;
        }
        cancelAnimationFrame(raf);
        var inicio = el.volume, t0 = performance.now(), dur = tempo * 1000;
        if (!dur || document.hidden) { el.volume = v; return; }
        var passo = function (agora) {
          var k = Math.min(1, (agora - t0) / dur);
          try { el.volume = inicio + (v - inicio) * k; } catch (e) { return; }
          if (k < 1) raf = requestAnimationFrame(passo);
        };
        raf = requestAnimationFrame(passo);
      }
    };
  };

  window.Som = Som;
})();
