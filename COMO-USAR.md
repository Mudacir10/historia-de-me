# A História de M&E — como usar

Uma app ao estilo das plataformas de streaming, onde a vossa história passa como uma série: episódios com fotos e vídeos em movimento, transições, música, narrador, legendas, trailer, créditos finais e uma carta que se escreve sozinha no ecrã.

Funciona no celular dela (Android ou iPhone) e no computador. Não precisa de instalar nada.

---

## Em 5 passos

1. **Personaliza** o ficheiro `config.js` (nomes, data, textos, carta).
2. **Coloca as fotos e vídeos** nas pastas dentro de `midia/`.
3. **Atualiza a lista de fotos** com o `ferramentas/organizador.html`.
4. **Vê no computador**: abre o `index.html` com duplo clique.
5. **Publica no GitHub** e envia-lhe o link.

---

## 1. Personalizar o `config.js`

Abre o `config.js` com o Bloco de Notas (ou VS Code). Está todo comentado. O mais importante:

| O quê | Onde no ficheiro | Exemplo |
|---|---|---|
| Os vossos nomes | `nomes: { ele: "M", ela: "E" }` | `ele: "Mário", ela: "Elisa"` |
| Data em que começaram | `inicioNamoro` | `"2025-02-14"` (ano-mês-dia) |
| Título da série | `serie.titulo` e `serie.marca` | `"A História de M&E"` |
| A tua carta | especial `Carta Para Ti`, campo `carta` | escreve com as tuas palavras |
| As 10 razões | `razoes` | uma frase por linha |
| O texto do narrador | `narracao` dentro de cada episódio | uma frase por linha |

Etiquetas que podes usar em qualquer texto: `{ele}`, `{ela}`, `{dias}` (dias juntos, atualiza sozinho), `{meses}`, `{serie}`.

**Se a página ficar com uma mensagem de erro** depois de editares, falta uma vírgula, aspa ou chaveta. A página diz-te o que procurar.

---

## 2. Onde colocar cada foto e vídeo

Cada pasta dentro de `midia/` é um episódio. Basta copiar as fotos e vídeos para lá.

| Pasta | Aparece em | O que colocar |
|---|---|---|
| `midia/capa/` | Banner grande da página inicial | 3 a 8 das fotos mais bonitas, de preferência na horizontal |
| `midia/perfil/` | Ecrã "Quem está a ver?" | `ela.jpg`, `ele.jpg` e `nos.jpg` (fotos quadradas) |
| `midia/01-o-dia-em-que-comecou/` | E1 O Dia em Que Tudo Começou | 24 de junho de 2026 |
| `midia/02-um-dia-so-nosso/` | E2 Um Dia Só Nosso | 3 de julho (fotos ao espelho + vídeo no centro comercial) |
| `midia/03-nos-ao-espelho/` | E3 Nós ao Espelho | 12 de julho |
| `midia/04-so-mais-cinco-minutos/` | E4 Só Mais Cinco Minutos | 23 de julho (no carro) |
| `midia/05-dois-meses/` | E5 Dois Meses de Nós | 25 de agosto (na cozinha) |
| `midia/06-dois-de-setembro/` | E6 Sofá, Espelho e Gargalhadas | 2 de setembro (sofá + noite ao espelho) |
| `midia/07-setembro-a-dois/` | E7 Setembro a Dois | 9 e 17 de setembro (almoço + piscina) |
| `midia/08-para-sempre/` | E8 Para Sempre (final da temporada) | 27 de setembro a 20 de outubro |
| `midia/09-a-historia-continua/` | E9 A História Continua | fotos novas dos dois (via `novas/nos/`); escondido enquanto vazio |
| `midia/especial-ela/` | Especial **ELA — A Mulher da Minha Vida** | **só** fotos e vídeos dela |
| `midia/especial-eu/` | Especial **Simplesmente Eu** | **só** fotos e vídeos teus |
| `midia/especial-cenas-cortadas/` | Especial Cenas Cortadas | fotos desfocadas, caretas, bloopers |
| `midia/especial-carta/` | Especial Carta Para Ti | 5 a 15 fotos que passam devagar atrás da carta |
| `musica/` | Todos os episódios | a vossa música em `.mp3` (qualquer nome serve) |
| `narracao/` | Opcional | a tua voz gravada a ler o texto de um episódio |

### Regras simples

- **Ordem:** as fotos passam por ordem alfabética do nome. As fotos do celular (`IMG_20250214_…`, `IMG-20250214-WA0003…`) já ficam por ordem de data. Para escolher a ordem, renomeia para `01.jpg`, `02.jpg`, `03.mp4`…
- **Legenda escrita à mão sobre a foto:** põe ` - ` no nome. Exemplo: `05 - O nosso primeiro beijo.jpg` mostra "O nosso primeiro beijo" escrito à mão.
- **Miniatura do episódio:** a primeira foto da pasta. Para escolher outra, chama-lhe `capa.jpg` (não aparece no episódio, só na miniatura).
- **Quantas fotos:** cada foto fica 5,5 segundos. 20 a 30 fotos dão um episódio de 2 a 3 minutos. Os vídeos passam inteiros, com o som original (a música baixa sozinha).
- **Formatos aceites:** fotos `.jpg .png .webp .heic`, vídeos `.mp4 .mov .webm`. As fotos `.heic` e os vídeos `.mov` do iPhone são convertidos automaticamente quando publicas no GitHub.
- **Episódio sem fotos:** no link que lhe envias fica escondido sozinho. Não precisas de o apagar.
- **Mais episódios:** copia um bloco de episódio no `config.js`, dá-lhe um nome de pasta novo e cria essa pasta em `midia/`.

### Música e narração

- **Música:** coloca a vossa música em `musica/` (por exemplo `musica/tema.mp3`). Sem nenhuma música, a app compõe sozinha uma melodia suave de piano.
- **Música diferente num episódio:** no `config.js`, dentro desse episódio, acrescenta `musica: "musica/outra.mp3",`
- **Narrador:** por omissão, a voz em português do próprio celular lê as frases de `narracao` (ela pode desligar no player). Funciona melhor em português de Portugal no iPhone e com a voz do Google no Android.
- **A tua voz (o que mais emociona):** grava-te no celular a ler o texto de um episódio, guarda em `narracao/ep1.mp3` e, no `config.js`, dentro desse episódio, acrescenta `narracaoAudio: "narracao/ep1.mp3",`. Nesse episódio a tua voz substitui a do celular.

---

### Acrescentar fotos e vídeos novos (o jeito certo, já comprimidos)

1. Copia as fotos e vídeos, tal como vêm do celular, para:
   - `novas/eu/` → só tu (especial **Simplesmente Eu**)
   - `novas/ela/` → só ela (especial **ELA**)
   - `novas/nos/` → os dois (episódio 9 **A História Continua**)
   - ou `novas/<nome de uma pasta de midia>/`, por exemplo `novas/especial-cenas-cortadas/`
2. Duplo clique em `ferramentas/adicionar-fotos-windows.bat` (Mac/Linux: `adicionar-fotos-mac-linux.command`).
3. Abre o `index.html` para ver e envia para o GitHub (Commit → Push).

A ferramenta reduz as fotos para 1920 px, converte os vídeos para 720p, apaga a localização GPS, numera tudo por ordem de data a seguir às que já existem e atualiza a lista sozinha. Os originais saem da pasta `novas/`, que não vai para o GitHub. Na primeira vez que houver um vídeo, descarrega o ffmpeg (cerca de 30 MB).

A pasta `novas/nao-usadas/` guarda fotos postas de lado (repetidas ou demasiado pessoais para um site público). A ferramenta ignora-a: se quiseres alguma na série, move-a para `novas/eu`, `novas/ela` ou `novas/nos`.

Dica: corta os vídeos compridos no editor da galeria do celular antes. Vídeos de 5 a 20 segundos ficam melhor na série.

## 3. Atualizar a lista de fotos

A app precisa de uma lista com os nomes das fotos (`midia/lista.js`). **No GitHub esta lista é feita sozinha**; no teu computador fazes assim, sempre que juntares ou mudares fotos:

**Opção A (sem instalar nada):**
1. Abre `ferramentas/organizador.html` no Chrome ou Edge (duplo clique).
2. Carrega em **Escolher a pasta** e escolhe a pasta principal do projeto.
3. Confere a tabela (diz-te se alguma pasta tem o nome errado).
4. Carrega em **Descarregar lista.js** e move o ficheiro descarregado para dentro da pasta `midia/`, substituindo o antigo.

**Opção B (se tiveres Python):** duplo clique em `ferramentas/atualizar-lista-windows.bat` (Windows) ou `ferramentas/atualizar-lista-mac-linux.command` (Mac/Linux). Ou na linha de comandos: `python ferramentas/gerar-lista.py`

---

## 4. Ver no computador

Abre o `index.html` com duplo clique (de preferência no Chrome ou Edge).

No teu computador a app está em **modo de preparação**: mostra um aviso no topo e também os episódios ainda vazios, para saberes o que falta. No link que lhe vais enviar, o aviso e os episódios vazios desaparecem sozinhos.

---

## 5. Publicar no GitHub

O GitHub Pages aloja o site de graça. A cada envio, a publicação automática (o ficheiro `.github/workflows/publicar.yml`) reduz as fotos para carregarem rápido no celular, cria miniaturas, converte HEIC e MOV e publica tudo.

### 5.1 Enviar os ficheiros

**Com o GitHub Desktop (o mais fácil para muitas fotos):**
1. Cria conta em github.com e instala o GitHub Desktop (desktop.github.com).
2. No GitHub Desktop: **File → Add local repository** → escolhe a pasta do projeto → quando disser que não é um repositório, carrega em **create a repository**.
3. Dá um nome discreto ao repositório (por exemplo `nossa-serie`), escreve uma mensagem tipo "A nossa série" e carrega em **Commit to main**.
4. Carrega em **Publish repository** e **desmarca "Keep this code private"** (o GitHub Pages grátis só funciona com repositórios públicos; lê a secção Privacidade abaixo).

**Pela linha de comandos:**
```
git init
git add .
git commit -m "A nossa série"
git branch -M main
git remote add origin https://github.com/O-TEU-UTILIZADOR/nossa-serie.git
git push -u origin main
```

**Pelo site do GitHub (só para poucos ficheiros):** em "Add file → Upload files" arrasta as pastas. Limites: 25 MB por ficheiro e cerca de 100 ficheiros de cada vez. Confirma que a pasta `.github` também foi enviada (no Mac está escondida: carrega em Cmd+Shift+. no Finder para a ver).

### 5.2 Ligar o GitHub Pages (só uma vez)

1. No site do GitHub, abre o repositório → **Settings** → **Pages**.
2. Em **Build and deployment → Source**, escolhe **GitHub Actions**.
3. Vai ao separador **Actions**. Vais ver "Publicar a série" a correr. Espera pelo visto verde (2 a 5 minutos na primeira vez; com muitos vídeos pode demorar mais).
   - Se a primeira tentativa falhou porque ainda não tinhas ligado o Pages, abre-a e carrega em **Re-run all jobs**.
4. O link fica assim: `https://O-TEU-UTILIZADOR.github.io/nossa-serie/` (também aparece em Settings → Pages).

### 5.3 Atualizar no futuro

Junta fotos, muda textos, cria episódios novos, e envia outra vez (no GitHub Desktop: Commit → Push origin). O site atualiza-se sozinho em poucos minutos. O progresso dela (o que já viu) fica guardado no celular dela.

---

## 6. Enviar-lhe e pôr no ecrã do celular dela

Envia o link. Para ficar como uma app, com ícone M&E e em ecrã inteiro:

- **iPhone (Safari):** botão Partilhar → **Adicionar ao ecrã principal**.
- **Android (Chrome):** menu ⋮ → **Adicionar ao ecrã principal** (ou **Instalar app**).

Dica: a primeira vez é especial. Diz-lhe para aumentar o volume (ou usar auscultadores) antes de tocar em **Abrir**.

---

## Privacidade (lê isto)

- Com o GitHub Pages grátis, **o repositório é público**: quem encontrar o teu perfil no GitHub pode ver os ficheiros, incluindo as fotos. Usa um nome de repositório discreto e **não coloques fotos ou vídeos íntimos**.
- O site pede aos motores de busca para não o mostrarem (não aparece no Google), mas qualquer pessoa com o link consegue abri-lo.
- **PIN dos perfis:** está ligado com o PIN `12345` (`bloqueioPerfis` no `config.js`). Ao tocar num perfil, pede o PIN como o controlo parental das plataformas de streaming. Para mudar o PIN, muda `pin: "12345"`; com `lembrar: true` o celular dela só pede uma vez.
- O PIN e a pergunta-senha (`senha` no `config.js`) afastam curiosos que abram o link, mas não são segurança a sério: o PIN fica escrito no `config.js`, que é público, e quem souber o endereço exato de uma foto consegue abri-la.
- Se quiseres o repositório privado, o GitHub Pages exige uma conta paga (GitHub Pro). Outra opção grátis é a Netlify ou a Cloudflare Pages (arrastas a pasta `_site` gerada pelo `gerar-lista.py --otimizar --saida _site`).

---

## Limites de tamanho

- O GitHub não aceita ficheiros acima de **100 MB** (pelo site, 25 MB). Comprime vídeos grandes antes: no HandBrake usa o modelo "Fast 720p30", ou envia o vídeo a ti próprio no WhatsApp e guarda a versão recebida.
- Tenta manter o projeto abaixo de **1 GB** no total.
- O que ela descarrega é bem mais leve: a publicação reduz as fotos para 1920 px e converte vídeos acima de 25 MB para 720p.

---

## As surpresas que a app tem

- **Abertura:** "Uma série nova, feita só para ti", seguida do logótipo M&E a desenhar-se com som e um batimento de coração.
- **Quem está a ver?** com os vossos perfis e uma mensagem de boas-vindas para ela.
- **Contador "Juntos há…"** a contar anos, meses, dias e segundos, e quantos dias faltam para o próximo mesversário. No dia do mesversário ela recebe "Feliz mesversário!" ao entrar.
- **Episódios como vídeo:** fotos com movimento lento (efeito Ken Burns), fotos estilo polaroide com legenda escrita à mão, transições variadas (dissolver, desfocar, luz de película, zoom, revelação em forma de coração), grão de cinema, legendas e narrador.
- **Vídeos** com o som original e um fundo de cores do próprio vídeo à volta.
- **Trailer** gerado sozinho com as vossas fotos.
- **Top 10 razões por que te amo**, com números gigantes.
- **Carta Para Ti**, que se escreve letra a letra numa folha, com as vossas fotos ao fundo.
- **Créditos finais** no fim da temporada: "Protagonista: {ela}", "Nenhum coração foi magoado durante as filmagens", e "Temporada 2 em produção".
- **"Continuar a ver"**, próximo episódio automático, galeria de momentos, ecrã que não se apaga durante os episódios e botão "voltar" do celular a funcionar como numa app.

Atalhos no computador (dentro do player): Espaço pausa, setas mudam de cena, F ecrã inteiro, M música, Esc sai.

---

## Problemas comuns

| Problema | Solução |
|---|---|
| Página com "Há um pequeno erro no ficheiro de configuração" | Falta uma vírgula, aspa ou chaveta no `config.js`, perto da linha indicada. |
| As fotos não aparecem no computador | Atualiza a lista (passo 3). Confirma no organizador que o nome da pasta é igual ao `pasta:` do episódio no `config.js`. |
| No GitHub não aparece nada novo | Separador Actions: confirma o visto verde. Atualiza a página no celular (às vezes demora 1 ou 2 minutos). |
| A publicação falha | Settings → Pages → Source tem de estar em **GitHub Actions**. Depois Actions → Re-run all jobs. |
| Sem som no iPhone | Toca em "Tocar com som" se aparecer. Confirma o volume do celular. |
| Não gosto da voz do narrador | No player, desliga o botão Narrador. Melhor ainda: grava a tua voz (secção Música e narração). |
| Uma foto aparece de lado | Abre-a no editor de fotos do celular, roda-a e guarda de novo. |
| A foto de perfil não aparece | O nome tem de ser `ela`, `ele` ou `nos` (a extensão pode ser .jpg ou .png). Atualiza a lista. |

---

## Estrutura dos ficheiros

```
a-historia-de-me/
├── index.html            ← a app (abre com duplo clique)
├── config.js             ← EDITA AQUI: nomes, datas, textos, carta, episódios
├── COMO-USAR.md          ← este guia
├── midia/                ← COLA AQUI as fotos e vídeos (uma pasta por episódio)
│   └── lista.js          ← lista gerada (não edites à mão)
├── musica/               ← a vossa música (.mp3)
├── narracao/             ← a tua voz gravada (opcional)
├── ferramentas/
│   ├── organizador.html  ← cria a lista de fotos no browser
│   ├── gerar-lista.py    ← o mesmo em Python (e otimização para o GitHub)
│   └── atualizar-lista-*.bat / .command
├── app/                  ← código da app, fontes e ícones (não precisas de mexer)
├── manifest.webmanifest  ← permite "instalar" no celular
└── .github/workflows/publicar.yml  ← publicação automática no GitHub Pages
```

Feito com amor. Agora é contigo.
