import React from "react";
import { Page } from "../components/Page";

interface TomboItem {
  hcf: number;
  latitude: number | null;
  longitude: number | null;
  nome_cientifico: string | null;
  motivo: string;
}

interface CidadeGroup {
  cidade: string;
  tombos: TomboItem[];
}

interface EstadoGroup {
  estado: string;
  sigla: string;
  cidades: CidadeGroup[];
}

interface RelatorioCoordenadaForaPoligonoProps {
  dados: EstadoGroup[];
  total?: number;
}

function renderMotivo(motivo: string) {
  switch (motivo) {
    case 'SEM_COORDENADA':
      return 'Sem coordenada';
    case 'SEM_POLIGONO':
      return 'Sem polígono';
    case 'FORA_DO_POLIGONO':
      return 'Fora do polígono';
    default:
      return motivo;
  }
}

function formatCoord(val: number | null | undefined): string {
  if (val === null || val === undefined) return '—';
  return val.toFixed(6);
}

function RelatorioCoordenadaForaPoligono({ dados, total }: RelatorioCoordenadaForaPoligonoProps) {

  const renderTable = (tombos: TomboItem[]) => {
    return (
      <table>
        <thead>
          <tr>
            <th>HCF</th>
            <th>Nome Científico</th>
            <th>Latitude</th>
            <th>Longitude</th>
            <th>Motivo</th>
          </tr>
        </thead>
        <tbody>
          {tombos.map((tombo, i) => (
            <tr key={`${i}-${tombo.hcf}`}>
              <td style={{ textAlign: 'right' }}>{tombo.hcf}</td>
              <td style={{ fontStyle: 'italic' }}>{tombo.nome_cientifico || '—'}</td>
              <td>{formatCoord(tombo.latitude)}</td>
              <td>{formatCoord(tombo.longitude)}</td>
              <td>{renderMotivo(tombo.motivo)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderCidade = (cidade: CidadeGroup, estadoKey: string) => {
    return (
      <div key={`${estadoKey}-${cidade.cidade}`} style={{ marginBottom: '1em' }}>
        <h3 style={{ margin: '0.5em 0' }}>Município: {cidade.cidade} ({cidade.tombos.length} tombo(s))</h3>
        {renderTable(cidade.tombos)}
      </div>
    );
  };

  const renderEstado = (estado: EstadoGroup) => {
    const totalTombos = estado.cidades.reduce((acc, c) => acc + c.tombos.length, 0);
    return (
      <div key={estado.estado} style={{ marginBottom: '1.5em' }}>
        <h1 style={{ borderBottom: '2px solid #000', paddingBottom: '0.3em' }}>
          {estado.estado} ({estado.sigla}) — {totalTombos} tombo(s)
        </h1>
        {estado.cidades.map(cidade => renderCidade(cidade, estado.estado))}
      </div>
    );
  };

  return (
    <Page title="Relatório de Coordenadas Fora do Município">
      {dados.map(renderEstado)}
      <div style={{ marginTop: '1em', borderTop: '1px solid #000', paddingTop: '0.5em' }}>
        Total geral: {total || 0} registro(s)
      </div>
    </Page>
  );
}

export default RelatorioCoordenadaForaPoligono;
