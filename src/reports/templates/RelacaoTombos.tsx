import React from "react";
import { Page } from "../components/Page";

interface Tombo {
  dataColeta: string;
  familia: string;
  especie: string;
  hcf: string;
}

interface RelacaoTombosProps {
  tombos: Tombo[]
}

function RelacaoTombos({ tombos }: RelacaoTombosProps) {

  const renderItem = (item: Tombo) => {
    return (
      <tr key={item.hcf}>
        <td>{item.dataColeta}</td>
        <td>{item.familia}</td>
        <td style={{ fontStyle: 'italic' }}>{item.especie}</td>
        <td>{item.hcf}</td>
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
          {tombos.map(renderItem)}
        </tbody>
      </table>
    </Page>
  )
}

export default RelacaoTombos
