/* =====================================================================
   A HISTÓRIA DE M&E  —  FICHEIRO DE CONFIGURAÇÃO
   ---------------------------------------------------------------------
   Este é o ÚNICO ficheiro que precisas de editar à mão.
   Abre-o com o Bloco de Notas, VS Code ou outro editor de texto.

   Regras simples para não dar erro:
     • O texto fica sempre entre aspas:  "assim"
     • Cada linha de uma lista termina com vírgula ,
     • Se quiseres usar aspas dentro de um texto, usa ’ ou « »
     • Podes usar estas etiquetas em qualquer texto:
         {ele}   → o teu nome
         {ela}   → o nome dela
         {dias}  → número de dias que estão juntos (atualiza sozinho)
         {meses} → número de meses que estão juntos
         {serie} → o título da série

   Se depois de editares a página ficar em branco ou com uma mensagem
   de erro, é quase sempre uma vírgula ou aspa em falta. A própria
   página diz-te em que linha está o problema.
   ===================================================================== */

window.CONFIG = {

  /* ---------------------------------------------------------------
     1. OS PROTAGONISTAS
     --------------------------------------------------------------- */
  nomes: {
    ele: "Muhammad",   // ← o teu nome
    ela: "Esther",     // ← o nome dela
  },

  /* Data em que começaram a namorar, no formato ANO-MÊS-DIA.
     Usada no contador "Juntos há…" e nos mesversários. */
  inicioNamoro: "2026-06-24",

  /* ---------------------------------------------------------------
     2. A SÉRIE
     --------------------------------------------------------------- */
  serie: {
    titulo: "A História de M&E",
    marca: "M&E",                       // logótipo no canto do ecrã
    ano: "2026",
    sinopse: "No dia 24 de junho de 2026, duas vidas decidiram caminhar juntas. Desde então, cada dia virou um episódio: selfies ao espelho, boleias que nunca acabam, cozinhados a dois e um amor que cresce a cada temporada.",
    generos: ["Romance", "Comédia romântica", "Drama (só às vezes)"],
    estaSerieE: ["Apaixonante", "Divertida", "Para sempre"],
    classificacao: "Todo o amor",
    avisoClassificacao: "Contém cenas de muito amor, abraços apertados e gargalhadas sem motivo.",
  },

  /* ---------------------------------------------------------------
     3. ENTRADA
     --------------------------------------------------------------- */
  abertura: {
    frase: "Uma série nova, feita só para ti.",
    botao: "Abrir",
  },

  /* Pergunta-senha romântica antes de entrar (opcional).
     Para ligar, muda  ativa: false  para  ativa: true.
     Só os números contam: "24/06/2026", "24-06-2026" e "24062026" são iguais
     (e também "24/6/2026").
     ATENÇÃO: isto é um charme, não é segurança a sério (ver COMO-USAR.md). */
  senha: {
    ativa: false,
    pergunta: "Em que dia começou a nossa história?",
    resposta: "24/06/2026",
    dica: "dia/mês/ano",
    erro: "Quase… tenta outra vez, meu amor.",
  },

  /* Perfis do ecrã "Quem está a ver?".
     As fotos ficam em  midia/perfil/  (ela.jpg, ele.jpg, nos.jpg).
     Se a foto não existir, aparece a inicial do nome. */
  perfis: [
    { id: "ela", nome: "{ela}", foto: "midia/perfil/ela.jpg", boasVindas: "Olá, meu amor. Preparei isto só para ti." },
    { id: "ele", nome: "{ele}", foto: "midia/perfil/ele.jpg", boasVindas: "Bem-vindo de volta, realizador." },
    { id: "nos", nome: "Nós",   foto: "midia/perfil/nos.jpg", boasVindas: "{dias} dias de nós. E a contar." },
  ],

  /* PIN dos perfis, como o controlo parental das plataformas de streaming.
     Ao tocar num perfil, pede o PIN antes de entrar.
       ativo:   true liga, false desliga
       pin:     só números (o mesmo para todos os perfis)
       lembrar: false → pede o PIN sempre que o site é aberto
                true  → depois de acertar uma vez, esse celular não volta a pedir
     Para um perfil ter outro PIN (ou nenhum), acrescenta-lhe  pin: "54321"
     ou  pin: ""  na lista de perfis acima.
     ATENÇÃO: afasta curiosos, mas não é segurança a sério (ver COMO-USAR.md). */
  bloqueioPerfis: {
    ativo: true,
    pin: "12345",
    lembrar: false,
  },

  /* ---------------------------------------------------------------
     4. MÚSICA E NARRADOR
     --------------------------------------------------------------- */
  musica: {
    /* As vossas músicas: coloca os mp3 na pasta  musica/ .
         • "Those Eyes" (New West)          → um nome com "those eyes", ex.: musica/those-eyes.mp3
         • "I Wanna Be Yours" (Arctic Monkeys) → um nome com "i wanna be yours", ex.: musica/i-wanna-be-yours.mp3
       Os episódios escolhem a música no campo  musica:  de cada um (mais abaixo).
       Basta o nome do ficheiro conter o nome da música: "New West - Those Eyes.mp3" também serve.
       Enquanto o mp3 não estiver lá, esse episódio toca o piano.

       tema: null → os episódios sem música própria tocam o piano suave.
       Para uma música em todos os outros episódios, põe por ex.:  tema: "musica/tema.mp3", */
    tema: null,
    volume: 0.7,                 // 0 a 1
    /* Se o mp3 não existir, a app compõe sozinha uma música suave
       de piano (gerada no próprio celular). */
    gerarSeFaltar: true,
  },

  narrador: {
    /* A voz do narrador lê o texto de cada episódio (usa a voz em
       português do próprio celular). Quem assiste pode desligar no player. */
    vozLigada: true,
    idioma: "pt-PT",             // "pt-PT" (Portugal/Moçambique) ou "pt-BR"
    velocidade: 0.92,            // 0.5 a 1.5
    tom: 1.0,                    // 0.5 a 1.5
    legendas: true,              // mostrar o texto no ecrã
  },

  player: {
    segundosPorFoto: 5.5,        // quanto tempo cada foto fica no ecrã
    somDosVideos: true,          // os vídeos tocam com o som original
    volumeMusicaNosVideos: 0.15, // a música baixa enquanto um vídeo fala
    proximoAutomatico: true,     // passa ao episódio seguinte sozinho
    segundosAteProximo: 10,
  },

  /* ---------------------------------------------------------------
     5. EPISÓDIOS
     ---------------------------------------------------------------
     Cada episódio tem uma pasta dentro de  midia/  com o mesmo nome
     do campo "pasta". Coloca lá as fotos e vídeos desse episódio.

     Campos opcionais de cada episódio:
       musica:        "musica/outra.mp3"   → música só deste episódio
       narracaoAudio: "narracao/ep1.mp3"   → a TUA voz gravada (substitui
                                              a voz do celular)
       segundosPorFoto: 4                   → ritmo diferente neste episódio
       data: "Junho de 2026"                → aparece por baixo do título

     A narração é uma lista de frases; a app distribui-as pelas fotos.
     Para um episódio sem narração, deixa:  narracao: [],
     --------------------------------------------------------------- */
  temporadas: [
    {
      nome: "Temporada 1",
      episodios: [
        {
          pasta: "01-o-dia-em-que-comecou",
          titulo: "O Dia em Que Tudo Começou",
          data: "24 de junho de 2026",
          sinopse: "24 de junho de 2026. Uma selfie meio torta, dois sorrisos e a certeza silenciosa de que alguma coisa tinha acabado de começar.",
          segundosPorFoto: 7,
          musica: "musica/those-eyes.mp3",
          narracao: [
            "Há dias que parecem iguais a todos os outros.",
            "E há o dia 24 de junho de 2026.",
            "Nesse dia, sem grandes discursos, decidimos ser nós.",
            "Ninguém sabia, mas começava ali a melhor história das nossas vidas.",
            "Esta é a nossa série. E este é o primeiro episódio.",
          ],
        },
        {
          pasta: "02-um-dia-so-nosso",
          titulo: "Um Dia Só Nosso",
          data: "3 de julho de 2026",
          sinopse: "Um quarto cheio de luz, beijos ao espelho e uma tarde a rir sem parar. O primeiro de muitos dias só nossos.",
          segundosPorFoto: 4.5,
          musica: "musica/i-wanna-be-yours.mp3",
          narracao: [
            "Nove dias depois, tínhamos um dia inteiro só para nós.",
            "Abraços ao espelho, como se o mundo lá fora tivesse parado.",
            "O primeiro de muitos beijos guardados numa foto.",
            "E aquele teu sorriso, que eu já sabia de cor.",
            "Há dias que ficam para sempre. Este foi um deles.",
          ],
        },
        {
          pasta: "03-nos-ao-espelho",
          titulo: "Nós ao Espelho",
          data: "12 de julho de 2026",
          sinopse: "Um espelho com luz, uma camisola laranja e nove fotos que dizem a mesma coisa: ficamos bem juntos.",
          segundosPorFoto: 4,
          narracao: [
            "Dizem que o espelho não mente.",
            "E ele mostrou a verdade:",
            "nunca fui tão feliz como ao teu lado.",
            "Tu e eu. Sempre melhor a dois.",
          ],
        },
        {
          pasta: "04-so-mais-cinco-minutos",
          titulo: "Só Mais Cinco Minutos",
          data: "23 de julho de 2026",
          sinopse: "Um carro parado, a noite a cair e uma despedida que nunca mais acabava. Ninguém queria ser o primeiro a ir embora.",
          segundosPorFoto: 4.5,
          narracao: [
            "Era só para ser uma boleia.",
            "Mas contigo, cinco minutos nunca são cinco minutos.",
            "Mais um abraço. Mais um beijo. Mais uma foto.",
            "Se dependesse de mim, ainda estávamos lá.",
          ],
        },
        {
          pasta: "05-dois-meses",
          titulo: "Dois Meses de Nós",
          data: "25 de agosto de 2026",
          sinopse: "Dois meses depois, uma cozinha, batatas fritas e a melhor companhia do mundo. Cozinhar a dois sabe sempre melhor.",
          segundosPorFoto: 5,
          narracao: [
            "Dois meses. E parece que te conheço desde sempre.",
            "Uma cozinha, uma panela e nós os dois a fingir que somos chefs.",
            "Nem tudo saiu perfeito…",
            "…mas o melhor ingrediente estava ali, ao meu lado.",
          ],
        },
        {
          pasta: "06-dois-de-setembro",
          titulo: "Sofá, Espelho e Gargalhadas",
          data: "2 de setembro de 2026",
          sinopse: "Uma tarde no sofá a ver filmes e uma noite inteira em frente ao espelho: boleias às costas, caretas, músculos e a sessão de fotos mais divertida de sempre.",
          segundosPorFoto: 4,
          narracao: [
            "Há tardes que não precisam de plano nenhum.",
            "Um sofá, um filme e tu encostada a mim.",
            "Depois veio a noite… e o espelho.",
            "Boleias às costas, caretas e gargalhadas sem fim.",
            "Contigo, até uma foto ao espelho vira uma aventura.",
          ],
        },
        {
          pasta: "07-setembro-a-dois",
          titulo: "Setembro a Dois",
          data: "9 e 17 de setembro de 2026",
          sinopse: "Um almoço que acabou em gargalhadas e um passeio à piscina em que ela nem precisou de andar.",
          segundosPorFoto: 4.5,
          narracao: [
            "Setembro trouxe dias cheios de nós.",
            "Almoços que acabavam sempre em gargalhadas.",
            "Batatas fritas, conversa boa e a melhor companhia.",
            "E se um dia estiveres cansada…",
            "…eu levo-te ao colo. Para onde quiseres.",
          ],
        },
        {
          pasta: "08-para-sempre",
          titulo: "Para Sempre",
          data: "Setembro e outubro de 2026",
          sinopse: "As nossas mãos, uma carta escrita à mão, uma dança na sala e sorrisos que dizem tudo. Há promessas que não precisam de palavras.",
          segundosPorFoto: 5,
          musica: "musica/i-wanna-be-yours.mp3",
          narracao: [
            "Olha para as nossas mãos.",
            "Encaixam como se tivessem sido feitas uma para a outra.",
            "Há palavras que merecem ficar no papel para sempre.",
            "Contigo, até uma sala vazia vira pista de dança.",
            "Já são {dias} dias de nós. E ainda agora começámos.",
            "Ainda temos tantos episódios por gravar.",
            "Mas uma coisa eu sei: quero viver todos eles contigo.",
            "Para sempre, {ela}.",
          ],
        },
        {
          pasta: "09-bilhete-para-dois",
          titulo: "Bilhete Para Dois",
          data: "27 de outubro de 2026",
          sinopse: "Dois bilhetes de comboio, uma estação cheia de gente e uma viagem lado a lado. Qualquer destino serve, desde que seja contigo.",
          segundosPorFoto: 4.5,
          narracao: [
            "Dois bilhetes. Um destino. E tu ao meu lado.",
            "Não importa para onde vai o comboio…",
            "…a melhor parte da viagem é sempre a companhia.",
            "Contigo, até o caminho é o lugar onde quero estar.",
          ],
        },
        {
          pasta: "10-flores-para-ti",
          titulo: "Flores Para Ti",
          data: "28 de outubro de 2026",
          sinopse: "Um ramo de flores maior do que ela, um banco de jardim, anéis nos nossos dedos e um bilhete escrito à mão. O episódio final da temporada.",
          segundosPorFoto: 4,
          musica: "musica/those-eyes.mp3",
          narracao: [
            "Hoje trouxe-te flores.",
            "Mas a mais bonita do jardim continuas a ser tu.",
            "Esse sorriso, esses olhos… é por eles que eu volto sempre.",
            "Olha para as nossas mãos: agora levam a nossa promessa.",
            "E algumas palavras, escritas à mão, só para ti.",
            "Já são {dias} dias de nós. E isto é só o começo.",
            "Fim da primeira temporada. Amo-te, {ela}.",
          ],
        },
        /* Episódio para as fotos novas dos dois (novas/nos/ → ferramentas/adicionar.py).
           Enquanto estiver vazio, fica escondido no link dela. */
        {
          pasta: "11-a-historia-continua",
          titulo: "A História Continua",
          sinopse: "Os capítulos mais recentes. Porque esta série não pára: todos os dias gravamos um episódio novo.",
          segundosPorFoto: 4.5,
          narracao: [
            "E a história continua…",
            "Mais dias, mais sorrisos, mais fotos para guardar.",
            "Cada momento contigo merece um lugar nesta série.",
            "E os melhores episódios ainda estão por vir.",
          ],
        },
      ],
    },

    /* Para o próximo ano, copia este bloco e cria a Temporada 2:
    {
      nome: "Temporada 2",
      episodios: [
        { pasta: "t2-01-novo-capitulo", titulo: "Um Novo Capítulo", sinopse: "…", narracao: ["…"] },
      ],
    },
    */
  ],

  /* ---------------------------------------------------------------
     6. ESPECIAIS
     tipo: "carta" → um episódio em que uma carta se escreve sozinha
     no ecrã, com as fotos da pasta a passar devagar ao fundo.
     --------------------------------------------------------------- */
  especiais: [
    {
      pasta: "especial-ela",
      titulo: "ELA",
      subtitulo: "A Mulher da Minha Vida",
      sinopse: "Um episódio inteiro só sobre ela. Porque há pessoas que merecem uma série só para si.",
      segundosPorFoto: 4,
      musica: "musica/those-eyes.mp3",
      narracao: [
        "Este episódio é só sobre ela.",
        "Sobre o sorriso que me desarma.",
        "Sobre o olhar que me acalma.",
        "Sobre a forma como ela torna tudo mais leve.",
        "Senhoras e senhores… {ela}. A mulher da minha vida.",
      ],
    },
    {
      pasta: "especial-eu",
      titulo: "Simplesmente Eu",
      subtitulo: "",
      sinopse: "O outro protagonista desta história. Sem filtros e sem guião: simplesmente eu.",
      segundosPorFoto: 4,
      narracao: [
        "E este… sou eu.",
        "Não sou perfeito, mas sou teu.",
        "O rapaz que sorri sempre que o teu nome aparece no ecrã.",
        "Simplesmente eu. Simplesmente teu.",
      ],
    },
    {
      pasta: "especial-cenas-cortadas",
      titulo: "Cenas Cortadas",
      subtitulo: "Os bastidores",
      sinopse: "Máscaras de beleza, caretas e momentos que não eram para ninguém ver. Os nossos favoritos.",
      segundosPorFoto: 3.5,
      narracao: [
        "Nem tudo saiu perfeito…",
        "…e ainda bem.",
        "Foi aqui que mais nos rimos.",
      ],
    },
    {
      pasta: "especial-carta",
      tipo: "carta",
      titulo: "Carta Para Ti",
      subtitulo: "",
      sinopse: "Há coisas que não cabem numa fotografia. Esta carta é uma delas.",
      musica: "musica/i-wanna-be-yours.mp3",
      /* Escreve aqui a tua carta. Cada linha em branco é um novo parágrafo.
         Usa as crases ` no início e no fim (já estão lá). */
      carta: `Meu amor,

Se estás a ler isto, é porque chegaste ao episódio mais importante desta série.

Desde aquele 24 de junho, a minha vida ficou mais bonita. Fiz tudo isto para que nunca te esqueças de como começámos, de tudo o que já vivemos e de tudo o que ainda vamos viver.

Obrigado por cada sorriso, por cada abraço e por cada dia em que escolhes ficar.

Já são {dias} dias ao teu lado, e eu escolhia-te outra vez em todos eles.

Esta série não tem último episódio. Só tem próxima temporada.

Amo-te. Hoje e sempre.

{ele}`,
    },
  ],

  /* ---------------------------------------------------------------
     7. TOP 10 RAZÕES POR QUE TE AMO
     Aparecem na página inicial com números grandes, como um Top 10.
     Podes pôr uma foto em cada:  { texto: "…", foto: "midia/especial-ela/foto.jpg" }
     Sem foto, a app escolhe uma das fotos dela.
     --------------------------------------------------------------- */
  razoes: [
    "O teu sorriso, que muda o meu dia inteiro.",
    "A forma como me olhas quando achas que não estou a ver.",
    "O teu abraço, que é o meu lugar preferido.",
    "Acreditas em mim, mesmo quando eu duvido.",
    "A tua gargalhada, sobretudo quando te ris das minhas piadas sem graça.",
    "És linda por dentro e por fora.",
    "A tua força e a tua coragem.",
    "Contigo posso ser simplesmente eu.",
    "A paciência infinita que tens comigo.",
    "Porque és tu. E vai ser sempre tu.",
  ],

  /* ---------------------------------------------------------------
     8. TRAILER (botão "Trailer" no topo)
     --------------------------------------------------------------- */
  trailer: {
    musica: "musica/i-wanna-be-yours.mp3",   // se o mp3 não existir, toca o piano
    frases: [
      "Era uma vez duas pessoas…",
      "…que no dia 24 de junho de 2026 decidiram ser «nós».",
      "Uma história de risos…",
      "…de abraços apertados…",
      "…e de muito amor.",
    ],
    final: "Já disponível. Só para ti.",
  },

  /* ---------------------------------------------------------------
     9. CRÉDITOS (passam no fim do último episódio da temporada)
     --------------------------------------------------------------- */
  creditos: [
    { funcao: "Uma série de",               nomes: ["{ele}"] },
    { funcao: "Protagonista",               nomes: ["{ela}"] },
    { funcao: "Coprotagonista",             nomes: ["{ele}"] },
    { funcao: "Realização e montagem",      nomes: ["{ele}"] },
    { funcao: "Direção de fotografia",      nomes: ["As câmaras dos nossos celulares"] },
    { funcao: "Banda sonora",               nomes: ["O som da tua gargalhada"] },
    { funcao: "Locais de filmagem",         nomes: ["Todos os lugares onde estivemos juntos"] },
    { funcao: "Agradecimentos especiais",   nomes: ["Ao acaso que nos juntou", "A cada pessoa que torceu por nós"] },
  ],
  notaFinalCreditos: "Nenhum coração foi magoado durante as filmagens.",
  proximaTemporada: "Temporada 2 em produção. Estreia todos os dias, ao teu lado.",

  /* ---------------------------------------------------------------
     10. MODO DE PREPARAÇÃO
     "auto" → quando abres a app no teu computador, vês todos os
     episódios (mesmo os vazios) e avisos para te ajudar.
     No GitHub (o link que vais mandar), os episódios sem fotos ficam
     escondidos automaticamente e os avisos desaparecem.
     --------------------------------------------------------------- */
  modoPreparacao: "auto",
};
