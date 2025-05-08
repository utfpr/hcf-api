import React from 'react';

interface PageProps {
  title: string;
  children: React.ReactNode;
  textoFiltro?: string;
}

export function Page({
  title,
  textoFiltro,
  children
}: PageProps) {
  return (
    <table>
      <thead>
        <tr>
          <th>
            <h1>
              HCF<br />
              Herbário da Universidade Tecnológica Federal do Paraná - Campus Campo Mourão
            </h1>
            <h2>{title}</h2>
            <div style={{ textAlign: 'right', display: 'flex' }}>
              {textoFiltro && <span>{textoFiltro}</span>}
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="content-container">
            {children}
          </td>
        </tr>
      </tbody>
    </table>
  )
}
