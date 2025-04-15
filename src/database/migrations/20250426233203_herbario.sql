create table `paises` (
  `id` smallint unsigned not null auto_increment,
  `nome` varchar(255) not null,
  `sigla` char(4) default null,
  `created_at` datetime not null default current_timestamp,
  `updated_at` datetime not null default current_timestamp on update current_timestamp,
  primary key (`id`),
  index `paises_nome_idx` (`nome`)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;


create table `estados` (
  `id` int unsigned not null auto_increment,
  `nome` varchar(255) not null,
  `sigla` char(4) default null,
  `codigo_telefone` varchar(10) default null,
  `pais_id` smallint unsigned not null,
  `created_at` datetime not null default current_timestamp,
  `updated_at` datetime not null default current_timestamp on update current_timestamp,
  primary key (`id`),
  constraint `estados_paises_fk` foreign key (`pais_id`) references `paises` (`id`),
  index `estados_nome_idx` (`nome`)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;


create table `cidades` (
  `id` int unsigned not null auto_increment,
  `estado_id` int unsigned not null,
  `nome` varchar(255) not null,
  `latitude` decimal(10,7) default null,
  `longitude` decimal(10,7) default null,
  `created_at` datetime not null default current_timestamp,
  `updated_at` datetime not null default current_timestamp on update current_timestamp,
  primary key (`id`),
  constraint `cidades_estados_fk` foreign key (`estado_id`) references `estados` (`id`),
  index `cidades_nome_idx` (`nome`)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;


create table `enderecos` (
  `id` int unsigned not null auto_increment,
  `logradouro` varchar(200) not null,
  `numero` varchar(10) default null,
  `complemento` text,
  `cidade_id` int unsigned default null,
  `created_at` datetime not null default current_timestamp,
  `updated_at` datetime not null default current_timestamp on update current_timestamp,
  primary key (`id`),
  constraint `enderecos_cidades_fk` foreign key (`cidade_id`) references `cidades` (`id`)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;


create table `herbarios` (
  `id` int unsigned not null auto_increment,
  `nome` varchar(200) not null,
  `caminho_logotipo` text,
  `sigla` varchar(80) not null,
  `email` varchar(200) default null,
  `ativo` tinyint(1) default '1',
  `endereco_id` int unsigned default null,
  `created_at` datetime not null default current_timestamp,
  `updated_at` datetime not null default current_timestamp on update current_timestamp,
  primary key (`id`),
  constraint `herbarios_enderecos_fk` foreign key (`endereco_id`) references `enderecos` (`id`),
  index `herbarios_nome_idx` (`nome`)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;


create table `telefones` (
  `id` int unsigned not null auto_increment,
  `numero` varchar(20) not null,
  `herbario_id` int unsigned not null,
  `ativo` tinyint(1) default '1',
  `created_at` datetime not null default current_timestamp,
  `updated_at` datetime not null default current_timestamp on update current_timestamp,
  primary key (`id`),
  constraint `telefones_herbarios_fk` foreign key (`herbario_id`) references `herbarios` (`id`)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;
