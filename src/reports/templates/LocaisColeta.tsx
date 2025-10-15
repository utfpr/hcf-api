import React from "react";
import { Page } from "../components/Page";

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
  familia: {
    nome: string;
  }
  genero: {
    nome: string;
  }
  coordenadasFormatadas: string;
}

interface LocaisColeta {
  estado: string;
  estadoSigla: string;
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
            const { especy, familia, genero } = item;
            const cordenadas = obtemCordenadas(item);
            return (
              <tr key={`${i}-${item.hcf}`}>
                <td>{criaData(item)}</td>
                <td>{familia?.nome}</td>
                <td style={{ fontStyle: 'italic' }}>{genero?.nome} {especy?.nome}</td>
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
        <div key={item.local} className="grupoLocalColeta">
          <div>
            <h1>UF.: {item.estadoSigla}</h1>
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
