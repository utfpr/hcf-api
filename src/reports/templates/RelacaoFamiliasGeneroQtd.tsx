import React from "react";
import { Page } from "../components/Page";

interface Tombo {
  nome: string;
  quantidade: number;
}

interface RelacaoTombosProps {
  dados: {
    codigo: number;
    familia: string;
    generos: Tombo[];
  }[];
  total?: number;
  textoFiltro?: string;
}

function RelacaoFamiliasGeneroQtd({ dados, textoFiltro }: RelacaoTombosProps) {
  const renderItem = (item: Tombo) => {
    return (
      <tr key={Math.random()}>
        <td style={{ fontStyle: 'italic' }}>{item?.nome || '-'}</td>
        <td style={{ textAlign: 'right' }}>{item.quantidade}</td>
      </tr>
    )
  }

  return (
    <Page title="Relação de Família e Gêneros" textoFiltro={textoFiltro}>
      {dados.map(familia => (
        <div style={{ marginBottom: '2em', width: '100%' }} key={familia.codigo}>
          <h3 style={{ textAlign: 'left', margin: 0, padding: 0 }}>Total família: {familia.generos.reduce((acc, curr) => acc + curr.quantidade, 0)}</h3>
          <h3 style={{ textAlign: 'left', margin: 0, padding: 0 }}>Nome da família: {familia.familia}</h3>
          <table>
            <thead>
              <tr>
                <th style={{ width: '50%' }}>Gênero</th>
                <th style={{ textAlign: 'right', width: '30%' }}>Quantidade</th>
              </tr>
            </thead>
            <tbody>
              {familia.generos.map(item => renderItem(item))}
            </tbody>
          </table>
        </div>
      ))}
    </Page>
  )
}

export default RelacaoFamiliasGeneroQtd;
