create table `configuracao` (
  `id` int unsigned not null auto_increment,
  `hora_inicio` varchar(19) not null,
  `hora_fim` varchar(19) default null,
  `periodicidade` enum('manual','semanal','1mes','2meses') default null,
  `data_proxima_atualizacao` varchar(10) default null,
  `nome_arquivo` varchar(50) default null,
  `servico` enum('reflora','specieslink') default null,
  `created_at` datetime not null default current_timestamp,
  `updated_at` datetime not null default current_timestamp on update current_timestamp,
  primary key (`id`),
  index `configuracao_servico_idx` (`servico`)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;
