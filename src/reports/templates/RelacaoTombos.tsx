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
  dados: Tombo[]
}

function RelacaoTombos({ dados }: RelacaoTombosProps) {

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
    </Page>
  )
}

export default RelacaoTombos
