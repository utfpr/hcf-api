import wkhtmltopdf from 'wkhtmltopdf';

const header = (tipoRelatorio, textoFiltro, data) =>
    `
    <div>
        <div  class="col-xs-12"> 
            <h6><b>HCF</b></h6>
        </div>      
        <div  class="col-xs-12"> 
            <h6><b>${tipoRelatorio}</b></h6>
        </div>  
        ${textoFiltro ? `<div  class="col-xs-12"><h6><b>${textoFiltro}</b></h6></div>` : ''}
        <div  class="col-xs-12"> 
            <h6><b>Data: ${data}</b></h6>
        </div>   
    </div>
    <br>
`;

const tableFormato1 = dados => `
    <div class="home" style="width:100%">
        <table class='table striped'>
        <thead>
            <tr>
                <th style="font-size: 12px; width: 10%;">Data</th>
                <th style="font-size: 12px;">Família</th>
                <th style="font-size: 12px;">Espécie</th>
                <th style="font-size: 12px;">Autor</th>
                <th style="font-size: 12px; width: 10%;">Tombo</th>
            </tr>
        </thead>
        <tbody>
            ${dados.map(dado => `
                <tr>
                    <td style="font-size: 12px;">${dado.data}</td>
                    <td style="vertical-align: middle; font-size: 12px;">${dado.familia}</td>
                    <td style="vertical-align: middle; font-size: 12px;">${dado.especie}</td>
                    <td style="vertical-align: middle; font-size: 12px;">${dado.autor}</td>
                    <td style="vertical-align: middle; font-size: 12px;">${dado.tombo}</td>
                </tr>
            `).join('')}
        </tbody>
        </table>
    </div>
    `;

const tableFormato2 = dados => `
    <div class="home" style="width:100%">
        ${dados.map(dado => `
            <div class="rounded avoid" style="width:100%">
                <div class="row" style="background-color: #D3D3D3;padding: 3px;">
                    <div class="col-xs-4">
                        <p style="font-size: 12px;"><b>Família: </b>${dado.familia}</p>
                    </div>
                    <div class="col-xs-4"></div>
                    <div class="col-xs-4"></div>
                </div>
                ${dado.especies.length > 0 ? `
                    <table class='table striped'>
                        <thead>
                            <tr>
                                <th style="font-size: 12px;">Espécie</th>
                                <th style="font-size: 12px;">Tombos relacionados</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${dado.especies.map(({ especie, tombos }) => `
                                <tr>
                                    <td style="font-size: 12px;">${especie}</td>
                                    <td style="vertical-align: middle; font-size: 12px;">${tombos}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : '<p style="font-size: 12px; text-align: center;">Nenhuma espécie encontrada</p>'}
            </div>
            <br/>
        `).join('')}
    </div>
    `;

const template1 = (tipoDoRelatorio, textoFiltro, data, dados, tableFormato, adicionarTotalizador, total) =>
    `<html>
        <head>
            <meta content="text/html; charset=utf-8" http-equiv="Content-Type">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/metro/4.1.5/css/metro.min.css" type="text/css">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/flexboxgrid/6.3.1/flexboxgrid.min.css" type="text/css" >
            <style>
                .rounded {
                    border-radius: 25px;
                    border: 2px solid gray;
                    padding: 10px; 
                    padding-top: 5px;
                    width: 100%;
                    }

                    .home > .avoid.rounded {
                    page-break-inside: auto;
                    }

                    
                    .home > .avoid.rounded ~ .avoid.rounded {
                    page-break-inside: avoid;
                    }
            </style>
        </head>
    <body>
        ${header(tipoDoRelatorio, textoFiltro, data)}
        ${tableFormato === 1 ? tableFormato1(dados) : ''}
        ${tableFormato === 2 ? tableFormato2(dados) : ''}
        ${adicionarTotalizador ? `
            <div class="row" style="border-top: 1px solid black; padding-top: 5px;">
                <div class="col-xs-4">
                    <p style="font-size: 16px;"><b>Total: </b>${total}</p>
                </div>
                <div class="col-xs-4"></div>
                <div class="col-xs-4"></div>
            </div>
        ` : ''}
    </body>
    </html>`;

const gerarRelatorioPDF = async (res, {
    tipoDoRelatorio,
    textoFiltro,
    data,
    dados,
    tableFormato,
    adicionarTotalizador,
    total,
}) => {
    res.setHeader('Content-Disposition', 'attachment; filename=relatorio.pdf');
    res.setHeader('Content-Type', 'application/pdf');

    wkhtmltopdf(
        template1(tipoDoRelatorio, textoFiltro, data, dados, tableFormato, adicionarTotalizador, total),
        { pageSize: 'A4', encoding: 'utf-8' }
    ).pipe(res);
};
const gerarRelatorioVendas2 = () => {};

export { gerarRelatorioPDF, gerarRelatorioVendas2 };
