#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gera midia/lista.js — a lista de fotos e vídeos de cada episódio.

USO NORMAL (no teu computador, para pré-visualizar):
    python ferramentas/gerar-lista.py

USO NO GITHUB (feito sozinho pela publicação automática):
    python ferramentas/gerar-lista.py --otimizar --saida _site --cache .cache-otimizacao
    → copia o site para _site/, reduz as fotos para 1920 px, cria miniaturas,
      converte HEIC → JPG e MOV → MP4, e escreve a lista com tudo isto.

Precisa só de Python 3. Pillow (fotos) e ffmpeg (vídeos) são opcionais.
"""
import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import unicodedata
from urllib.parse import quote

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

EXT_FOTO = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.heic', '.heif', '.jfif', '.bmp'}
EXT_VIDEO = {'.mp4', '.webm', '.mov', '.m4v', '.3gp', '.avi', '.mkv', '.ogv'}
VIDEO_NATIVO = {'.mp4', '.webm', '.m4v'}
FOTO_NAVEGADOR = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.jfif'}
IGNORAR_PASTAS = {'miniaturas'}

MAX_FOTO = 1920      # lado maior das fotos publicadas
MAX_MINI = 480       # lado maior das miniaturas
MAX_VIDEO = 1280     # lado maior dos vídeos convertidos
LIMITE_MP4_MB = 25   # mp4 maiores que isto são comprimidos

try:
    from PIL import Image, ImageOps
    try:
        Image.MAX_IMAGE_PIXELS = 200_000_000
    except Exception:
        pass
except Exception:  # Pillow não instalado
    Image = None
    ImageOps = None

HEIF_OK = False
if Image is not None:
    try:
        import pillow_heif  # type: ignore
        pillow_heif.register_heif_opener()
        HEIF_OK = True
    except Exception:
        HEIF_OK = False

FFMPEG = shutil.which('ffmpeg')
FFPROBE = shutil.which('ffprobe')


def chave_natural(s):
    s = unicodedata.normalize('NFC', s).lower()
    return [int(p) if p.isdigit() else p for p in re.split(r'(\d+)', s)]


def url(*partes):
    return '/'.join(quote(unicodedata.normalize('NFC', p), safe="-_.~()!*'") for p in partes)


def legenda_de(base):
    i = base.find(' - ')
    return base[i + 3:].strip() if i >= 0 else ''


def sha1(caminho):
    h = hashlib.sha1()
    with open(caminho, 'rb') as f:
        for bloco in iter(lambda: f.read(1 << 20), b''):
            h.update(bloco)
    return h.hexdigest()


def tamanho_foto(caminho):
    if Image is None:
        return None
    try:
        with Image.open(caminho) as im:
            w, h = im.size
            try:
                orient = im.getexif().get(274, 1)
            except Exception:
                orient = 1
            if orient in (5, 6, 7, 8):
                w, h = h, w
            return w, h
    except Exception:
        return None


def duracao_video(caminho):
    if not FFPROBE:
        if not FFMPEG:
            return None
        # sem ffprobe: lê a duração do cabeçalho que o ffmpeg imprime
        try:
            r = subprocess.run([FFMPEG, '-hide_banner', '-i', caminho], capture_output=True, text=True, timeout=60)
            m = re.search(r'Duration: (\d+):(\d+):([\d.]+)', r.stderr)
            d = int(m.group(1)) * 3600 + int(m.group(2)) * 60 + float(m.group(3)) if m else 0
            return round(d, 2) if d > 0 else None
        except Exception:
            return None
    try:
        r = subprocess.run([FFPROBE, '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', caminho],
                           capture_output=True, text=True, timeout=60)
        d = float(r.stdout.strip())
        return round(d, 2) if d > 0 else None
    except Exception:
        return None


def correr(cmd, timeout=1800):
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return r.returncode == 0
    except Exception:
        return False


# ---------------------------------------------------------------- otimização

def orientacao_normal(caminho):
    try:
        with Image.open(caminho) as im:
            return im.getexif().get(274, 1) == 1
    except Exception:
        return False


def otimizar_foto(origem, destino, mini, cache):
    """Escreve a foto reduzida em `destino` e a miniatura em `mini`. Devolve (w, h) ou None."""
    if Image is None:
        return None
    chave = sha1(origem) + '-v2'
    c_foto = os.path.join(cache, chave + '.jpg') if cache else None
    c_mini = os.path.join(cache, chave + '-mini.jpg') if cache else None
    c_meta = os.path.join(cache, chave + '.json') if cache else None
    if cache and all(os.path.exists(p) for p in (c_foto, c_mini, c_meta)):
        shutil.copyfile(c_foto, destino)
        shutil.copyfile(c_mini, mini)
        with open(c_meta, encoding='utf-8') as f:
            m = json.load(f)
        return m['w'], m['h']
    try:
        with Image.open(origem) as im:
            im = ImageOps.exif_transpose(im)
            if im.mode in ('RGBA', 'LA', 'P'):
                im = im.convert('RGBA')
                fundo = Image.new('RGB', im.size, (26, 10, 18))
                fundo.paste(im, mask=im.split()[-1])
                im = fundo
            elif im.mode != 'RGB':
                im = im.convert('RGB')
            grande = im.copy()
            grande.thumbnail((MAX_FOTO, MAX_FOTO), Image.LANCZOS)
            ja_otimizada = (os.path.splitext(origem)[1].lower() in ('.jpg', '.jpeg') and grande.size == im.size
                            and os.path.getsize(origem) < 1.5e6 and orientacao_normal(origem))
            if ja_otimizada:
                shutil.copyfile(origem, destino)  # já está pronta: não comprime outra vez
            else:
                grande.save(destino, 'JPEG', quality=84, optimize=True, progressive=True)
            pequena = im.copy()
            pequena.thumbnail((MAX_MINI, MAX_MINI), Image.LANCZOS)
            pequena.save(mini, 'JPEG', quality=74, optimize=True, progressive=True)
            w, h = grande.size
    except Exception as e:
        print('   ! não consegui otimizar', os.path.basename(origem), '-', e)
        return None
    if cache:
        shutil.copyfile(destino, c_foto)
        shutil.copyfile(mini, c_mini)
        with open(c_meta, 'w', encoding='utf-8') as f:
            json.dump({'w': w, 'h': h}, f)
    return w, h


def otimizar_video(origem, destino, poster, cache):
    """Converte/comprime o vídeo se for preciso e cria um poster. Devolve (destino_final, tem_poster, duracao)."""
    ext = os.path.splitext(origem)[1].lower()
    tamanho_mb = os.path.getsize(origem) / 1e6
    precisa_converter = ext not in VIDEO_NATIVO or tamanho_mb > LIMITE_MP4_MB
    chave = sha1(origem) + '-v2'
    c_video = os.path.join(cache, chave + '.mp4') if cache else None
    c_poster = os.path.join(cache, chave + '-poster.jpg') if cache else None

    if not FFMPEG:
        if ext in VIDEO_NATIVO:
            shutil.copyfile(origem, destino)
            return destino, False, duracao_video(destino)
        print('   ! sem ffmpeg: o vídeo', os.path.basename(origem), 'pode não tocar no celular (converte-o para .mp4)')
        destino_igual = os.path.splitext(destino)[0] + ext
        shutil.copyfile(origem, destino_igual)
        return destino_igual, False, None

    if precisa_converter:
        if cache and os.path.exists(c_video):
            shutil.copyfile(c_video, destino)
        else:
            print('   convertendo', os.path.basename(origem), f'({tamanho_mb:.0f} MB)…')
            escala = (f"scale='if(gte(iw,ih),trunc(min({MAX_VIDEO},iw)/2)*2,-2)':"
                      f"'if(gte(iw,ih),-2,trunc(min({MAX_VIDEO},ih)/2)*2)'")
            ok = correr([FFMPEG, '-y', '-loglevel', 'error', '-i', origem, '-vf', escala,
                         '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '26', '-pix_fmt', 'yuv420p',
                         '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', destino])
            if not ok:
                print('   ! falhou a conversão de', os.path.basename(origem), '- vou usar o original')
                destino = os.path.splitext(destino)[0] + ext
                shutil.copyfile(origem, destino)
            elif cache:
                shutil.copyfile(destino, c_video)
    else:
        shutil.copyfile(origem, destino)

    tem_poster = False
    if cache and os.path.exists(c_poster):
        shutil.copyfile(c_poster, poster)
        tem_poster = True
    else:
        for inicio in ('1', '0'):
            if correr([FFMPEG, '-y', '-loglevel', 'error', '-ss', inicio, '-i', destino, '-frames:v', '1',
                       '-vf', "scale='if(gte(iw,ih),720,-2)':'if(gte(iw,ih),-2,720)'", '-q:v', '4', poster], 120) \
                    and os.path.exists(poster) and os.path.getsize(poster) > 0:
                tem_poster = True
                if cache:
                    shutil.copyfile(poster, c_poster)
                break
    return destino, tem_poster, duracao_video(destino)


# ---------------------------------------------------------------- principal

def listar_pastas(midia):
    pastas = {}
    if not os.path.isdir(midia):
        return pastas
    for nome in sorted(os.listdir(midia), key=chave_natural):
        p = os.path.join(midia, nome)
        if not os.path.isdir(p) or nome.startswith('.') or nome in IGNORAR_PASTAS:
            continue
        ficheiros = []
        for f in os.listdir(p):
            if f.startswith('.') or not os.path.isfile(os.path.join(p, f)):
                continue
            ext = os.path.splitext(f)[1].lower()
            if ext in EXT_FOTO or ext in EXT_VIDEO:
                ficheiros.append(f)
        ficheiros.sort(key=chave_natural)
        pastas[nome] = ficheiros
    return pastas


def copiar_site(saida):
    if os.path.exists(saida):
        shutil.rmtree(saida)
    os.makedirs(saida)
    excluir = {'.git', '.github', 'ferramentas', 'midia', 'novas', os.path.basename(saida), '.cache-otimizacao',
               'node_modules', '__pycache__'}
    for nome in os.listdir(RAIZ):
        if nome in excluir or nome.lower().endswith('.md') or (nome.startswith('.') and nome != '.nojekyll'):
            continue
        origem = os.path.join(RAIZ, nome)
        destino = os.path.join(saida, nome)
        if os.path.isdir(origem):
            shutil.copytree(origem, destino, ignore=shutil.ignore_patterns('COLOCA-AQUI.txt', '.DS_Store', 'Thumbs.db', 'desktop.ini'))
        else:
            shutil.copy2(origem, destino)


EXT_AUDIO = {'.mp3', '.m4a', '.aac', '.ogg', '.oga', '.opus', '.wav'}


def listar_audio():
    audio = {}
    for pasta in ('musica', 'narracao'):
        p = os.path.join(RAIZ, pasta)
        nomes = []
        if os.path.isdir(p):
            nomes = sorted((f for f in os.listdir(p)
                            if not f.startswith('.') and os.path.splitext(f)[1].lower() in EXT_AUDIO),
                           key=chave_natural)
        audio[pasta] = [url(pasta, f) for f in nomes]
    return audio


def escrever_lista(caminho, lista):
    linhas = ['/* Ficheiro gerado automaticamente por ferramentas/gerar-lista.py — não edites à mão. */',
              'window.LISTA_MIDIA = {']
    for pasta, itens in lista.items():
        linhas.append('  ' + json.dumps(pasta, ensure_ascii=False) + ': [')
        for it in itens:
            linhas.append('    ' + json.dumps(it, ensure_ascii=False) + ',')
        linhas.append('  ],')
    linhas.append('};')
    linhas.append('window.LISTA_AUDIO = ' + json.dumps(listar_audio(), ensure_ascii=False) + ';')
    os.makedirs(os.path.dirname(caminho), exist_ok=True)
    with open(caminho, 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(linhas) + '\n')


def main():
    try:
        sys.stdout.reconfigure(errors='replace')
    except Exception:
        pass
    ap = argparse.ArgumentParser(description='Gera midia/lista.js')
    ap.add_argument('--otimizar', action='store_true', help='reduz fotos, cria miniaturas e converte vídeos')
    ap.add_argument('--saida', default=None, help='pasta onde montar o site otimizado (ex.: _site)')
    ap.add_argument('--cache', default=None, help='pasta de cache para não repetir trabalho')
    args = ap.parse_args()

    midia = os.path.join(RAIZ, 'midia')
    pastas = listar_pastas(midia)
    otimizar = args.otimizar and args.saida
    saida = os.path.join(RAIZ, args.saida) if args.saida and not os.path.isabs(args.saida) else args.saida
    cache = None
    if args.cache:
        cache = args.cache if os.path.isabs(args.cache) else os.path.join(RAIZ, args.cache)
        os.makedirs(cache, exist_ok=True)

    if otimizar:
        print('A montar o site em', saida)
        copiar_site(saida)
        if Image is None:
            print('! Pillow não está instalado: as fotos vão sem otimização.')
        if not FFMPEG:
            print('! ffmpeg não encontrado: os vídeos vão sem conversão.')

    lista = {}
    avisos = []
    total_bytes = 0
    for pasta, ficheiros in pastas.items():
        itens = []
        print(f'• {pasta}: {len(ficheiros)} ficheiro(s)')
        if otimizar:
            os.makedirs(os.path.join(saida, 'midia', pasta), exist_ok=True)
        nomes_usados = set(f.lower() for f in ficheiros)
        for f in ficheiros:
            origem = os.path.join(midia, pasta, f)
            base, ext = os.path.splitext(f)
            ext = ext.lower()
            tamanho = os.path.getsize(origem)
            total_bytes += tamanho
            if tamanho > 95e6:
                avisos.append(f'{pasta}/{f} tem {tamanho / 1e6:.0f} MB: o GitHub não aceita ficheiros acima de 100 MB. Comprime este vídeo.')
            item = {'f': '', 't': 'video' if ext in EXT_VIDEO else 'foto'}
            leg = legenda_de(base)
            if leg:
                item['legenda'] = leg

            if not otimizar:
                item['f'] = url('midia', pasta, f)
                if item['t'] == 'foto':
                    if ext in ('.heic', '.heif'):
                        avisos.append(f'{pasta}/{f}: fotos HEIC só aparecem no iPhone. No GitHub são convertidas sozinhas para JPG.')
                    tam = tamanho_foto(origem)
                    if tam:
                        item['w'], item['h'] = tam
                else:
                    if ext not in VIDEO_NATIVO:
                        avisos.append(f'{pasta}/{f}: vídeos {ext} podem não tocar em Android. No GitHub são convertidos sozinhos para MP4.')
                    d = duracao_video(origem)
                    if d:
                        item['d'] = d
                itens.append(item)
                continue

            # ---- modo otimizado (GitHub)
            pasta_saida = os.path.join(saida, 'midia', pasta)
            pasta_mini = os.path.join(pasta_saida, 'miniaturas')
            os.makedirs(pasta_mini, exist_ok=True)
            mini_nome = f'{base}__{ext[1:]}.jpg'
            if item['t'] == 'foto':
                if ext == '.gif' or Image is None or (ext in ('.heic', '.heif') and not HEIF_OK):
                    shutil.copyfile(origem, os.path.join(pasta_saida, f))
                    item['f'] = url('midia', pasta, f)
                    tam = tamanho_foto(origem)
                    if tam:
                        item['w'], item['h'] = tam
                else:
                    nome_final = f if ext in ('.jpg', '.jpeg') else base + '.jpg'
                    if nome_final != f and nome_final.lower() in nomes_usados:
                        nome_final = f'{base}-{ext[1:]}.jpg'
                    tam = otimizar_foto(origem, os.path.join(pasta_saida, nome_final), os.path.join(pasta_mini, mini_nome), cache)
                    if tam:
                        item['f'] = url('midia', pasta, nome_final)
                        item['w'], item['h'] = tam
                        item['mini'] = url('midia', pasta, 'miniaturas', mini_nome)
                    else:
                        shutil.copyfile(origem, os.path.join(pasta_saida, f))
                        item['f'] = url('midia', pasta, f)
            else:
                nome_final = base + '.mp4' if ext not in VIDEO_NATIVO else f
                if nome_final != f and nome_final.lower() in nomes_usados:
                    nome_final = f'{base}-{ext[1:]}.mp4'
                destino, tem_poster, d = otimizar_video(origem, os.path.join(pasta_saida, nome_final), os.path.join(pasta_mini, mini_nome), cache)
                item['f'] = url('midia', pasta, os.path.basename(destino))
                if tem_poster:
                    item['poster'] = url('midia', pasta, 'miniaturas', mini_nome)
                if d:
                    item['d'] = d
            itens.append(item)
        lista[pasta] = itens

    destino_lista = os.path.join(saida if otimizar else RAIZ, 'midia', 'lista.js')
    escrever_lista(destino_lista, lista)

    total_fotos = sum(1 for v in lista.values() for i in v if i['t'] == 'foto')
    total_videos = sum(1 for v in lista.values() for i in v if i['t'] == 'video')
    print()
    print(f'Pronto: {total_fotos} fotos e {total_videos} vídeos em {len(lista)} pastas.')
    print('Lista escrita em', os.path.relpath(destino_lista, RAIZ))
    if total_bytes > 900e6 and not otimizar:
        avisos.append(f'As tuas fotos e vídeos ocupam {total_bytes / 1e9:.1f} GB. O GitHub recomenda menos de 1 GB por repositório: comprime os vídeos maiores.')
    if avisos:
        print()
        print('Avisos:')
        for a in avisos:
            print(' -', a)
    return 0


if __name__ == '__main__':
    sys.exit(main())
