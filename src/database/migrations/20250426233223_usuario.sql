create table `tipos_usuarios` (
  `id` int unsigned not null auto_increment,
  `tipo` varchar(100) not null,
  `created_at` datetime not null default current_timestamp,
  `updated_at` datetime not null default current_timestamp on update current_timestamp,
  primary key (`id`),
  unique index `tipos_usuarios_tipo_uk` (`tipo`)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;


create table `usuarios` (
  `id` int unsigned not null auto_increment,
  `nome` varchar(200) not null,
  `ra` varchar(45) default null,
  `email` varchar(200) not null,
  `senha` varchar(200) not null,
  `ativo` tinyint(1) not null default '1',
  `tipo_usuario_id` int unsigned not null,
  `telefone` varchar(20) default null,
  `herbario_id` int unsigned not null,
  `created_at` datetime not null default current_timestamp,
  `updated_at` datetime not null default current_timestamp on update current_timestamp,
  primary key (`id`),
  constraint `usuarios_tipos_usuarios_fk` foreign key (`tipo_usuario_id`) references `tipos_usuarios` (`id`),
  constraint `usuarios_herbarios_fk` foreign key (`herbario_id`) references `herbarios` (`id`),
  unique index `usuarios_email_uk` (`email`)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;


create table `historico_acessos` (
  `id` int unsigned not null auto_increment,
  `data_criacao` datetime not null default current_timestamp,
  `usuario_id` int unsigned not null,
  primary key (`id`),
  constraint `historico_acessos_usuarios_fk` foreign key (`usuario_id`) references `usuarios` (`id`)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;
