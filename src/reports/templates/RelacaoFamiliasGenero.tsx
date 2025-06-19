import React from "react";
import { Page } from "../components/Page";

interface Tombo {
  genero: string;
  especie: string;
  quantidade: number;
}

interface RelacaoTombosProps {
  dados: {
    familiaCodigo: number;
    familia: string;
    total: number;
    especies: Tombo[];
  }[];
  total?: number;
  textoFiltro?: string;
}

function RelacaoFamiliasGenero({ dados, textoFiltro }: RelacaoTombosProps) {
  const renderTotalizador = (totalFamilia: number) => {
    if (!totalFamilia) return <div/>;
    return (
      <div style={{ marginTop: '1em', borderTop: '1px solid #000', paddingTop: '0.5em' }}>
        Total família: {totalFamilia}
      </div>
    )
  }

  const renderItem = (item: Tombo) => {
    return (
      <tr key={Math.random()}>
        <td>{item?.genero || '-'}</td>
        <td style={{ fontStyle: 'italic' }}>{item?.especie || '-'}</td>
        <td style={{ textAlign: 'right' }}>{item.quantidade}</td>
      </tr>
    )
  }

  return (
    <Page title="Relação de Família e Gêneros" textoFiltro={textoFiltro}>
      {dados.map(familia => (
        <div style={{ marginBottom: '2em', width: '100%' }} key={familia.familiaCodigo}>
          <h3 style={{ textAlign: 'left', margin: 0, padding: 0 }}>Código da família: {familia.familiaCodigo}</h3>
          <h3 style={{ textAlign: 'left', margin: 0, padding: 0 }}>Nome da família: {familia.familia}</h3>
          <table>
            <thead>
              <tr>
                <th>Gênero</th>
                <th>Espécie</th>
                <th style={{ textAlign: 'right' }}>Quantidade</th>
              </tr>
            </thead>
            <tbody>
              {familia.especies.map(item => renderItem(item))}
            </tbody>
          </table>
          {renderTotalizador(familia.total)}
        </div>
      ))}
    </Page>
  )
}

export default RelacaoFamiliasGenero
