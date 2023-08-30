# INTEGRAÇÃO DO HCF-WEB A HERBÁRIOS VIRTUAIS BRASILEIROS

TCC 2 - UTFPR - CM - (2019-1)

### 1. PARA EXECUTAR

### 1.1 CRIAR PASTA NO MESMO DIRETÓRIO QUE src, public, etc...

```

$ mkdir logs
$ cd logs
$ mkdir reflora
$ mkdir specieslink

```

### 1.2 CRIAR A TABELA DE CONFIGURACAO

```

$ ...
$ CREATE TABLE `configuracao` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `hora_inicio` varchar(19) NOT NULL,
  `hora_fim` varchar(19) DEFAULT NULL,
  `periodicidade` enum('MANUAL','SEMANAL','1MES','2MESES') DEFAULT NULL,
  `data_proxima_atualizacao` varchar(10) DEFAULT NULL,
  `nome_arquivo` varchar(50) DEFAULT NULL,
  `servico` enum('REFLORA','SPECIESLINK') DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET='latin1';

```