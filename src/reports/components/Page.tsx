import React from 'react';

interface PageProps {
  title: string;
  children: React.ReactNode;
}

export function Page({
  title,
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
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            {children}
          </td>
        </tr>
      </tbody>
    </table>
  )
}
