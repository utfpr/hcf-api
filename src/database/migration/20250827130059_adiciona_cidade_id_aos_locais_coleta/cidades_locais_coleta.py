import pandas as pd
import unicodedata

# Função para normalizar strings (sem acentos, maiúsculo, strip)
def normalize(s):
    if pd.isna(s):
        return ""
    return ''.join(
        c for c in unicodedata.normalize('NFD', str(s))
        if unicodedata.category(c) != 'Mn'
    ).strip().upper()

# Mapeamento de siglas para nomes de estados
sigla_to_nome = {
    "AC": "ACRE",
    "AL": "ALAGOAS",
    "AM": "AMAZONAS",
    "AP": "AMAPA",
    "BA": "BAHIA",
    "CE": "CEARA",
    "DF": "DISTRITO FEDERAL",
    "ES": "ESPIRITO SANTO",
    "GO": "GOIAS",
    "MA": "MARANHAO",
    "MG": "MINAS GERAIS",
    "MS": "MATO GROSSO DO SUL",
    "MT": "MATO GROSSO",
    "PA": "PARA",
    "PB": "PARAIBA",
    "PE": "PERNAMBUCO",
    "PI": "PIAUI",
    "PR": "PARANA",
    "RJ": "RIO DE JANEIRO",
    "RN": "RIO GRANDE DO NORTE",
    "RO": "RONDONIA",
    "RR": "RORAIMA",
    "RS": "RIO GRANDE DO SUL",
    "SC": "SANTA CATARINA",
    "SE": "SERGIPE",
    "SP": "SAO PAULO",
    "TO": "TOCANTINS"
}

# Carregar arquivos
locais_df = pd.read_csv("cdd/LOCAIS_COLETA_FIREBIRD.csv")
cidades_df = pd.read_csv("cdd/CIDADES_ESTADOS_PAISES_MYSQL.csv")

# Normalizar colunas relevantes
locais_df["CIDADE_NORM"] = locais_df["CIDADE"].apply(normalize)
locais_df["ESTADO_NORM"] = locais_df["ESTADO"].apply(normalize).replace(sigla_to_nome)
locais_df["PAIS_NORM"]   = locais_df["PAIS"].apply(normalize)

cidades_df["CIDADE_NORM"] = cidades_df["cidade_nome"].apply(normalize)
cidades_df["ESTADO_NORM"] = cidades_df["estado_nome"].apply(normalize)
cidades_df["PAIS_NORM"]   = cidades_df["pais_nome"].apply(normalize)

# Resultado final
resultados = []

for _, row in locais_df.iterrows():
    codigo = row["CODIGO"]
    cidade = row["CIDADE_NORM"]
    estado = row["ESTADO_NORM"]
    pais   = row["PAIS_NORM"]

    # Procurar cidade no CSV do MySQL
    match = cidades_df[
        (cidades_df["CIDADE_NORM"] == cidade) &
        (cidades_df["ESTADO_NORM"] == estado) &
        (cidades_df["PAIS_NORM"] == pais)
    ]
    
    if pais != "BRASIL" or estado not in sigla_to_nome.values():
        estado = "NI"
    
    if not match.empty:
        cidade_id = match.iloc[0]["cidade_id"]
        resultados.append([codigo, cidade_id, None, pais])
        print(f"[OK] {row['CIDADE']} ({estado}, {pais}) → ID {cidade_id}")
    else:
        resultados.append([codigo, "NI", estado, pais])
        print(f"[FALHOU] {row['CIDADE']} ({estado}, {pais}) → Não encontrado!")

# Criar DataFrame final
final_df = pd.DataFrame(resultados, columns=["CODIGO", "CIDADE", "ESTADO", "PAIS"])
final_df.to_csv("cdd/locais_traduzidos.csv", index=False)

print("\nProcessamento concluído! Arquivo salvo como LOCAIS_TRADUZIDOS.csv")
