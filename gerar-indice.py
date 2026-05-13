import os, json

# ── Diário: lista de slugs de data, mais recente primeiro ──
pasta_diario = './fragmentos/transmissoes/diario/entradas'
entradas = sorted(
    [f.replace('.html', '') for f in os.listdir(pasta_diario)
     if f.endswith('.html')],
    reverse=True
)
with open(os.path.join(pasta_diario, 'index.json'), 'w') as f:
    json.dump(entradas, f, indent=2)
print(f'{len(entradas)} entradas do diário indexadas.')

# ── Notas/arquivos: slug + titulo vem do nome do arquivo ──
pasta_arquivos = './fragmentos/transmissoes/notas/arquivos'
arquivos = sorted(
    [f.replace('.html', '') for f in os.listdir(pasta_arquivos)
     if f.endswith('.html')]
)
itens_arquivos = [
    {"slug": slug, "titulo": slug.replace('-', ' ').capitalize()}
    for slug in arquivos
]
with open(os.path.join(pasta_arquivos, 'index.json'), 'w') as f:
    json.dump(itens_arquivos, f, indent=2, ensure_ascii=False)
print(f'{len(itens_arquivos)} notas indexadas.')

# ── Notas/definicoes: slug + termo vem do nome do arquivo ──
pasta_def = './fragmentos/transmissoes/notas/definicoes'
defs = sorted(
    [f.replace('.html', '') for f in os.listdir(pasta_def)
     if f.endswith('.html')]
)
itens_def = [
    {"slug": slug, "termo": slug.replace('-', ' ').lower()}
    for slug in defs
]
with open(os.path.join(pasta_def, 'index.json'), 'w') as f:
    json.dump(itens_def, f, indent=2, ensure_ascii=False)
print(f'{len(itens_def)} definições indexadas.')

# ── Notas/analises: slug + titulo vem do nome do arquivo ──
pasta_analises = './fragmentos/transmissoes/notas/analises'
analises = sorted(
    [f.replace('.html', '') for f in os.listdir(pasta_analises)
     if f.endswith('.html')]
)
itens_analises = [
    {"slug": slug, "titulo": slug.replace('-', ' ').capitalize()}
    for slug in analises
]
with open(os.path.join(pasta_analises, 'index.json'), 'w') as f:
    json.dump(itens_analises, f, indent=2, ensure_ascii=False)
print(f'{len(itens_analises)} análises indexadas.')