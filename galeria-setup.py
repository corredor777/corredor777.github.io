#!/usr/bin/env python3
"""
galeria_setup.py
Ferramentas de manutenção da galeria de artefatos do Corredor 777.
Otimizado para arquitetura de Repositórios Satélites (Sem LFS / Custo Zero).

Uso:
    python galeria_setup.py thumbs          — gera thumbs locais para imagens e vídeos novos
    python galeria_setup.py json            — gera/atualiza galeria-obras.json mapeando URLs remotas
    python galeria_setup.py tudo            — roda thumbs + json em sequência
"""

import json
import math
import os
import random
import subprocess
import sys
from pathlib import Path

# ─── CONFIGURAÇÃO DO SATELLITE DEPLOY ─────────────────────────────────────────

# SUBSITUIR COM O SEU NOME DE USUÁRIO REAL DO GITHUB:
SEU_USUARIO_GITHUB = "corredor777"

# Nome base dos repositórios que hospedarão os arquivos brutos
REPO_MIDIAS_A = "corredor777-midias-a"
REPO_MIDIAS_B = "corredor777-midias-b"

# ─── CONFIGURAÇÃO PADRÃO ──────────────────────────────────────────────────────

# Caminhos locais para processamento de miniaturas
PASTA_IMAGENS   = Path("setores/galeria/artefatos/imagens")
PASTA_THUMBS    = Path("setores/galeria/artefatos/imagens/thumbs")
PASTA_VIDEOS    = Path("setores/galeria/artefatos//videos")
ARQUIVO_JSON    = Path("setores/galeria/galeria-obras.json")

EXT_IMAGENS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
EXT_VIDEOS  = {".mp4", ".webm", ".mov"}

# Largura máxima da miniatura local (Git principal)
THUMB_LARGURA = 500

# Dimensões e regras da parede virtual
CANVAS_W = 6000
CANVAS_H = 5000
CENTRO_X = 3000
CENTRO_Y = 2500
RAIO = 1800
SEED_LAYOUT = 777

LARGURA_MIN = 180
LARGURA_MAX = 480
ROT_MAX = 4.5
Z_MIN = 1
Z_MAX = 8

# ─── UTILIDADES ───────────────────────────────────────────────────────────────

def verificar_raiz():
    if not Path("galeria").exists():
        print("ERRO: execute este script a partir da raiz do repositório.")
        print("  cd /caminho/para/corredor777")
        print("  python galeria/ferramentas/galeria_setup.py tudo")
        sys.exit(1)

# ─── THUMBS ───────────────────────────────────────────────────────────────────

def gerar_thumbs():
    PASTA_THUMBS.mkdir(parents=True, exist_ok=True)
    processadas = 0
    puladas = 0

    if PASTA_IMAGENS.exists():
        for arquivo in sorted(PASTA_IMAGENS.iterdir()):
            if arquivo.suffix.lower() not in EXT_IMAGENS or arquivo.parent == PASTA_THUMBS:
                continue

            destino = PASTA_THUMBS / arquivo.name
            if destino.exists():
                puladas += 1
                continue

            try:
                from PIL import Image
                with Image.open(arquivo) as img:
                    ratio = THUMB_LARGURA / img.width
                    nova_altura = int(img.height * ratio)
                    thumb = img.resize((THUMB_LARGURA, nova_altura), Image.LANCZOS)

                    if thumb.mode in ("RGBA", "P"):
                        thumb = thumb.convert("RGB")

                    sufixo = arquivo.suffix.lower()
                    if sufixo in (".jpg", ".jpeg"):
                        thumb.save(destino, "JPEG", quality=75, optimize=True)
                    else:
                        thumb.save(destino, optimize=True)

                print(f"  ✓ thumb: {arquivo.name}")
                processadas += 1
            except Exception as e:
                print(f"  ✗ erro em {arquivo.name}: {e}")

    if PASTA_VIDEOS.exists():
        for arquivo in sorted(PASTA_VIDEOS.iterdir()):
            if arquivo.suffix.lower() not in EXT_VIDEOS:
                continue

            destino = PASTA_THUMBS / (arquivo.stem + ".jpg")
            if destino.exists():
                puladas += 1
                continue

            try:
                resultado = subprocess.run(
                    [
                        "ffprobe", "-v", "error",
                        "-show_entries", "format=duration",
                        "-of", "default=noprint_wrappers=1:nokey=1",
                        str(arquivo),
                    ],
                    capture_output=True, text=True, timeout=30
                )
                duracao = float(resultado.stdout.strip() or "0")
                frame_em = duracao / 2

                subprocess.run(
                    [
                        "ffmpeg", "-ss", str(frame_em),
                        "-i", str(arquivo),
                        "-vframes", "1",
                        "-vf", f"scale={THUMB_LARGURA}:-1",
                        "-q:v", "3",
                        str(destino),
                        "-y",
                    ],
                    capture_output=True, timeout=60
                )

                if destino.exists():
                    print(f"  ✓ thumb vídeo: {arquivo.name}")
                    processadas += 1
                else:
                    print(f"  ✗ ffmpeg não gerou thumb para {arquivo.name}")
            except Exception as e:
                print(f"  ✗ erro em {arquivo.name}: {e}")

    print(f"\n  {processadas} geradas, {puladas} já existiam.\n")

# ─── DISTRIBUIÇÃO NO CANVAS ───────────────────────────────────────────────────

def distribuir_obras(ids: list[str]) -> dict[str, dict]:
    rng = random.Random(SEED_LAYOUT)
    layout = {}
    n = len(ids)
    angulo_golden = math.pi * (3 - math.sqrt(5))

    for i, obra_id in enumerate(ids):
        r = RAIO * math.sqrt((i + 0.5) / n)
        theta = i * angulo_golden

        x = CENTRO_X + r * math.cos(theta) + rng.uniform(-120, 120)
        y = CENTRO_Y + r * math.sin(theta) + rng.uniform(-80, 80)

        layout[obra_id] = {
            "x": int(x),
            "y": int(y),
            "w": rng.randint(LARGURA_MIN, LARGURA_MAX),
            "rot": round(rng.uniform(-ROT_MAX, ROT_MAX), 2),
            "z": rng.randint(Z_MIN, Z_MAX),
        }
    return layout

# ─── MAPEAMENTO E CRIAÇÃO DO JSON SATELLITE ───────────────────────────────────

def _listar_arquivos_e_dividir() -> list[dict]:
    """Varre arquivos locais, extrai proporção e divide entre os servidores A e B."""
    todos_arquivos = []

    # Localiza Imagens
    if PASTA_IMAGENS.exists():
        from PIL import Image
        for f in sorted(PASTA_IMAGENS.iterdir()):
            if f.suffix.lower() in EXT_IMAGENS and f.parent != PASTA_THUMBS:
                proporcao = 1.0
                try:
                    with Image.open(f) as img:
                        proporcao = round(img.height / img.width, 4)
                except Exception:
                    pass
                todos_arquivos.append({"nome": f.name, "stem": f.stem, "tipo": "imagem", "proporcao": proporcao})

    # Localiza Vídeos
    if PASTA_VIDEOS.exists():
        for f in sorted(PASTA_VIDEOS.iterdir()):
            if f.suffix.lower() in EXT_VIDEOS:
                proporcao = 0.5625
                try:
                    resultado = subprocess.run(
                        [
                            "ffprobe", "-v", "error",
                            "-select_streams", "v:0",
                            "-show_entries", "stream=width,height",
                            "-of", "csv=s=x:p=0",
                            str(f)
                        ],
                        capture_output=True, text=True, timeout=10
                    )
                    dimensoes = resultado.stdout.strip().split('x')
                    if len(dimensoes) == 2:
                        proporcao = round(float(dimensoes[1]) / float(dimensoes[0]), 4)
                except Exception:
                    pass
                todos_arquivos.append({"nome": f.name, "stem": f.stem, "tipo": "video", "proporcao": proporcao})

    # Divide os arquivos de forma balanceada (Metade no Repositório A, Metade no B)
    arquivos_mapeados = []
    metade = len(todos_arquivos) // 2

    for index, arquivo in enumerate(todos_arquivos):
        # Determina qual repositório satélite receberá o arquivo bruto
        repo_destino = REPO_MIDIAS_A if index < metade else REPO_MIDIAS_B
        
        url_remota_original = f"https://{SEU_USUARIO_GITHUB}.github.io/{repo_destino}/{arquivo['nome']}"
        thumb_local_site = f"../assets/images/artefatos/thumbs/{arquivo['stem'] if arquivo['tipo'] == 'video' else arquivo['nome']}"
        if arquivo['tipo'] == 'video':
            thumb_local_site = f"../assets/images/artefatos/thumbs/{arquivo['stem']}.jpg"

        item = {
            "id": arquivo["stem"],
            "tipo": arquivo["tipo"],
            "src": url_remota_original,
            "thumb": thumb_local_site,
            "proporcao": arquivo["proporcao"]
        }
        
        if arquivo["tipo"] == "video":
            item["poster"] = thumb_local_site

        arquivos_mapeados.append(item)

    return arquivos_mapeados


def _entrada_vazia(arquivo: dict, layout: dict) -> dict:
    pos = layout.get(arquivo["id"], {"x": CENTRO_X, "y": CENTRO_Y, "w": 300, "rot": 0, "z": 3})
    entrada = {
        "id":        arquivo["id"],
        "tipo":      arquivo["tipo"],
        "src":       arquivo["src"],
        "thumb":     arquivo["thumb"],
        "proporcao": arquivo["proporcao"],
        "alt":       "",
        "x":         pos["x"],
        "y":         pos["y"],
        "w":         pos["w"],
        "rot":       pos["rot"],
        "z":         pos["z"],
        "titulo":    "",
        "ano":       "",
        "midia":     "",
        "materiais": "",
        "refs":      "",
        "proposta":  "",
    }
    if arquivo["tipo"] == "video":
        entrada["poster"] = arquivo["poster"]
    return entrada


def gerar_json():
    ARQUIVO_JSON.parent.mkdir(parents=True, exist_ok=True)

    existentes = {}
    if ARQUIVO_JSON.exists():
        with open(ARQUIVO_JSON, encoding="utf-8") as f:
            dados = json.load(f)
        existentes = {obra["id"]: obra for obra in dados}

    arquivos = _listar_arquivos_e_dividir()
    if not arquivos:
        print("  Nenhum arquivo encontrado nas pastas de artefatos locais.\n")
        return

    ids_novos = [a["id"] for a in arquivos if a["id"] not in existentes]

    if not ids_novos and len(arquivos) == len(existentes):
        print(f"  JSON já está atualizado. {len(existentes)} obras registradas.\n")
        return

    print(f"  Processando mapeamento de rede para {len(arquivos)} mídias...")

    todos_ids = [a["id"] for a in arquivos]
    layout = distribuir_obras(todos_ids)

    todas_entradas = []
    for arquivo in arquivos:
        if arquivo["id"] in existentes:
            # Mantém metadados antigos, mas atualiza a URL do src caso a divisão mude
            entrada_atualizada = existentes[arquivo["id"]]
            entrada_atualizada["src"] = arquivo["src"]
            entrada_atualizada["proporcao"] = arquivo["proporcao"]
            todas_entradas.append(entrada_atualizada)
        else:
            entrada = _entrada_vazia(arquivo, layout)
            todas_entradas.append(entrada)
            print(f"  + Nova obra mapeada para nuvem: {arquivo['id']}")

    with open(ARQUIVO_JSON, "w", encoding="utf-8") as f:
        json.dump(todas_entradas, f, ensure_ascii=False, indent=2)

    print(f"\n  ✓ JSON internacional gerado com sucesso em {ARQUIVO_JSON}")
    print("  Separe os arquivos físicos originais de acordo com as URLs geradas antes do push.\n")


# ─── MAIN ─────────────────────────────────────────────────────────────────────

COMANDOS = {
    "thumbs": gerar_thumbs,
    "json":   gerar_json,
}

def main():
    verificar_raiz()

    args = sys.argv[1:]
    if not args or args[0] not in (*COMANDOS, "tudo"):
        print(__doc__)
        sys.exit(0)

    comando = args[0]

    if comando == "tudo":
        print("── 1. Gerando miniaturas locais para renderização básica ──")
        gerar_thumbs()
        print("── 2. Mapeando distribuição nos servidores GitHub Satélites ──")
        gerar_json()
    else:
        COMANDOS[comando]()

if __name__ == "__main__":
    main()