import { Knex } from "knex";
import { parseFile } from "fast-csv";

export async function run(knex: Knex): Promise<void> {
  await knex.transaction(async (trx) => {
    await trx.raw(`
      ALTER TABLE tombos 
      ADD COLUMN exsicata_tipo ENUM('UNICATA', 'DUPLICATA') NULL;
    `);

    const rows = parseFile(
      "src/database/20250816024121_add_exsicata_tipo/tombo_exsicata_tipo.csv",
      { headers: true }
    ).on("error", (error) => console.error(error));

    for await (const row of rows) {
      const { id, tombo_tipo } = row;

      if (!tombo_tipo) continue;

      console.log(`Updating tombo ${id} with exsicata_tipo ${tombo_tipo}`);

      await trx("tombos")
        .where({ hcf: id })
        .update({ exsicata_tipo: tombo_tipo });
    }
  });
}
