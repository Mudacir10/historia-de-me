#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Acrescenta fotos e vídeos novos à série, já comprimidos e no sítio certo.

COMO USAR:
  1. Copia as fotos/vídeos para as pastas dentro de  novas/ :
        novas/eu/    → só tu       (vai para o especial "Simplesmente Eu")
        novas/ela/   → só ela      (vai para o especial "ELA")
        novas/nos/   → os dois     (vai para o episódio 11 "A História Continua")
     Também podes criar  novas/<nome de uma pasta de midia>/ , por exemplo
     novas/07-para-sempre/  ou  novas/especial-cenas-cortadas/ .
  2. Duplo clique em  ferramentas/adicionar-fotos-windows.bat  (Windows)
     ou  ferramentas/adicionar-fotos-mac-linux.command  (Mac/Linux).
     Ou na linha de comandos:  python ferramentas/adicionar.py

O que faz a cada ficheiro:
  • fotos  → endireita, reduz para 1920 px, JPG leve, apaga a localização GPS
  • vídeos → 720p em H.264 (toca em qualquer celular), sem localização
  • numera a seguir às que já existem, por ordem da data em que foram tiradas
  • apaga o original de novas/ quando corre bem, e atualiza midia/lista.js

Legenda escrita à mão: põe " - " no nome antes de correr.
Exemplo:  "IMG_123 - O nosso jantar.jpg"  mostra "O nosso jantar" sobre a foto.

Precisa de Python 3 e Pillow. O ffmpeg (para os vídeos) é descarregado
sozinho na primeira vez, se não estiver instalado.
"""
import io
import json
import os
import platform
import re
import shutil
import subprocess
import sys
import time
import unicodedata
import urllib.request
import zipfile

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NOVAS = os.path.join(RAIZ, 'novas')
MIDIA = os.path.join(RAIZ, 'midia')
PASTA_FFMPEG = os.path.join(RAIZ, 'ferramentas', '.ffmpeg')

ATALHOS = {
    'eu': 'especial-eu',
    'ela': 'especial-ela',
    'nos': '11-a-historia-continua',
    'nós': '11-a-historia-continua',
}
IGNORAR = {'nao-usadas', 'não-usadas'}  # fotos guardadas de lado: nunca entram na série
EXT_FOTO = {'.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.jfif', '.bmp'}
EXT_VIDEO = {'.mp4', '.mov', '.m4v', '.3gp', '.avi', '.mkv', '.webm'}
MAX_FOTO = 1920
MAX_VIDEO = 1280

try:
    from PIL import Image, ImageOps
    Image.MAX_IMAGE_PIXELS = 300_000_000
except Exception:
    Image = None
try:
    import pillow_heif  # type: ignore
    pillow_heif.register_heif_opener()
    HEIF_OK = True
except Exception:
    HEIF_OK = False


# ---------------------------------------------------------------- ffmpeg

def achar_ffmpeg():
    f = shutil.which('ffmpeg')
    if f:
        return f
    if os.path.isdir(PASTA_FFMPEG):
        for n in os.listdir(PASTA_FFMPEG):
            if n.startswith('ffmpeg'):
                return os.path.join(PASTA_FFMPEG, n)
    return None


def descarregar_ffmpeg():
    """Descarrega um ffmpeg pronto a usar (pacote imageio-ffmpeg do PyPI) para ferramentas/.ffmpeg/."""
    so, maq = sys.platform, platform.machine().lower()
    if so.startswith('win'):
        alvo = 'win_amd64'
    elif so == 'darwin':
        alvo = 'macosx_11_0_arm64' if maq in ('arm64', 'aarch64') else 'macosx_10_9_intel'
    else:
        alvo = 'manylinux2014_aarch64' if maq in ('arm64', 'aarch64') else 'manylinux2014_x86_64'
    print('A descarregar o ffmpeg (só na primeira vez, cerca de 30 MB)…')
    try:
        with urllib.request.urlopen('https://pypi.org/pypi/imageio-ffmpeg/json', timeout=60) as r:
            info = json.load(r)
        url = next(u['url'] for u in info['urls'] if alvo in u['filename'])
        with urllib.request.urlopen(url, timeout=600) as r:
            dados = r.read()
        with zipfile.ZipFile(io.BytesIO(dados)) as z:
            nome = next(n for n in z.namelist() if '/binaries/ffmpeg' in n)
            os.makedirs(PASTA_FFMPEG, exist_ok=True)
            destino = os.path.join(PASTA_FFMPEG, 'ffmpeg.exe' if so.startswith('win') else 'ffmpeg')
            with z.open(nome) as o, open(destino, 'wb') as d:
                shutil.copyfileobj(o, d)
        os.chmod(destino, 0o755)
        return destino
    except Exception as e:
        print('  ! não consegui descarregar o ffmpeg:', e)
        return None


# ---------------------------------------------------------------- utilidades

def data_de(caminho):
    """Data em que a foto/vídeo foi tirada: EXIF, depois o nome (IMG_20261025_…), depois a data do ficheiro."""
    if Image is not None and os.path.splitext(caminho)[1].lower() in EXT_FOTO:
        try:
            with Image.open(caminho) as im:
                ex = im.getexif()
                d = ex.get_ifd(0x8769).get(36867) or ex.get(306)
                if d:
                    return time.mktime(time.strptime(str(d)[:19], '%Y:%m:%d %H:%M:%S'))
        except Exception:
            pass
    m = re.search(r'(20\d{2})(\d{2})(\d{2})[_-]?(\d{2})?(\d{2})?(\d{2})?', os.path.basename(caminho))
    if m:
        try:
            return time.mktime((int(m.group(1)), int(m.group(2)), int(m.group(3)),
                                int(m.group(4) or 0), int(m.group(5) or 0), int(m.group(6) or 0), 0, 0, -1))
        except Exception:
            pass
    return os.path.getmtime(caminho)


def proximo_numero(pasta):
    n = 0
    if os.path.isdir(pasta):
        for f in os.listdir(pasta):
            m = re.match(r'^(\d+)', f)
            if m:
                n = max(n, int(m.group(1)))
    return n + 1


def legenda_de(base):
    i = base.find(' - ')
    if i < 0:
        return ''
    leg = base[i + 3:].strip()
    return re.sub(r'[\\/:*?"<>|]', '', unicodedata.normalize('NFC', leg))


def otimizar_foto(origem, destino):
    with Image.open(origem) as im:
        im = ImageOps.exif_transpose(im)
        if im.mode in ('RGBA', 'LA', 'P'):
            im = im.convert('RGBA')
            fundo = Image.new('RGB', im.size, (26, 10, 18))
            fundo.paste(im, mask=im.split()[-1])
            im = fundo
        elif im.mode != 'RGB':
            im = im.convert('RGB')
        im.thumbnail((MAX_FOTO, MAX_FOTO), Image.LANCZOS)
        im.save(destino, 'JPEG', quality=85, optimize=True, progressive=True)  # sem EXIF: sem GPS


def otimizar_video(ffmpeg, origem, destino):
    escala = (f"scale='if(gte(iw,ih),min({MAX_VIDEO},iw),-2)':'if(gte(iw,ih),-2,min({MAX_VIDEO},ih))'")
    cmd = [ffmpeg, '-y', '-loglevel', 'error', '-i', origem, '-vf', escala,
           '-c:v', 'libx264', '-preset', 'slow', '-crf', '23', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
           '-c:a', 'aac', '-b:a', '128k', '-ac', '2', '-movflags', '+faststart', '-map_metadata', '-1', destino]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(r.stderr.strip().splitlines()[-1] if r.stderr.strip() else 'erro desconhecido')


# ---------------------------------------------------------------- principal

def preparar_novas():
    for n in ('eu', 'ela', 'nos'):
        os.makedirs(os.path.join(NOVAS, n), exist_ok=True)


def main():
    try:
        sys.stdout.reconfigure(errors='replace', line_buffering=True)
    except Exception:
        pass
    preparar_novas()
    if Image is None:
        print('! Falta o Pillow. Instala com:  python -m pip install pillow')
        return 1

    trabalho = []  # (pasta de destino, ficheiro original)
    for sub in sorted(os.listdir(NOVAS)):
        caminho = os.path.join(NOVAS, sub)
        if not os.path.isdir(caminho) or sub.lower() in IGNORAR:
            continue
        destino = ATALHOS.get(sub.lower(), sub)
        ficheiros = [os.path.join(caminho, f) for f in os.listdir(caminho)
                     if not f.startswith('.') and os.path.splitext(f)[1].lower() in EXT_FOTO | EXT_VIDEO]
        if not ficheiros:
            continue
        if sub.lower() not in ATALHOS and not os.path.isdir(os.path.join(MIDIA, destino)):
            print(f'! novas/{sub}/: não existe nenhuma pasta midia/{sub}/. Usa eu, ela, nos ou o nome de uma pasta de midia/.')
            continue
        for f in ficheiros:
            trabalho.append((destino, f))

    if not trabalho:
        print('Não há nada novo. Coloca fotos e vídeos em novas/eu, novas/ela ou novas/nos e corre outra vez.')
        return 0

    ffmpeg = None
    if any(os.path.splitext(f)[1].lower() in EXT_VIDEO for _, f in trabalho):
        ffmpeg = achar_ffmpeg() or descarregar_ffmpeg()

    feitos, falhas, antes, depois = 0, 0, 0, 0
    por_pasta = {}
    for destino, f in trabalho:
        por_pasta.setdefault(destino, []).append(f)
    for destino, ficheiros in por_pasta.items():
        pasta = os.path.join(MIDIA, destino)
        os.makedirs(pasta, exist_ok=True)
        ficheiros.sort(key=data_de)
        n = proximo_numero(pasta)
        print(f'• midia/{destino}/')
        for f in ficheiros:
            base, ext = os.path.splitext(os.path.basename(f))
            ext = ext.lower()
            leg = legenda_de(base)
            video = ext in EXT_VIDEO
            nome = f'{n:02d}' + (f' - {leg}' if leg else '') + ('.mp4' if video else '.jpg')
            final = os.path.join(pasta, nome)
            try:
                if video:
                    if not ffmpeg:
                        raise RuntimeError('sem ffmpeg para comprimir vídeos')
                    otimizar_video(ffmpeg, f, final)
                else:
                    if ext in ('.heic', '.heif') and not HEIF_OK:
                        raise RuntimeError('foto HEIC: instala  python -m pip install pillow-heif  ou converte para JPG')
                    otimizar_foto(f, final)
            except Exception as e:
                falhas += 1
                if os.path.exists(final):
                    os.remove(final)
                print(f'   ! {os.path.basename(f)}: {e} (ficou em novas/)')
                continue
            a, d = os.path.getsize(f), os.path.getsize(final)
            antes += a; depois += d; feitos += 1; n += 1
            print(f'   {os.path.basename(f)}  →  {nome}   {a / 1e6:.1f} MB → {d / 1e6:.1f} MB')
            os.remove(f)

    print()
    if feitos:
        print(f'Pronto: {feitos} ficheiro(s) acrescentado(s). {antes / 1e6:.0f} MB → {depois / 1e6:.0f} MB.')
        env = dict(os.environ)
        if ffmpeg:
            env['PATH'] = os.path.dirname(ffmpeg) + os.pathsep + env.get('PATH', '')
        subprocess.run([sys.executable, os.path.join(RAIZ, 'ferramentas', 'gerar-lista.py')], env=env)
    if falhas:
        print(f'{falhas} ficheiro(s) não foram acrescentados: estão ainda em novas/.')
    return 1 if falhas and not feitos else 0


if __name__ == '__main__':
    sys.exit(main())
