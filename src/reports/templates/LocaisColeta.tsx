import React from "react";
import { Page } from "../components/Page";

function obterSiglaDoEstado(estado: string) {
  if (!estado) return '';

  switch (estado.trim().toLowerCase()) {
    case 'acre': return 'AC';
    case 'alagoas': return 'AL';
    case 'amapá':
    case 'amapa': return 'AP';
    case 'amazonas': return 'AM';
    case 'bahia': return 'BA';
    case 'ceará':
    case 'ceara': return 'CE';
    case 'distrito federal': return 'DF';
    case 'espírito santo':
    case 'espirito santo': return 'ES';
    case 'goiás':
    case 'goias': return 'GO';
    case 'maranhão':
    case 'maranhao': return 'MA';
    case 'mato grosso': return 'MT';
    case 'mato grosso do sul': return 'MS';
    case 'minas gerais': return 'MG';
    case 'pará':
    case 'para': return 'PA';
    case 'paraíba':
    case 'paraiba': return 'PB';
    case 'paraná':
    case 'parana': return 'PR';
    case 'pernambuco': return 'PE';
    case 'piauí':
    case 'piaui': return 'PI';
    case 'rio de janeiro': return 'RJ';
    case 'rio grande do norte': return 'RN';
    case 'rio grande do sul': return 'RS';
    case 'rondônia':
    case 'rondonia': return 'RO';
    case 'roraima': return 'RR';
    case 'santa catarina': return 'SC';
    case 'são paulo':
    case 'sao paulo': return 'SP';
    case 'sergipe': return 'SE';
    case 'tocantins': return 'TO';

    default: return estado;
  }
}

interface Registro {
  hcf: number;
  data_coleta_ano: number;
  data_coleta_mes: number;
  data_coleta_dia: number;
  especy: {
    nome: string;
    genero: {
      nome: string;
    }
    familia: {
      nome: string;
    }
  }
  coordenadasFormatadas: string;
}

interface LocaisColeta {
  estado: string;
  municipio: string;
  local: string;
  registros: Registro[];
  quantidadeRegistros: number;
}

interface RelacaoLocaisColetaProps {
  dados: LocaisColeta[];
  total?: number;
  textoFiltro?: string;
}

function RelacaoLocaisColeta({ dados, total, textoFiltro }: RelacaoLocaisColetaProps) {
  const renderTotalizador = (geral: boolean, qtd?: number) => {
    return (
      <div style={{ marginTop: '1em', borderTop: '1px solid #000', paddingTop: '0.5em' }}>
        Total {geral ? 'geral' : 'do local'}: {geral ? total : qtd}
      </div>
    )
  }

  const criaData = (registro: Registro) => {
    const { data_coleta_ano, data_coleta_mes, data_coleta_dia } = registro;
    const romanoMeses = [
      'I', 'II', 'III', 'IV', 'V', 'VI',
      'VII', 'VIII', 'IX', 'X', 'XI', 'XII'
    ];
    return `${data_coleta_dia}/${romanoMeses[data_coleta_mes - 1]}/${data_coleta_ano}`;
  }

  const obtemCordenadas = (registro: Registro) => {
    const { coordenadasFormatadas } = registro;
    if (!coordenadasFormatadas) return { latitude: '', longitude: '' };
    const [latitude, longitude] = coordenadasFormatadas.split(',');
    return {
      latitude: latitude ? latitude.trim() : '',
      longitude: longitude ? longitude.trim() : ''
    };
  }

  const renderTable = (registros: Registro[]) => {
    return (
      <table>
        <thead>
          <tr>
            <th>Data Coleta</th>
            <th>Família</th>
            <th>Espécie</th>
            <th>Latitude</th>
            <th>Longitude</th>
            <th style={{ textAlign: 'right' }}>Nº do Tombo</th>
          </tr>
        </thead>
        <tbody>
          {registros.map((item, i) => {
            const { especy } = item;
            const cordenadas = obtemCordenadas(item);
            return (
              <tr key={`${i}-${item.hcf}`}>
                <td>{criaData(item)}</td>
                <td>{especy.familia.nome}</td>
                <td style={{ fontStyle: 'italic' }}>{especy.genero.nome} {especy.nome}</td>
                <td>{cordenadas.latitude}</td>
                <td>{cordenadas.longitude}</td>
                <td style={{ textAlign: 'right' }}>{item.hcf}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }

  const renderItem = (item: LocaisColeta) => {
    return (
      <div>
        <div key={item.local} id="grupoLocalColeta">
          <div>
            <h1>UF.: {obterSiglaDoEstado(item.estado)}</h1>
          </div>
          <div>
            <h1>Município: {item.municipio}</h1>
          </div>
          <div>
            <h1>Local: {item.local}</h1>
          </div>
        </div>
        {renderTable(item.registros)}
        {renderTotalizador(false, item.quantidadeRegistros)}
      </div>
    )
  }

  return (
    <Page title="Relação de Locais de Coleta" textoFiltro={textoFiltro}>
      {dados.map(renderItem)}
      {renderTotalizador(true)}
    </Page>
  )
}

export default RelacaoLocaisColeta
