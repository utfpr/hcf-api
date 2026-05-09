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

  const renderTabelaTombos = (tombos: TomboItem[]) => (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', marginTop: '0.25em' }}>
      <colgroup>
        <col style={{ width: '8%' }} />
        <col style={{ width: '36%' }} />
        <col style={{ width: '18%' }} />
        <col style={{ width: '18%' }} />
        <col style={{ width: '20%' }} />
      </colgroup>
      <thead>
        <tr style={{ backgroundColor: '#e0e0e0' }}>
          <th style={{ textAlign: 'right', padding: '4px 6px', borderBottom: '1px solid #aaa' }}>HCF</th>
          <th style={{ textAlign: 'left', padding: '4px 6px', borderBottom: '1px solid #aaa' }}>Nome Científico</th>
          <th style={{ textAlign: 'left', padding: '4px 6px', borderBottom: '1px solid #aaa' }}>Latitude</th>
          <th style={{ textAlign: 'left', padding: '4px 6px', borderBottom: '1px solid #aaa' }}>Longitude</th>
          <th style={{ textAlign: 'left', padding: '4px 6px', borderBottom: '1px solid #aaa' }}>Motivo</th>
        </tr>
      </thead>
      <tbody>
        {tombos.map((tombo, i) => (
          <tr
            key={`${i}-${tombo.hcf}`}
            style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f5f5f5' }}
          >
            <td style={{ textAlign: 'right', padding: '3px 6px' }}>{tombo.hcf}</td>
            <td style={{ fontStyle: 'italic', padding: '3px 6px' }}>{tombo.nome_cientifico || '—'}</td>
            <td style={{ padding: '3px 6px' }}>{formatCoord(tombo.latitude)}</td>
            <td style={{ padding: '3px 6px' }}>{formatCoord(tombo.longitude)}</td>
            <td style={{ padding: '3px 6px' }}>{renderMotivo(tombo.motivo)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderCidade = (cidade: CidadeGroup, estadoSigla: string) => (
    <div
      key={`${estadoSigla}-${cidade.cidade}`}
      style={{ marginBottom: '1.25em', pageBreakInside: 'avoid' }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#d4d4d4',
        padding: '0.3em 0.6em',
        borderRadius: '3px',
        marginBottom: '0.2em',
      }}>
        <span style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
          Município: {cidade.cidade}
        </span>
        <span style={{ fontSize: '0.7rem', color: '#555' }}>
          {cidade.tombos.length} tombo(s)
        </span>
      </div>
      {renderTabelaTombos(cidade.tombos)}
    </div>
  );

  const renderEstado = (estado: EstadoGroup) => {
    const totalTombos = estado.cidades.reduce((acc, c) => acc + c.tombos.length, 0);
    return (
      <div key={estado.estado} style={{ marginBottom: '2em' }}>
        <div style={{
          backgroundColor: '#444',
          color: '#ffffff',
          padding: '0.4em 0.6em',
          borderRadius: '3px',
          marginBottom: '0.6em',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
            {estado.estado} ({estado.sigla})
          </span>
          <span style={{ fontSize: '0.75rem' }}>
            {totalTombos} tombo(s)
          </span>
        </div>
        {estado.cidades.map(cidade => renderCidade(cidade, estado.sigla))}
      </div>
    );
  };

  return (
    <Page title="Relatório de Coordenadas Fora do Município">
      {dados.map(renderEstado)}
      <div style={{
        marginTop: '1.5em',
        paddingTop: '0.5em',
        borderTop: '1px solid #555',
        fontSize: '0.75rem',
        fontWeight: 'bold',
      }}>
        Total geral: {total || 0} registro(s)
      </div>
    </Page>
  );
}

export default RelatorioCoordenadaForaPoligono;
