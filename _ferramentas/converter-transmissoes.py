#!/usr/bin/env python3
"""
converter-transmissoes.py — conversão em lote HTML (vanilla) → MDX (F2c).

Lê os fragmentos HTML de fragmentos/transmissoes/{diario,notas} e escreve as
entradas correspondentes em src/content/{diario,notas/...} como .mdx, com o
frontmatter mínimo por collection. Emite um RELATÓRIO DE DIVERGÊNCIAS ao final
— nada é resolvido em silêncio; a decisão editorial é do Bruno.

Regras (ver REFUNDACAO.md F2/[021]/[025]):
  - wrappers de casca caem (entrada-data/entrada-corpo, article, .conteudo,
    .secao, #ensaio-full-*); viram responsabilidade do layout na F2d;
  - <p> sem classe -> parágrafo markdown; <p class="..."> preservado verbatim
    (a classe carrega estilo — focus-callout, nota-citacao, codex, tese...);
  - inline (<span>, <code>, <a>, <br/>, entidades) preservado verbatim;
  - <h2> -> "## "; <h3> de conteúdo -> "### "; o <h3> título das definições cai
    (vira o campo `termo`);
  - blocos WebGL (.bloco-webgl) NÃO entram no MDX: viram <Componente/> importado
    (padrão de inserção — os componentes são escritos à mão);
  - math:true onde houver class="mat"; webgl:true onde houver .bloco-webgl.

NÃO commita nada: escreve os .mdx para revisão do Bruno, entrada por entrada.
"""

from __future__ import annotations
import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
VANILLA = RAIZ / "fragmentos" / "transmissoes"
DESTINO = RAIZ / "src" / "content"

# Componentes WebGL (escritos à mão) por slug de origem.
WEBGL_COMPONENTE = {
    "vesica-piscis": ("VesicaPiscis", "../../../components/artefatos/VesicaPiscis.astro"),
    "2026-05-15": ("VortexEspiral", "../../components/artefatos/VortexEspiral.astro"),
}

divergencias: list[str] = []
relatorio_webgl: list[str] = []


# ── util de blocos ──────────────────────────────────────────────────────────

TAG_RE = re.compile(
    r'<(/?)([a-zA-Z][\w-]*)((?:[^<>"\']|"[^"]*"|\'[^\']*\')*?)(/?)>', re.S
)
VOID = {"br", "hr", "img", "input", "meta", "source"}
# Contêineres de casca cujo <div>/<article> some, mas cujos filhos sobem.
UNWRAP_CLASSES = {"conteudo", "secao", "entrada-corpo"}
UNWRAP_IDS = {"ensaio-full-header", "ensaio-full-body"}
UNWRAP_TAGS = {"article"}
INLINE = {
    "span", "code", "a", "b", "i", "em", "strong", "sub", "sup", "abbr",
    "spanc",  # typo do vanilla (psicanálise-selvagem) — tolerado como inline
}


def classe(attrs: str) -> str:
    m = re.search(r'class\s*=\s*"([^"]*)"', attrs)
    return m.group(1) if m else ""


def id_de(attrs: str) -> str:
    m = re.search(r'id\s*=\s*"([^"]*)"', attrs)
    return m.group(1) if m else ""


def norm_ws(s: str) -> str:
    """Colapsa espaços/quebras internas — o HTML do vanilla quebra tags e
    atributos em várias linhas; isso volta a uma linha só, sem alterar texto."""
    return re.sub(r"\s+", " ", s).strip()


def top_level(html: str):
    """Itera os elementos de bloco de PRIMEIRO nível de `html`, respeitando a
    profundidade de aninhamento. Gera ("el", tag, attrs, inner_raw) ou
    ("txt", texto)."""
    i = 0
    n = len(html)
    while i < n:
        m = TAG_RE.search(html, i)
        if not m:
            resto = html[i:]
            if resto.strip():
                yield ("txt", resto)
            return
        if m.start() > i:
            entre = html[i:m.start()]
            if entre.strip():
                yield ("txt", entre)
        fechando, tag, attrs, autofecha = m.group(1), m.group(2), m.group(3), m.group(4)
        tagl = tag.lower()
        if fechando or autofecha or tagl in VOID:
            # tag solta de nível superior (ex.: <br/> entre parágrafos)
            yield ("el", tagl, attrs, None)
            i = m.end()
            continue
        # elemento com corpo: acha o </tag> equilibrado
        depth = 1
        j = m.end()
        while depth > 0:
            mm = TAG_RE.search(html, j)
            if not mm:
                j = n
                break
            t2, close2, self2 = mm.group(2).lower(), mm.group(1), mm.group(4)
            if t2 == tagl and not self2 and t2 not in VOID:
                depth += 0 if close2 else 1
                depth -= 1 if close2 else 0
            j = mm.end()
        inner = html[m.end(): j - len(f"</{tag}>")] if j <= n else html[m.end():]
        yield ("el", tagl, attrs, inner)
        i = j


def raw_de(tag: str, attrs: str, inner: str | None) -> str:
    if inner is None:
        return f"<{tag}{attrs.rstrip()} />" if tag in VOID else f"<{tag}{attrs}></{tag}>"
    return f"<{tag}{attrs}>{inner}</{tag}>"


def limpar_saida(s: str) -> str:
    """Higiene de bloco: tira o espaço antes de '>' que o vanilla deixava ao
    quebrar tags em várias linhas (</span > → </span>, <br  /> → <br/>).
    A matemática ($…$) não é mais escapada: remark-math/rehype-katex a
    renderizam no build (a flag math:true só controla o CSS do KaTeX na F2d)."""
    return re.sub(r"\s+(/?)>", r"\1>", s)


def converter_blocos(html: str, slug: str, primeiro_h3_e_titulo: bool) -> list[str]:
    """Converte uma região de conteúdo numa lista de blocos MDX."""
    blocos: list[str] = []
    for item in top_level(html):
        if item[0] == "txt":
            # texto solto fora de <p> (raro) — vira parágrafo se tiver conteúdo
            t = norm_ws(item[1])
            if t and t != "&nbsp;":
                blocos.append(t)
            continue
        _, tag, attrs, inner = item
        cls = classe(attrs)
        eid = id_de(attrs)

        # WebGL: substitui pelo componente
        if "bloco-webgl" in cls:
            nome, _cam = WEBGL_COMPONENTE[slug]
            blocos.append(f"<{nome} />")
            continue

        # Contêiner de casca: desce nos filhos
        if (
            tag in UNWRAP_TAGS
            or eid in UNWRAP_IDS
            or any(c in UNWRAP_CLASSES for c in cls.split())
        ):
            blocos.extend(converter_blocos(inner or "", slug, False))
            continue

        if tag == "p":
            if cls:  # parágrafo com classe → verbatim (preserva estilo)
                blocos.append(norm_ws(raw_de(tag, attrs, inner)))
            else:
                blocos.append(norm_ws(inner or ""))
            continue

        if tag == "h2":
            blocos.append("## " + norm_ws(inner or ""))
            continue

        if tag == "h3":
            if primeiro_h3_e_titulo and not blocos:
                # é o título da definição — cai (vira `termo`), mas confere
                converter_blocos._ultimo_h3 = norm_ws(inner or "")
                continue
            blocos.append("### " + norm_ws(inner or ""))
            continue

        if tag in VOID:  # <br/> etc. solto entre blocos
            blocos.append(raw_de(tag, attrs, inner))
            continue

        # ul/ol/div.divisor/blockquote/etc. → verbatim (fiel e MDX-válido)
        blocos.append(norm_ws(raw_de(tag, attrs, inner)))
    return blocos


converter_blocos._ultimo_h3 = ""


def limpar(html: str) -> str:
    return re.sub(r"<!--.*?-->", "", html, flags=re.S)


def escrever(destino: Path, frontmatter: dict, blocos: list[str], imports: list[str]):
    destino.parent.mkdir(parents=True, exist_ok=True)
    fm = ["---"]
    for k, v in frontmatter.items():
        if isinstance(v, bool):
            fm.append(f"{k}: {'true' if v else 'false'}")
        elif isinstance(v, str):
            fm.append(f'{k}: "{v}"' if k in ("termo", "titulo") else f"{k}: {v}")
    fm.append("---")
    corpo = "\n".join(fm) + "\n"
    if imports:
        corpo += "\n" + "\n".join(imports) + "\n"
    corpo += "\n" + "\n\n".join(limpar_saida(b) for b in blocos if b) + "\n"
    destino.write_text(corpo, encoding="utf-8")


# ── diário ──────────────────────────────────────────────────────────────────

DATA_RE = re.compile(r'<div class="entrada-data">([^<]*)</div>', re.S)
CORPO_RE = re.compile(
    r'<div class="entrada-corpo([^"]*)">(.*?)</div>\s*(?=<div class="entrada-data"|$)',
    re.S,
)


def data_iso_do_nome(nome: str) -> str:
    return nome  # o nome do arquivo já é AAAA-MM-DD


def data_do_corpo(txt: str) -> tuple[str, str]:
    """Devolve (data_iso_ou_'', resto) a partir de '2023.04.12 ~ 03:00'."""
    t = txt.strip()
    m = re.match(r"(\d{4})[.\-](\d{2})[.\-](\d{2})", t)
    iso = f"{m.group(1)}-{m.group(2)}-{m.group(3)}" if m else ""
    resto = t[m.end():].strip() if m else t
    return iso, resto


def converter_diario():
    dir_ = VANILLA / "diario" / "entradas"
    pilotos = {"2026-06-01"}  # já digitado à mão pelo Bruno (2026-06-05.mdx)
    for html_file in sorted(dir_.glob("*.html")):
        slug = html_file.stem
        if slug in pilotos:
            continue
        bruto = limpar(html_file.read_text(encoding="utf-8"))
        datas = DATA_RE.findall(bruto)
        corpos = CORPO_RE.findall(bruto)
        webgl = any("bloco-webgl" in c for c, _ in corpos)

        # divergência de data (nome × corpo) — para cada bloco entrada-data
        for d in datas:
            iso, _resto = data_do_corpo(d)
            if iso and iso != slug:
                divergencias.append(
                    f"[diario/{slug}] data do nome ({slug}) ≠ data do corpo ({iso})"
                )
        if len(datas) > 1:
            divergencias.append(
                f"[diario/{slug}] arquivo com {len(datas)} sub-entradas "
                f"(horas: {', '.join(data_do_corpo(d)[1] or '—' for d in datas)}) "
                f"— decidir: um arquivo com seções, ou vários arquivos?"
            )

        imports = []
        blocos: list[str] = []
        for idx, (cls, inner) in enumerate(corpos):
            _iso, resto = data_do_corpo(datas[idx]) if idx < len(datas) else ("", "")
            hora = resto.lstrip("~ ").strip()  # "~ 03:00" → "03:00" (spec do Bruno)
            if hora:
                # cada sub-entrada abre com a hora como heading fechado
                # (### HH:MM ###); o dia sai do corpo — vem do frontmatter/layout.
                # Nota F2d: avaliar exibir os ### via CSS (pendência estética).
                blocos.append(f"### {hora} ###")
            if "bloco-webgl" in cls:
                nome, cam = WEBGL_COMPONENTE[slug]
                imports.append(f'import {nome} from "{cam}";')
                blocos.append(f"<{nome} />")
                relatorio_webgl.append(f"diario/{slug} → <{nome}/> ({cam})")
            else:
                blocos.extend(converter_blocos(inner, slug, False))

        fm = {"data": slug}
        if webgl:
            nome, cam = WEBGL_COMPONENTE[slug]
            if f'import {nome} from "{cam}";' not in imports:
                imports.append(f'import {nome} from "{cam}";')
            fm["webgl"] = True
        escrever(DESTINO / "diario" / f"{slug}.mdx", fm, blocos, imports)


# ── notas ───────────────────────────────────────────────────────────────────

def converter_notas(sub: str, campo: str):
    dir_ = VANILLA / "notas" / sub
    indice = {j["slug"]: j for j in json.loads((dir_ / "index.json").read_text("utf-8"))}
    for html_file in sorted(dir_.glob("*.html")):
        slug = html_file.stem
        bruto = limpar(html_file.read_text(encoding="utf-8"))
        webgl = "bloco-webgl" in bruto
        math = 'class="mat"' in bruto

        imports = []
        if webgl:
            nome, cam = WEBGL_COMPONENTE[slug]
            imports.append(f'import {nome} from "{cam}";')
            relatorio_webgl.append(f"notas/{sub}/{slug} → <{nome}/> ({cam})")
            # tira o bloco-webgl (o script tem '<' que quebraria o tokenizer)
            bruto = re.sub(
                r'<div class="bloco-webgl">.*?</div>', "@@WEBGL@@", bruto, flags=re.S
            )

        blocos = converter_blocos(bruto, slug, primeiro_h3_e_titulo=True)
        blocos = [f"<{WEBGL_COMPONENTE[slug][0]} />" if b == "@@WEBGL@@" else b
                  for b in blocos]

        # confere o título/termo do índice contra o <h3> do corpo
        h3 = getattr(converter_blocos, "_ultimo_h3", "")
        converter_blocos._ultimo_h3 = ""
        valor = indice.get(slug, {}).get(campo, slug.replace("-", " "))
        if h3 and h3 != valor:
            divergencias.append(
                f"[{sub}/{slug}] {campo} do índice ('{valor}') ≠ <h3> do corpo ('{h3}')"
            )

        fm = {campo: valor}
        if math:
            fm["math"] = True
        if webgl:
            fm["webgl"] = True
        escrever(DESTINO / "notas" / sub / f"{slug}.mdx", fm, blocos, imports)


def main():
    converter_diario()
    converter_notas("definicoes", "termo")
    converter_notas("ensaios", "titulo")
    converter_notas("arquivos", "titulo")

    print("=== CONVERSÃO CONCLUÍDA ===")
    print(f"MDX escritos em {DESTINO}")
    print("\n=== INSERÇÕES WEBGL (componentes a escrever à mão) ===")
    for w in relatorio_webgl:
        print("  •", w)
    print("\n=== RELATÓRIO DE DIVERGÊNCIAS (decisão do Bruno) ===")
    if not divergencias:
        print("  (nenhuma)")
    for d in divergencias:
        print("  ⚠", d)


if __name__ == "__main__":
    main()
