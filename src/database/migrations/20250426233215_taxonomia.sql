create table `autores` (
  `id` int unsigned not null auto_increment,
  `nome` varchar(200) not null,
  `iniciais` varchar(200) default null,
  `created_at` datetime not null default current_timestamp,
  `updated_at` datetime not null default current_timestamp on update current_timestamp,
  `ativo` tinyint(1) not null default '1',
  primary key (`id`),
  index `autores_nome_idx` (`nome`)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;


create table `familias` (
  `id` int unsigned not null auto_increment,
  `nome` varchar(200) not null,
  `created_at` datetime not null default current_timestamp,
  `updated_at` datetime not null default current_timestamp on update current_timestamp,
  `ativo` tinyint(1) not null default '1',
  primary key (`id`),
  index `familias_nome_idx` (`nome`)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;


create table `subfamilias` (
  `id` int unsigned not null auto_increment,
  `nome` varchar(300) not null,
  `familia_id` int unsigned not null,
  `autor_id` int unsigned default null,
  `created_at` datetime not null default current_timestamp,
  `updated_at` datetime not null default current_timestamp on update current_timestamp,
  `ativo` tinyint(1) not null default '1',
  primary key (`id`),
  constraint `subfamilias_autores_fk` foreign key (`autor_id`) references `autores` (`id`),
  constraint `subfamilias_familias_fk` foreign key (`familia_id`) references `familias` (`id`),
  index `subfamilias_nome_idx` (`nome`)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;


create table `generos` (
  `id` int unsigned not null auto_increment,
  `nome` varchar(200) not null,
  `familia_id` int unsigned not null,
  `created_at` datetime not null default current_timestamp,
  `updated_at` datetime not null default current_timestamp on update current_timestamp,
  `ativo` tinyint(1) not null default '1',
  primary key (`id`),
  constraint `generos_familias_fk` foreign key (`familia_id`) references `familias` (`id`),
  index `generos_nome_idx` (`nome`)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;


create table `especies` (
  `id` int unsigned not null auto_increment,
  `nome` varchar(200) not null,
  `autor_id` int unsigned default null,
  `genero_id` int unsigned default null,
  `familia_id` int unsigned not null,
  `created_at` datetime not null default current_timestamp,
  `updated_at` datetime not null default current_timestamp on update current_timestamp,
  `ativo` tinyint(1) not null default '1',
  primary key (`id`),
  constraint `especies_autores_fk` foreign key (`autor_id`) references `autores` (`id`),
  constraint `especies_generos_fk` foreign key (`genero_id`) references `generos` (`id`),
  constraint `especies_familias_fk` foreign key (`familia_id`) references `familias` (`id`),
  index `especies_nome_idx` (`nome`)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;


create table `subespecies` (
  `id` int unsigned not null auto_increment,
  `nome` varchar(255) not null,
  `especie_id` int unsigned not null,
  `genero_id` int unsigned default null,
  `familia_id` int unsigned not null,
  `autor_id` int unsigned default null,
  `created_at` datetime not null default current_timestamp,
  `updated_at` datetime not null default current_timestamp on update current_timestamp,
  `ativo` tinyint(1) not null default '1',
  primary key (`id`),
  constraint `subespecies_especies_fk` foreign key (`especie_id`) references `especies` (`id`),
  constraint `subespecies_generos_fk` foreign key (`genero_id`) references `generos` (`id`),
  constraint `subespecies_autores_fk` foreign key (`autor_id`) references `autores` (`id`),
  constraint `subespecies_familias_fk` foreign key (`familia_id`) references `familias` (`id`),
  index `subespecies_nome_idx` (`nome`)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;


create table `variedades` (
  `id` int unsigned not null auto_increment,
  `nome` varchar(200) not null,
  `autor_id` int unsigned default null,
  `especie_id` int unsigned not null,
  `genero_id` int unsigned default null,
  `familia_id` int unsigned not null,
  `created_at` datetime not null default current_timestamp,
  `updated_at` datetime not null default current_timestamp on update current_timestamp,
  `ativo` tinyint(1) not null default '1',
  primary key (`id`),
  constraint `variedades_generos_fk` foreign key (`genero_id`) references `generos` (`id`),
  constraint `variedades_familias_fk` foreign key (`familia_id`) references `familias` (`id`),
  constraint `variedades_especies_fk` foreign key (`especie_id`) references `especies` (`id`),
  constraint `variedades_autores_fk` foreign key (`autor_id`) references `autores` (`id`),
  index `variedades_nome_idx` (`nome`)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_unicode_ci;
