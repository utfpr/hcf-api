import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { ExpedicaoCollectionKnexAdapter } from "@/infrastructure/ExpedicaoCollectionKnexAdapter";

import { createTestKnex } from "../setup/app-factory";
import {
  cleanupExpedicaoFixtures,
  ExpedicaoFixtures,
  seedExpedicaoFixtures,
} from "../setup/seeds/expedicao.seed";

describe("ExpedicaoCollectionKnexAdapter - Sub-recursos (Participantes e Rotas)", () => {
  const knex = createTestKnex();
  const collection = new ExpedicaoCollectionKnexAdapter({ knex });

  let fixtures: ExpedicaoFixtures;

  beforeAll(async () => {
    fixtures = await seedExpedicaoFixtures(knex);
  });

  afterAll(async () => {
    await cleanupExpedicaoFixtures(knex, fixtures);
    await knex.destroy();
  });

  async function criarExpedicaoParaTeste(prefixo: string) {
    return collection.create({
      descricao: `Expedicao [${prefixo}] - Teste Isolado`,
      data_inicio: "2026-04-01",
      data_fim: "2026-04-10",
      cidade_id: fixtures.cidades[0],
      created_by: fixtures.usuarios[0],
      participantes: [fixtures.usuarios[0]],
      rotas: [fixtures.cidades[1]],
    });
  }

  describe("Adicionar e Remover Participantes", () => {
    test("addParticipant insere um novo usuário na expedição", async () => {
      const created = await criarExpedicaoParaTeste("ADD_PART");
      expect(created.right()).toBe(true);
      if (!created.right()) return;
      const expedicaoId = created.value.id;

      try {
        const novoParticipante = fixtures.usuarios[1];
        const result = await collection.addParticipant(
          expedicaoId,
          novoParticipante,
        );
        expect(result.right()).toBe(true);
        const banco = await knex("expedicoes_participantes")
          .where({ expedicao_id: expedicaoId, usuario_id: novoParticipante })
          .first();

        expect(banco).toBeDefined();
        expect(Number(banco.usuario_id)).toBe(novoParticipante);
      } finally {
        await knex("expedicoes").where({ id: expedicaoId }).delete();
      }
    });

    test("addParticipant falha ao tentar inserir usuário já existente (unique constraint)", async () => {
      const created = await criarExpedicaoParaTeste("ADD_FAIL_UNIQUE");
      if (!created.right()) return;
      const expedicaoId = created.value.id;

      try {
        const participanteExistente = fixtures.usuarios[0];

        const result = await collection.addParticipant(
          expedicaoId,
          participanteExistente,
        );

        expect(result.left()).toBe(true);
        if (result.left()) {
          expect(result.value.message).toContain("já está nesta expedição");
        }
      } finally {
        await knex("expedicoes").where({ id: expedicaoId }).delete();
      }
    });

    test("removeParticipant exclui o usuário da expedição", async () => {
      const created = await criarExpedicaoParaTeste("REM_PART");
      if (!created.right()) return;
      const expedicaoId = created.value.id;

      try {
        const participanteParaRemover = fixtures.usuarios[0];

        const result = await collection.removeParticipant(
          expedicaoId,
          participanteParaRemover,
        );
        expect(result.right()).toBe(true);

        const banco = await knex("expedicoes_participantes")
          .where({
            expedicao_id: expedicaoId,
            usuario_id: participanteParaRemover,
          })
          .first();

        expect(banco).toBeUndefined();
      } finally {
        await knex("expedicoes").where({ id: expedicaoId }).delete();
      }
    });
  });

  describe("Substituir Rotas", () => {
    test("substituteRoute remove as antigas e insere as novas na ordem correta", async () => {
      const created = await criarExpedicaoParaTeste("SUB_ROTAS");
      if (!created.right()) return;
      const expedicaoId = created.value.id;

      try {
        const novasRotas = [
          fixtures.cidades[2],
          fixtures.cidades[0],
          fixtures.cidades[2],
        ];

        const result = await collection.substituteRoute(
          expedicaoId,
          novasRotas,
        );
        expect(result.right()).toBe(true);

        const rotasNoBanco = await knex("expedicoes_rotas")
          .where({ expedicao_id: expedicaoId })
          .orderBy("ordem");

        expect(rotasNoBanco.length).toBe(3);

        const arrayValidacao = rotasNoBanco.map((rota) => [
          rota.ordem,
          Number(rota.cidade_id),
        ]);
        expect(arrayValidacao).toEqual([
          [0, novasRotas[0]],
          [1, novasRotas[1]],
          [2, novasRotas[2]],
        ]);
      } finally {
        await knex("expedicoes").where({ id: expedicaoId }).delete();
      }
    });
  });
});
