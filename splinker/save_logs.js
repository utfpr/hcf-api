const { Client } = require('pg');

async function main() {
  // Ler os logs do stdin
  let logData = '';
  process.stdin.setEncoding('utf8');

  for await (const chunk of process.stdin) {
    logData += chunk;
  }

  // Determinar se houve sucesso
  const isSuccess = logData.includes('Transmission completed successfully') || 
                    /Success:\s*[1-9]/.test(logData);

  // Configurar conexão com o banco de dados
  const client = new Client({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
  });

  try {
    await client.connect();

    // Buscar max_tombo_hcf
    const res = await client.query('SELECT MAX(hcf) as max_hcf FROM tombos');
    const maxTomboHcf = res.rows[0].max_hcf;

    // Inserir os logs
    const insertQuery = `
      INSERT INTO splinker_logs (max_tombo_hcf, sucesso, log_saida)
      VALUES ($1, $2, $3)
    `;
    await client.query(insertQuery, [maxTomboHcf, isSuccess, logData]);
    
    console.log('Logs salvos com sucesso na tabela splinker_logs.');

  } catch (error) {
    console.error('Erro ao salvar os logs:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
