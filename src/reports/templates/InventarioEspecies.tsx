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
        <div key={grupo.familia} className="grupoComBorda">

          <table>
            <thead>
              <tr className="nomeGrupoContainer">
                <th className="nomeGrupo" colSpan={2}><b>Família: </b>{grupo.familia}</th>
              </tr>
              <tr className="tabelaComBordaSimples">
                <th className="col1">Espécie</th>
                <th className="col2">Tombos relacionados</th>
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
