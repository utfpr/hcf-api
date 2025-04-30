import React from "react";
import { Page } from "../components/Page";

interface DadosProps {
  familia: string;
  especies: EspeciesProps[];
}

interface EspeciesProps {
  especie: string;
  tombos: string;
  quantidadeDeTombos: number;
}

interface InventarioEspeciesProps {
  dados: DadosProps[]
}

function InventarioEspecies({ dados }: InventarioEspeciesProps) {
  return (
    <Page title="Relatório de Inventário de Espécies">
      {dados.map((grupo) => (
        <div key={grupo.familia} id="grupoComBorda">
          <div id="nomeGrupoContainer">
            <h1 id="nomeGrupo"><b>Família: </b>{grupo.familia}</h1>
          </div>

          <table>
            <thead>
              <tr id="tabelaComBordaSimples">
                <th id="col1">Espécie</th>
                <th id="col2">Tombos relacionados</th>
              </tr>
            </thead>
            <tbody>
              {grupo.especies.map((especie, i) => (
                <tr key={especie.tombos} style={{ backgroundColor: i % 2 === 0 ? '#F5F5F5' : 'white' }}>
                  <td>{especie.especie}</td>
                  <td>{especie.tombos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </Page>
  )
}

export default InventarioEspecies
