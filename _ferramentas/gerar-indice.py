#!/usr/bin/env python3
"""
gerar-indice.py
Gera/atualiza os arquivos index.json das subseções de Transmissões.

Uso (de qualquer diretório):
    python _ferramentas/gerar-indice.py
"""

import json
from pathlib import Path

# ─── RAIZ DO REPOSITÓRIO ──────────────────────────────────────────────────────

# _ferramentas/ está um nível abaixo da raiz — sobe um nível para ancorá-la
RAIZ = Path(__file__).resolve().parent.parent

# ─── CAMINHOS ─────────────────────────────────────────────────────────────────

TRANSMISSOES = RAIZ / "fragmentos" / "transmissoes"

PASTA_DIARIO = TRANSMISSOES / "diario" / "entradas"
PASTA_ARQUIVOS = TRANSMISSOES / "notas" / "arquivos"
PASTA_DEFINICOES = TRANSMISSOES / "notas" / "definicoes"
PASTA_ENSAIOS = TRANSMISSOES / "notas" / "ensaios"

# ─── HELPERS ──────────────────────────────────────────────────────────────────


def salvar_json(caminho: Path, dados) -> None:
    with open(caminho, "w", encoding="utf-8") as f:
        json.dump(dados, f, indent=2, ensure_ascii=False)


def pasta_existe(pasta: Path, nome: str) -> bool:
    if not pasta.exists():
        print(f"  aviso: pasta não encontrada, pulando — {pasta.relative_to(RAIZ)}")
        return False
    return True


# ─── INDEXADORES ──────────────────────────────────────────────────────────────


def indexar_diario():
    if not pasta_existe(PASTA_DIARIO, "diário"):
        return

    entradas = sorted(
        [f.stem for f in PASTA_DIARIO.iterdir() if f.suffix == ".html"], reverse=True
    )
    salvar_json(PASTA_DIARIO / "index.json", entradas)
    print(f"  {len(entradas)} entradas do diário indexadas.")


def indexar_arquivos():
    if not pasta_existe(PASTA_ARQUIVOS, "arquivos"):
        return

    slugs = sorted(f.stem for f in PASTA_ARQUIVOS.iterdir() if f.suffix == ".html")
    itens = [
        {"slug": slug, "titulo": slug.replace("-", " ").capitalize()} for slug in slugs
    ]
    salvar_json(PASTA_ARQUIVOS / "index.json", itens)
    print(f"  {len(itens)} notas/arquivos indexados.")


def indexar_definicoes():
    if not pasta_existe(PASTA_DEFINICOES, "definições"):
        return

    slugs = sorted(f.stem for f in PASTA_DEFINICOES.iterdir() if f.suffix == ".html")
    itens = [{"slug": slug, "termo": slug.replace("-", " ").lower()} for slug in slugs]
    salvar_json(PASTA_DEFINICOES / "index.json", itens)
    print(f"  {len(itens)} definições indexadas.")


def indexar_ensaios():
    if not pasta_existe(PASTA_ENSAIOS, "ensaios"):
        return

    slugs = sorted(f.stem for f in PASTA_ENSAIOS.iterdir() if f.suffix == ".html")
    itens = [
        {"slug": slug, "titulo": slug.replace("-", " ").capitalize()} for slug in slugs
    ]
    salvar_json(PASTA_ENSAIOS / "index.json", itens)
    print(f"  {len(itens)} ensaios indexados.")


# ─── MAIN ─────────────────────────────────────────────────────────────────────


def main():
    print(f"Raiz detectada: {RAIZ}\n")
    indexar_diario()
    indexar_arquivos()
    indexar_definicoes()
    indexar_ensaios()
    print("\nÍndices atualizados.")


if __name__ == "__main__":
    main()
