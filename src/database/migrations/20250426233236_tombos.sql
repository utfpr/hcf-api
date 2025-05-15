create table `remessas` (
  `id` int unsigned not null auto_increment,
  `observacao` text,
  `data_envio` datetime default null,
  `entidade_destino_id` int unsigned not null,
  `herbario_id` int unsigned not null,
  `created_at` datetime not null default current_timestamp,
  `updated_at` datetime not null default current_timestamp on update current_timestamp,
  primary key (`id`),
  constraint `remessas_herbarios_fk` foreign key (`herbario_id`) references `herbarios` (`id`),
  constraint `remessas_entidade_fk` foreign key (`entidade_destino_id`) references `herbarios` (`id`)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;


create table `tipos` (
  `id` int unsigned not null auto_increment,
  `nome` varchar(250) not null,
  `created_at` datetime not null default current_timestamp,
  `updated_at` datetime not null default current_timestamp on update current_timestamp,
  primary key (`id`)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;


create table `coletores` (
  `id` int unsigned not null auto_increment,
  `nome` varchar(255) not null,
  `email` varchar(200) default null,
  `numero` int default null,
  `ativo` tinyint(1) default '1',
  `created_at` datetime not null default current_timestamp,
  `updated_at` datetime not null default current_timestamp on update current_timestamp,
  primary key (`id`),
  index `coletores_nome_idx` (`nome`)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;


create table `relevos` (
  `id` int unsigned not null auto_increment,
  `nome` varchar(300) not null,
  `updated_at` datetime not null default current_timestamp on update current_timestamp,
  `created_at` datetime not null default current_timestamp,
  primary key (`id`),
  unique index `relevos_nome_uk` (`nome`)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;


create table `solos` (
  `id` int unsigned not null auto_increment,
  `nome` varchar(300) not null,
  `created_at` datetime not null default current_timestamp,
  `updated_at` datetime not null default current_timestamp on update current_timestamp,
  primary key (`id`),
  unique index `solos_nome_uk` (`nome`)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;


create table `vegetacoes` (
  `id` int unsigned not null auto_increment,
  `nome` varchar(300) not null,
  `created_at` datetime not null default current_timestamp,
  `updated_at` datetime not null default current_timestamp on update current_timestamp,
  primary key (`id`),
  unique index `vegetacoes_nome_uk` (`nome`)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;


create table `fase_sucessional` (
  `numero` int unsigned not null,
  `nome` varchar(200) not null,
  `created_at` datetime not null default current_timestamp,
  `updated_at` datetime not null default current_timestamp on update current_timestamp,
  primary key (`numero`),
  unique index `fase_sucessional_nome_uk` (`nome`)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;


LOCK TABLES `fase_sucessional` WRITE;

INSERT INTO `fase_sucessional` VALUES
(1, '1º fase sucessão vegetal'),
(2, '2º fase sucessão vegetal'),
(3, '3º fase ou capoeirinhia'),
(4, '4º fase capoeira'),
(5, '5º fase capoeirão'),
(6, '6º fase floresta secundária')


create table `locais_coleta` (
  `id` int unsigned not null auto_increment,
  `descricao` text,
  `cidade_id` int unsigned default null,
  `fase_sucessional_id` int unsigned default null,
  `complemento` text,
  `created_at` datetime not null default current_timestamp,
  `updated_at` datetime not null default current_timestamp on update current_timestamp,
  `fase_numero` int unsigned default null,
  primary key (`id`),
  constraint `locais_coleta_fase_numero_fk` foreign key (`fase_numero`) references `fase_sucessional` (`numero`),
  constraint `locais_coleta_cidades_fk` foreign key (`cidade_id`) references `cidades` (`id`),
  index `locais_coleta_cidade_idx` (`cidade_id`)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;


create table `colecoes_anexas` (
  `id` int unsigned not null auto_increment,
  `tipo` enum('carpoteca','xiloteca','via liquida') not null,
  `observacoes` text,
  `created_at` datetime not null default current_timestamp,
  `updated_at` datetime not null default current_timestamp on update current_timestamp,
  primary key (`id`),
  index `colecoes_anexas_tipo_idx` (`tipo`)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;


create table `tombos` (
  `hcf` int unsigned not null auto_increment,
  `data_tombo` datetime default current_timestamp,
  `data_coleta_dia` int unsigned default null,
  `observacao` text,
  `nomes_populares` text,
  `numero_coleta` int unsigned default null,
  `latitude` decimal(10, 7) default null,
  `longitude` decimal(10, 7) default null,
  `altitude` decimal(8, 2) default null,
  `entidade_id` int unsigned default null,
  `local_coleta_id` int unsigned default null,
  `variedade_id` int unsigned default null,
  `tipo_id` int unsigned default null,
  `data_identificacao_dia` tinyint unsigned default null,
  `data_identificacao_mes` tinyint unsigned default null,
  `data_identificacao_ano` year default null,
  `situacao` enum('regular','permuta','emprestimo','doacao') default 'regular',
  `especie_id` int unsigned default null,
  `genero_id` int unsigned default null,
  `familia_id` int unsigned default null,
  `subfamilia_id` int unsigned default null,
  `subespecie_id` int unsigned default null,
  `nome_cientifico` text,
  `colecao_anexa_id` int unsigned default null,
  `cor` enum('vermelho','verde','azul') default null,
  `data_coleta_mes` int unsigned default null,
  `data_coleta_ano` int unsigned default null,
  `solo_id` int unsigned default null,
  `relevo_id` int unsigned default null,
  `vegetacao_id` int unsigned default null,
  `created_at` datetime not null default current_timestamp,
  `updated_at` datetime not null default current_timestamp on update current_timestamp,
  `ativo` tinyint(1) default '1',
  `taxon` varchar(45) default null,
  `rascunho` tinyint(1) default '0',
  `coletor_id` int unsigned default null,
  primary key (`hcf`),
  constraint `tombos_herbarios_fk` foreign key (`entidade_id`) references `herbarios` (`id`),
  constraint `tombos_colecoes_anexas_fk` foreign key (`colecao_anexa_id`) references `colecoes_anexas` (`id`),
  constraint `tombos_especies_fk` foreign key (`especie_id`) references `especies` (`id`),
  constraint `tombos_familias_fk` foreign key (`familia_id`) references `familias` (`id`),
  constraint `tombos_generos_fk` foreign key (`genero_id`) references `generos` (`id`),
  constraint `tombos_locais_coleta_fk` foreign key (`local_coleta_id`) references `locais_coleta` (`id`),
  constraint `tombos_subespecies_fk` foreign key (`subespecie_id`) references `subespecies` (`id`),
  constraint `tombos_subfamilias_fk` foreign key (`subfamilia_id`) references `subfamilias` (`id`),
  constraint `tombos_tipos_fk` foreign key (`tipo_id`) references `tipos` (`id`),
  constraint `tombos_solos_fk` foreign key (`solo_id`) references `solos` (`id`),
  constraint `tombos_relevos_fk` foreign key (`relevo_id`) references `relevos` (`id`),
  constraint `tombos_vegetacoes_fk` foreign key (`vegetacao_id`) references `vegetacoes` (`id`),
  constraint `tombos_coletores_fk` foreign key (`coletor_id`) references `coletores` (`id`),
  index `tombos_situacao_idx` (`situacao`),
  index `tombos_ativo_idx` (`ativo`),
  index `tombos_taxonomia_idx` (`familia_id`, `genero_id`, `especie_id`)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;


create table `coletores_complementares` (
  `hcf` int unsigned not null,
  `complementares` varchar(1000) not null,
  `created_at` datetime not null default current_timestamp,
  `updated_at` datetime not null default current_timestamp on update current_timestamp,
  primary key (`hcf`),
  constraint `coletores_complementares_tombos_fk` foreign key (`hcf`) references `tombos` (`hcf`)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;


create table `identificadores` (
  `id` int unsigned not null auto_increment,
  `nome` varchar(255) not null,
  `created_at` datetime not null default current_timestamp,
  `updated_at` datetime not null default current_timestamp on update current_timestamp,
  primary key (`id`),
  index `identificadores_nome_idx` (`nome`)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;


create table `tombos_identificadores` (
  `identificador_id` int unsigned not null,
  `tombo_hcf` int unsigned not null,
  `ordem` tinyint unsigned default 1,
  primary key (`identificador_id`, `tombo_hcf`),
  constraint `tombos_identificadores_identificadores_fk` foreign key (`identificador_id`) references `identificadores` (`id`),
  constraint `tombos_identificadores_tombos_fk` foreign key (`tombo_hcf`) references `tombos` (`hcf`)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;


create table `tombos_fotos` (
  `id` int unsigned not null auto_increment,
  `tombo_hcf` int unsigned not null,
  `codigo_barra` varchar(45) default '',
  `num_barra` varchar(45) default '',
  `caminho_foto` text,
  `em_vivo` tinyint(1) not null default '0',
  `sequencia` int unsigned default null,
  `ativo` tinyint(1) default '1',
  `created_at` datetime not null default current_timestamp,
  `updated_at` datetime not null default current_timestamp on update current_timestamp,
  primary key (`id`),
  constraint `tombos_fotos_tombos_fk` foreign key (`tombo_hcf`) references `tombos` (`hcf`),
  index `tombos_fotos_ativo_idx` (`ativo`)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;


create table `alteracoes` (
  `id` int unsigned not null auto_increment,
  `usuario_id` int unsigned not null,
  `status` enum('esperando','aprovado','reprovado') not null,
  `observacao` text,
  `ativo` tinyint(1) default '1',
  `created_at` datetime not null default current_timestamp,
  `updated_at` datetime not null default current_timestamp on update current_timestamp,
  `tombo_hcf` int unsigned not null,
  `tombo_json` json,
  `identificacao` tinyint(1) default '0',
  primary key (`id`),
  constraint `alteracoes_tombos_fk` foreign key (`tombo_hcf`) references `tombos` (`hcf`),
  constraint `alteracoes_usuarios_fk` foreign key (`usuario_id`) references `usuarios` (`id`),
  index `alteracoes_status_idx` (`status`),
  index `alteracoes_ativo_idx` (`ativo`)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;


create table `retirada_exsicata_tombos` (
  `retirada_exsicata_id` int unsigned not null,
  `tombo_hcf` int unsigned not null,
  `tipo` enum('doacao','emprestimo','permuta') not null,
  `data_vencimento` datetime default null,
  `created_at` datetime not null default current_timestamp,
  `updated_at` datetime not null default current_timestamp on update current_timestamp,
  `devolvido` tinyint(1) default '0',
  primary key (`retirada_exsicata_id`,`tombo_hcf`),
  constraint `retirada_exsicata_tombos_remessas_fk` foreign key (`retirada_exsicata_id`) references `remessas` (`id`),
  constraint `retirada_exsicata_tombos_tombos_fk` foreign key (`tombo_hcf`) references `tombos` (`hcf`)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;

UNLOCK TABLES;
