import React from "react";
import { Page } from "../components/Page";

interface Tombo {
  data: string;
  familia: string;
  especie: string;
  autor: string;
  tombo: string;
}

interface RelacaoTombosProps {
  dados: Tombo[];
  total?: number;
}

function RelacaoTombos({ dados, total }: RelacaoTombosProps) {
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
        <td>{item.data}</td>
        <td>{item.familia}</td>
        <td style={{ fontStyle: 'italic' }}>{item.especie}</td>
        <td>{item.tombo}</td>
      </tr>
    )
  }

  return (
    <Page title="Relação de Tombos">
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Família</th>
            <th>Espécie</th>
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

export default RelacaoTombos
