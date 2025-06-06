import React from "react";
import { Page } from "../components/Page";

interface Tombo {
  numeroColeta: string;
  data: string;
  familia: string;
  especie: string;
  autor: string;
  tombo: string;
}

interface RelacaoTombosProps {
  dados: Tombo[];
  total?: number;
  textoFiltro?: string;
}

function RelacaoTombosComColeta({ dados, total, textoFiltro }: RelacaoTombosProps) {
  const renderTotalizador = () => {
    if (!total) return <div/>;
    return (
      <div style={{ marginTop: '1em', borderTop: '1px solid #000', paddingTop: '0.5em' }}>
        Total: {total}
      </div>
    )
  }

  const renderItem = (item: Tombo) => {
    return (
      <tr key={item.tombo}>
        <td>{item.numeroColeta}</td>
        <td>{item.data}</td>
        <td>{item.familia}</td>
        <td style={{ fontStyle: 'italic' }}>{item.especie}</td>
        <td>{item.autor}</td>
        <td style={{ textAlign: 'right' }}>{item.tombo}</td>
      </tr>
    )
  }

  return (
    <Page title="Relação de Tombos" textoFiltro={textoFiltro}>
      <table>
        <thead>
          <tr>
            <th>Coleta</th>
            <th>Data</th>
            <th>Família</th>
            <th>Espécie</th>
            <th>Autor</th>
            <th>Tombo</th>
          </tr>
        </thead>
        <tbody>
          {dados.map(renderItem)}
        </tbody>
      </table>
      {renderTotalizador()}
    </Page>
  )
}

export default RelacaoTombosComColeta
