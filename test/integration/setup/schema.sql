--
-- PostgreSQL database dump
--

\restrict 6jAa2KinsvKEOg1UbHoVMtEdyuVatRpHS5aFz6F6xH4vaNfTZHZIHyPU01e9TJ8

-- Dumped from database version 18.2 (Ubuntu 18.2-1.pgdg24.04+1)
-- Dumped by pg_dump version 18.1

-- Started on 2026-06-19 09:50:11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 5000 (class 0 OID 0)
-- Dependencies: 8
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- TOC entry 7 (class 2615 OID 34988)
-- Name: topology; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS topology;


--
-- TOC entry 5001 (class 0 OID 0)
-- Dependencies: 7
-- Name: SCHEMA topology; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA topology IS 'PostGIS Topology schema';


--
-- TOC entry 2 (class 3079 OID 33906)
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- TOC entry 5002 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- TOC entry 3 (class 3079 OID 34989)
-- Name: postgis_topology; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_topology WITH SCHEMA topology;


--
-- TOC entry 5003 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION postgis_topology; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis_topology IS 'PostGIS topology spatial types and functions';


--
-- TOC entry 1803 (class 1247 OID 30809)
-- Name: alteracoes_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.alteracoes_status AS ENUM (
    'ESPERANDO',
    'APROVADO',
    'REPROVADO'
);


--
-- TOC entry 1806 (class 1247 OID 30816)
-- Name: colecoes_anexas_tipo; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.colecoes_anexas_tipo AS ENUM (
    'CARPOTECA',
    'XILOTECA',
    'VIA LIQUIDA'
);


--
-- TOC entry 1809 (class 1247 OID 30824)
-- Name: configuracao_periodicidade; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.configuracao_periodicidade AS ENUM (
    'MANUAL',
    'SEMANAL',
    '1MES',
    '2MESES'
);


--
-- TOC entry 1812 (class 1247 OID 30834)
-- Name: configuracao_servico; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.configuracao_servico AS ENUM (
    'REFLORA',
    'SPECIESLINK'
);


--
-- TOC entry 1815 (class 1247 OID 30840)
-- Name: retirada_exsiccata_tombos_tipo; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.retirada_exsiccata_tombos_tipo AS ENUM (
    'DOACAO',
    'EMPRESTIMO',
    'PERMUTA'
);


--
-- TOC entry 1818 (class 1247 OID 30849)
-- Name: tombos_situacao; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tombos_situacao AS ENUM (
    'REGULAR',
    'PERMUTA',
    'EMPRESTIMO',
    'DOACAO'
);


--
-- TOC entry 995 (class 1255 OID 134326)
-- Name: fn_barcodes_tombo(bigint); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_barcodes_tombo(p_hcf bigint) RETURNS text
    LANGUAGE sql STABLE
    AS $$
      SELECT string_agg('[BARCODE=' || codigo_barra || ']', ' , ')
      FROM tombos_fotos
      WHERE tombo_hcf = p_hcf;
    $$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 222 (class 1259 OID 30857)
-- Name: alteracoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alteracoes (
    id bigint NOT NULL,
    usuario_id bigint NOT NULL,
    status public.alteracoes_status NOT NULL,
    observacao text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    tombo_hcf bigint NOT NULL,
    tombo_json text,
    ativo boolean,
    identificacao boolean
);


--
-- TOC entry 223 (class 1259 OID 30872)
-- Name: alteracoes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.alteracoes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5004 (class 0 OID 0)
-- Dependencies: 223
-- Name: alteracoes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.alteracoes_id_seq OWNED BY public.alteracoes.id;


--
-- TOC entry 224 (class 1259 OID 30873)
-- Name: autores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.autores (
    id bigint NOT NULL,
    nome character varying(200) NOT NULL,
    observacao character varying(500),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 225 (class 1259 OID 30883)
-- Name: autores_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.autores_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5005 (class 0 OID 0)
-- Dependencies: 225
-- Name: autores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.autores_id_seq OWNED BY public.autores.id;


--
-- TOC entry 226 (class 1259 OID 30884)
-- Name: cidades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cidades (
    id bigint NOT NULL,
    estado_id bigint NOT NULL,
    nome character varying(255) NOT NULL,
    latitude double precision,
    longitude double precision,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    poligono public.geometry(MultiPolygon,4674) DEFAULT NULL::public.geometry
);


--
-- TOC entry 227 (class 1259 OID 30892)
-- Name: cidades_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cidades_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5006 (class 0 OID 0)
-- Dependencies: 227
-- Name: cidades_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cidades_id_seq OWNED BY public.cidades.id;


--
-- TOC entry 228 (class 1259 OID 30893)
-- Name: colecoes_anexas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.colecoes_anexas (
    tipo public.colecoes_anexas_tipo NOT NULL,
    observacoes text,
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 229 (class 1259 OID 30904)
-- Name: colecoes_anexas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.colecoes_anexas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5007 (class 0 OID 0)
-- Dependencies: 229
-- Name: colecoes_anexas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.colecoes_anexas_id_seq OWNED BY public.colecoes_anexas.id;


--
-- TOC entry 230 (class 1259 OID 30905)
-- Name: coletores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coletores (
    id bigint NOT NULL,
    nome character varying(255) NOT NULL,
    email character varying(200) DEFAULT NULL::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 231 (class 1259 OID 30915)
-- Name: coletores_complementares; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coletores_complementares (
    hcf bigint NOT NULL,
    complementares character varying(1000) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 232 (class 1259 OID 30924)
-- Name: coletores_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.coletores_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5008 (class 0 OID 0)
-- Dependencies: 232
-- Name: coletores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.coletores_id_seq OWNED BY public.coletores.id;


--
-- TOC entry 233 (class 1259 OID 30925)
-- Name: configuracao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.configuracao (
    id bigint NOT NULL,
    hora_inicio character varying(19) NOT NULL,
    hora_fim character varying(19) DEFAULT NULL::character varying,
    periodicidade public.configuracao_periodicidade,
    data_proxima_atualizacao character varying(10) DEFAULT NULL::character varying,
    nome_arquivo character varying(50) DEFAULT NULL::character varying,
    servico public.configuracao_servico
);


--
-- TOC entry 234 (class 1259 OID 30933)
-- Name: configuracao_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.configuracao_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5009 (class 0 OID 0)
-- Dependencies: 234
-- Name: configuracao_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.configuracao_id_seq OWNED BY public.configuracao.id;


--
-- TOC entry 235 (class 1259 OID 30934)
-- Name: enderecos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.enderecos (
    id bigint NOT NULL,
    logradouro character varying(200) NOT NULL,
    numero character varying(10) DEFAULT NULL::character varying,
    complemento text,
    cidade_id bigint,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 236 (class 1259 OID 30946)
-- Name: enderecos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.enderecos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5010 (class 0 OID 0)
-- Dependencies: 236
-- Name: enderecos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.enderecos_id_seq OWNED BY public.enderecos.id;


--
-- TOC entry 237 (class 1259 OID 30947)
-- Name: especies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.especies (
    id bigint NOT NULL,
    nome character varying(200) NOT NULL,
    autor_id bigint,
    genero_id bigint,
    familia_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 238 (class 1259 OID 30957)
-- Name: especies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.especies_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5011 (class 0 OID 0)
-- Dependencies: 238
-- Name: especies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.especies_id_seq OWNED BY public.especies.id;


--
-- TOC entry 239 (class 1259 OID 30958)
-- Name: estados; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.estados (
    id bigint NOT NULL,
    nome character varying(255) NOT NULL,
    sigla character(4) DEFAULT NULL::bpchar,
    pais_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 240 (class 1259 OID 30967)
-- Name: estados_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.estados_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5012 (class 0 OID 0)
-- Dependencies: 240
-- Name: estados_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.estados_id_seq OWNED BY public.estados.id;


--
-- TOC entry 241 (class 1259 OID 30968)
-- Name: familias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.familias (
    id bigint NOT NULL,
    nome character varying(200) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    reino_id bigint NOT NULL
);


--
-- TOC entry 242 (class 1259 OID 30978)
-- Name: familias_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.familias_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5013 (class 0 OID 0)
-- Dependencies: 242
-- Name: familias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.familias_id_seq OWNED BY public.familias.id;


--
-- TOC entry 243 (class 1259 OID 30979)
-- Name: fase_sucessional; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fase_sucessional (
    id bigint NOT NULL,
    nome character varying(200) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 244 (class 1259 OID 30988)
-- Name: fase_sucessional_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fase_sucessional_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5014 (class 0 OID 0)
-- Dependencies: 244
-- Name: fase_sucessional_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fase_sucessional_id_seq OWNED BY public.fase_sucessional.id;


--
-- TOC entry 245 (class 1259 OID 30988)
-- Name: generos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.generos (
    id bigint NOT NULL,
    nome character varying(200) NOT NULL,
    familia_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 245 (class 1259 OID 30998)
-- Name: generos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.generos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5014 (class 0 OID 0)
-- Dependencies: 245
-- Name: generos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.generos_id_seq OWNED BY public.generos.id;


--
-- TOC entry 246 (class 1259 OID 30999)
-- Name: herbarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.herbarios (
    id bigint NOT NULL,
    nome character varying(200) NOT NULL,
    caminho_logotipo text,
    sigla character varying(80) NOT NULL,
    email character varying(200) DEFAULT NULL::character varying,
    endereco_id bigint,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 247 (class 1259 OID 31012)
-- Name: herbarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.herbarios_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5015 (class 0 OID 0)
-- Dependencies: 247
-- Name: herbarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.herbarios_id_seq OWNED BY public.herbarios.id;


--
-- TOC entry 248 (class 1259 OID 31013)
-- Name: historico_acessos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.historico_acessos (
    id bigint NOT NULL,
    data_criacao timestamp with time zone NOT NULL,
    usuario_id bigint NOT NULL
);


--
-- TOC entry 249 (class 1259 OID 31019)
-- Name: historico_acessos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.historico_acessos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5016 (class 0 OID 0)
-- Dependencies: 249
-- Name: historico_acessos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.historico_acessos_id_seq OWNED BY public.historico_acessos.id;


--
-- TOC entry 250 (class 1259 OID 31020)
-- Name: identificadores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.identificadores (
    id bigint NOT NULL,
    nome character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 251 (class 1259 OID 31027)
-- Name: identificadores_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.identificadores_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5017 (class 0 OID 0)
-- Dependencies: 251
-- Name: identificadores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.identificadores_id_seq OWNED BY public.identificadores.id;


--
-- TOC entry 252 (class 1259 OID 31028)
-- Name: locais_coleta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.locais_coleta (
    id bigint NOT NULL,
    descricao text,
    cidade_id bigint,
    fase_sucessional_id bigint,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fase_numero bigint
);


--
-- TOC entry 253 (class 1259 OID 31038)
-- Name: locais_coleta_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.locais_coleta_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5018 (class 0 OID 0)
-- Dependencies: 253
-- Name: locais_coleta_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.locais_coleta_id_seq OWNED BY public.locais_coleta.id;


--
-- TOC entry 254 (class 1259 OID 31039)
-- Name: migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.migrations (
    name character varying(300) NOT NULL,
    applied_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 255 (class 1259 OID 31045)
-- Name: paises; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.paises (
    id integer NOT NULL,
    nome character varying(255) NOT NULL,
    sigla character(4) DEFAULT NULL::bpchar,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 256 (class 1259 OID 31053)
-- Name: paises_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.paises_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5019 (class 0 OID 0)
-- Dependencies: 256
-- Name: paises_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.paises_id_seq OWNED BY public.paises.id;


--
-- TOC entry 257 (class 1259 OID 31054)
-- Name: reflora; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reflora (
    id bigint NOT NULL,
    cod_barra character varying(12) DEFAULT NULL::character varying,
    tombo_json text,
    ja_comparou boolean DEFAULT false,
    ja_requisitou boolean DEFAULT false,
    nro_requisicoes bigint DEFAULT '0'::bigint
);


--
-- TOC entry 258 (class 1259 OID 31064)
-- Name: reflora_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reflora_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5020 (class 0 OID 0)
-- Dependencies: 258
-- Name: reflora_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reflora_id_seq OWNED BY public.reflora.id;


--
-- TOC entry 259 (class 1259 OID 31065)
-- Name: reinos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reinos (
    id bigint NOT NULL,
    nome character varying(200) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 260 (class 1259 OID 31074)
-- Name: reinos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reinos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5021 (class 0 OID 0)
-- Dependencies: 260
-- Name: reinos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reinos_id_seq OWNED BY public.reinos.id;


--
-- TOC entry 261 (class 1259 OID 31075)
-- Name: relevos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.relevos (
    id bigint NOT NULL,
    nome character varying(300) NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 262 (class 1259 OID 31084)
-- Name: relevos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.relevos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5022 (class 0 OID 0)
-- Dependencies: 262
-- Name: relevos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.relevos_id_seq OWNED BY public.relevos.id;


--
-- TOC entry 263 (class 1259 OID 31085)
-- Name: remessas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.remessas (
    id bigint NOT NULL,
    observacao text,
    data_envio timestamp with time zone,
    entidade_destino_id bigint NOT NULL,
    herbario_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 264 (class 1259 OID 31097)
-- Name: remessas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.remessas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5023 (class 0 OID 0)
-- Dependencies: 264
-- Name: remessas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.remessas_id_seq OWNED BY public.remessas.id;


--
-- TOC entry 265 (class 1259 OID 31098)
-- Name: retirada_exsiccata_tombos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.retirada_exsiccata_tombos (
    retirada_exsiccata_id bigint NOT NULL,
    tombo_hcf bigint NOT NULL,
    tipo public.retirada_exsiccata_tombos_tipo NOT NULL,
    data_vencimento timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    devolvido boolean DEFAULT false
);


--
-- TOC entry 266 (class 1259 OID 31109)
-- Name: solos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solos (
    id bigint NOT NULL,
    nome character varying(300) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 267 (class 1259 OID 31118)
-- Name: solos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.solos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5024 (class 0 OID 0)
-- Dependencies: 267
-- Name: solos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.solos_id_seq OWNED BY public.solos.id;


--
-- TOC entry 268 (class 1259 OID 31119)
-- Name: specieslink; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.specieslink (
    id bigint NOT NULL,
    cod_barra character varying(12) DEFAULT NULL::character varying,
    tombo_json text,
    ja_comparou boolean DEFAULT false,
    ja_requisitou boolean DEFAULT false,
    nro_requisicoes bigint DEFAULT '0'::bigint
);


--
-- TOC entry 269 (class 1259 OID 31129)
-- Name: specieslink_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.specieslink_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5025 (class 0 OID 0)
-- Dependencies: 269
-- Name: specieslink_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.specieslink_id_seq OWNED BY public.specieslink.id;


--
-- TOC entry 270 (class 1259 OID 31130)
-- Name: sub_especies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sub_especies (
    id bigint NOT NULL,
    nome character varying(255) NOT NULL,
    especie_id bigint NOT NULL,
    genero_id bigint,
    familia_id bigint NOT NULL,
    autor_id bigint,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 271 (class 1259 OID 31141)
-- Name: sub_especies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sub_especies_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5026 (class 0 OID 0)
-- Dependencies: 271
-- Name: sub_especies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sub_especies_id_seq OWNED BY public.sub_especies.id;


--
-- TOC entry 272 (class 1259 OID 31142)
-- Name: sub_familias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sub_familias (
    id bigint NOT NULL,
    nome character varying(300) NOT NULL,
    familia_id bigint NOT NULL,
    autor_id bigint,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 273 (class 1259 OID 31152)
-- Name: sub_familias_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sub_familias_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5027 (class 0 OID 0)
-- Dependencies: 273
-- Name: sub_familias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sub_familias_id_seq OWNED BY public.sub_familias.id;


--
-- TOC entry 274 (class 1259 OID 31153)
-- Name: telefones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.telefones (
    id bigint NOT NULL,
    numero character varying(200) NOT NULL,
    herbario_id bigint NOT NULL
);


--
-- TOC entry 275 (class 1259 OID 31159)
-- Name: telefones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.telefones_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5028 (class 0 OID 0)
-- Dependencies: 275
-- Name: telefones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.telefones_id_seq OWNED BY public.telefones.id;


--
-- TOC entry 276 (class 1259 OID 31160)
-- Name: tipos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipos (
    id bigint NOT NULL,
    nome character varying(250) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 277 (class 1259 OID 31169)
-- Name: tipos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tipos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5029 (class 0 OID 0)
-- Dependencies: 277
-- Name: tipos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tipos_id_seq OWNED BY public.tipos.id;


--
-- TOC entry 278 (class 1259 OID 31170)
-- Name: tipos_usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipos_usuarios (
    id bigint NOT NULL,
    tipo character varying(100) DEFAULT NULL::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 279 (class 1259 OID 31179)
-- Name: tipos_usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tipos_usuarios_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5030 (class 0 OID 0)
-- Dependencies: 279
-- Name: tipos_usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tipos_usuarios_id_seq OWNED BY public.tipos_usuarios.id;


--
-- TOC entry 280 (class 1259 OID 31180)
-- Name: tombo_alteracoes_antigas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tombo_alteracoes_antigas (
    sequencia bigint NOT NULL,
    data date,
    descricao text,
    tombo_hcf bigint NOT NULL
);


--
-- TOC entry 281 (class 1259 OID 31187)
-- Name: tombos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tombos (
    hcf bigint NOT NULL,
    data_tombo timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    data_coleta_dia bigint,
    observacao text,
    nomes_populares text,
    numero_coleta bigint,
    latitude double precision,
    longitude double precision,
    altitude double precision,
    entidade_id bigint,
    local_coleta_id bigint,
    variedade_id bigint,
    tipo_id bigint,
    data_identificacao_dia smallint,
    data_identificacao_mes smallint,
    data_identificacao_ano integer,
    situacao public.tombos_situacao DEFAULT 'REGULAR'::public.tombos_situacao,
    especie_id bigint,
    genero_id bigint,
    familia_id bigint,
    sub_familia_id bigint,
    sub_especie_id bigint,
    nome_cientifico text,
    colecao_anexa_id bigint,
    data_coleta_mes bigint,
    data_coleta_ano bigint,
    solo_id bigint,
    relevo_id bigint,
    vegetacao_id bigint,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ativo boolean DEFAULT true,
    taxon character varying(45) DEFAULT NULL::character varying,
    rascunho boolean DEFAULT false,
    coletor_id bigint,
    descricao text,
    unicata boolean,
    cidade_id bigint,
    fase_sucessional_id bigint
);


--
-- TOC entry 282 (class 1259 OID 31202)
-- Name: tombos_fotos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tombos_fotos (
    id bigint NOT NULL,
    tombo_hcf bigint NOT NULL,
    codigo_barra character varying(45) DEFAULT ''::character varying,
    num_barra character varying(45) DEFAULT ''::character varying,
    caminho_foto text,
    em_vivo boolean DEFAULT false NOT NULL,
    sequencia bigint,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 283 (class 1259 OID 31217)
-- Name: tombos_fotos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tombos_fotos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5031 (class 0 OID 0)
-- Dependencies: 283
-- Name: tombos_fotos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tombos_fotos_id_seq OWNED BY public.tombos_fotos.id;


--
-- TOC entry 284 (class 1259 OID 31218)
-- Name: tombos_hcf_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tombos_hcf_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5032 (class 0 OID 0)
-- Dependencies: 284
-- Name: tombos_hcf_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tombos_hcf_seq OWNED BY public.tombos.hcf;


--
-- TOC entry 285 (class 1259 OID 31219)
-- Name: tombos_identificadores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tombos_identificadores (
    identificador_id bigint NOT NULL,
    tombo_hcf bigint NOT NULL,
    ordem smallint DEFAULT '1'::smallint
);


--
-- TOC entry 286 (class 1259 OID 31225)
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id bigint NOT NULL,
    nome character varying(200) NOT NULL,
    ra character varying(45) DEFAULT NULL::character varying,
    email character varying(200) NOT NULL,
    senha character varying(200) NOT NULL,
    tipo_usuario_id bigint NOT NULL,
    telefone character varying(45) DEFAULT NULL::character varying,
    herbario_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    token_troca_senha character varying(255) DEFAULT NULL::character varying,
    token_troca_senha_expiracao timestamp with time zone
);


--
-- TOC entry 287 (class 1259 OID 31243)
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.usuarios_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5033 (class 0 OID 0)
-- Dependencies: 287
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- TOC entry 288 (class 1259 OID 31244)
-- Name: variedades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.variedades (
    id bigint NOT NULL,
    nome character varying(200) NOT NULL,
    autor_id bigint,
    especie_id bigint NOT NULL,
    genero_id bigint,
    familia_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 289 (class 1259 OID 31255)
-- Name: variedades_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.variedades_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5034 (class 0 OID 0)
-- Dependencies: 289
-- Name: variedades_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.variedades_id_seq OWNED BY public.variedades.id;


--
-- TOC entry 290 (class 1259 OID 31256)
-- Name: vegetacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vegetacoes (
    id bigint NOT NULL,
    nome character varying(300) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 291 (class 1259 OID 31265)
-- Name: vegetacoes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.vegetacoes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5035 (class 0 OID 0)
-- Dependencies: 291
-- Name: vegetacoes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.vegetacoes_id_seq OWNED BY public.vegetacoes.id;


--
-- TOC entry 303 (class 1259 OID 251005)
-- Name: vw_splinker; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_splinker AS
 SELECT 'Plantae'::text AS "Kingdom",
    ''::text AS "Phylum",
    ''::text AS "Class",
    ''::text AS "Ordem",
        CASE
            WHEN (lower((f.nome)::text) = 'indeterminada'::text) THEN ''::character varying
            ELSE COALESCE(f.nome, ''::character varying)
        END AS "Family",
    COALESCE(g.nome, ''::character varying) AS "Genus",
    COALESCE(e.nome, ''::character varying) AS "Species",
    COALESCE(se.nome, ''::character varying) AS "Subspecies",
    COALESCE(a.nome, ''::character varying) AS "ScientificNameAuthor",
    COALESCE(t.nomes_populares, ''::text) AS "CommonName",
    ''::text AS "FieldNumber",
    t.hcf AS "CatalogNumber",
    ''::text AS "PreviousCatalogNumber",
    'PreservedSpecimen'::text AS "BasisOfRecord",
    COALESCE(tp.nome, ''::character varying) AS "TypeStatus",
    ''::text AS "PreparationType",
    ''::text AS "IndividualCount",
    ''::text AS "Sex",
    ''::text AS "LifeStage",
    COALESCE((t.data_coleta_dia)::text, ''::text) AS "DayCollected",
    COALESCE((t.data_coleta_mes)::text, ''::text) AS "MonthCollected",
    COALESCE((t.data_coleta_ano)::text, ''::text) AS "YearCollected",
    (((COALESCE(col.nome, ''::character varying))::text || ' '::text) || (COALESCE(cc.complementares, ''::character varying))::text) AS "Collector",
    COALESCE((t.numero_coleta)::text, ''::text) AS "CollectorNumber",
    ''::text AS "Continent",
    COALESCE(p.nome, ''::character varying) AS "Country",
    COALESCE(TRIM(BOTH FROM est.sigla), ''::text) AS "StateProvince",
    COALESCE(c.nome, ''::character varying) AS "County",
    COALESCE(lc.descricao, ''::text) AS "Locality",
    t.latitude AS "VerbatimLatitude",
    t.longitude AS "VerbatimLongitude",
    COALESCE((t.altitude)::text, ''::text) AS "VerbatimElevation",
    ''::text AS "VerbatimDepth",
    COALESCE((t.data_identificacao_dia)::text, ''::text) AS "DayIdentified",
    COALESCE((t.data_identificacao_mes)::text, ''::text) AS "MonthIdentified",
    COALESCE((t.data_identificacao_ano)::text, ''::text) AS "YearIdentified",
    COALESCE(( SELECT string_agg((ident.nome)::text, ';'::text) AS string_agg
           FROM (public.tombos_identificadores ti
             JOIN public.identificadores ident ON ((ti.identificador_id = ident.id)))
          WHERE (ti.tombo_hcf = t.hcf)), ''::text) AS "IdentifiedBy",
    ''::text AS "RelatedCatalogItem",
    ''::text AS "RelationShipType",
    concat_ws(' '::text, public.fn_barcodes_tombo(t.hcf), t.descricao) AS "Notes"
   FROM (((((((((((((public.tombos t
     LEFT JOIN public.locais_coleta lc ON ((t.local_coleta_id = lc.id)))
     LEFT JOIN public.cidades c ON ((t.cidade_id = c.id)))
     LEFT JOIN public.estados est ON ((c.estado_id = est.id)))
     LEFT JOIN public.paises p ON ((est.pais_id = p.id)))
     LEFT JOIN public.familias f ON ((t.familia_id = f.id)))
     LEFT JOIN public.reinos r ON ((f.reino_id = r.id)))
     LEFT JOIN public.generos g ON ((t.genero_id = g.id)))
     LEFT JOIN public.especies e ON ((t.especie_id = e.id)))
     LEFT JOIN public.sub_especies se ON ((se.id = t.sub_especie_id)))
     LEFT JOIN public.autores a ON ((e.autor_id = a.id)))
     LEFT JOIN public.coletores col ON ((t.coletor_id = col.id)))
     LEFT JOIN public.coletores_complementares cc ON ((cc.hcf = t.hcf)))
     LEFT JOIN public.tipos tp ON ((t.tipo_id = tp.id)));


--
-- TOC entry 4528 (class 2604 OID 32591)
-- Name: alteracoes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alteracoes ALTER COLUMN id SET DEFAULT nextval('public.alteracoes_id_seq'::regclass);


--
-- TOC entry 4531 (class 2604 OID 32590)
-- Name: autores id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.autores ALTER COLUMN id SET DEFAULT nextval('public.autores_id_seq'::regclass);


--
-- TOC entry 4534 (class 2604 OID 32588)
-- Name: cidades id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cidades ALTER COLUMN id SET DEFAULT nextval('public.cidades_id_seq'::regclass);


--
-- TOC entry 4538 (class 2604 OID 32592)
-- Name: colecoes_anexas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.colecoes_anexas ALTER COLUMN id SET DEFAULT nextval('public.colecoes_anexas_id_seq'::regclass);


--
-- TOC entry 4541 (class 2604 OID 32589)
-- Name: coletores id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coletores ALTER COLUMN id SET DEFAULT nextval('public.coletores_id_seq'::regclass);


--
-- TOC entry 4547 (class 2604 OID 32593)
-- Name: configuracao id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracao ALTER COLUMN id SET DEFAULT nextval('public.configuracao_id_seq'::regclass);


--
-- TOC entry 4551 (class 2604 OID 32600)
-- Name: enderecos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enderecos ALTER COLUMN id SET DEFAULT nextval('public.enderecos_id_seq'::regclass);


--
-- TOC entry 4555 (class 2604 OID 32594)
-- Name: especies id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.especies ALTER COLUMN id SET DEFAULT nextval('public.especies_id_seq'::regclass);


--
-- TOC entry 4558 (class 2604 OID 32597)
-- Name: estados id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estados ALTER COLUMN id SET DEFAULT nextval('public.estados_id_seq'::regclass);


--
-- TOC entry 4562 (class 2604 OID 32601)
-- Name: familias id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.familias ALTER COLUMN id SET DEFAULT nextval('public.familias_id_seq'::regclass);


--
-- TOC entry 4567 (class 2604 OID 32602)
-- Name: generos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generos ALTER COLUMN id SET DEFAULT nextval('public.generos_id_seq'::regclass);


--
-- TOC entry 4570 (class 2604 OID 32604)
-- Name: herbarios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.herbarios ALTER COLUMN id SET DEFAULT nextval('public.herbarios_id_seq'::regclass);


--
-- TOC entry 4574 (class 2604 OID 32596)
-- Name: historico_acessos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_acessos ALTER COLUMN id SET DEFAULT nextval('public.historico_acessos_id_seq'::regclass);


--
-- TOC entry 4575 (class 2604 OID 32605)
-- Name: identificadores id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.identificadores ALTER COLUMN id SET DEFAULT nextval('public.identificadores_id_seq'::regclass);


--
-- TOC entry 4578 (class 2604 OID 32618)
-- Name: locais_coleta id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locais_coleta ALTER COLUMN id SET DEFAULT nextval('public.locais_coleta_id_seq'::regclass);


--
-- TOC entry 4582 (class 2604 OID 32603)
-- Name: paises id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paises ALTER COLUMN id SET DEFAULT nextval('public.paises_id_seq'::regclass);


--
-- TOC entry 4586 (class 2604 OID 32598)
-- Name: reflora id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reflora ALTER COLUMN id SET DEFAULT nextval('public.reflora_id_seq'::regclass);


--
-- TOC entry 4591 (class 2604 OID 32599)
-- Name: reinos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reinos ALTER COLUMN id SET DEFAULT nextval('public.reinos_id_seq'::regclass);


--
-- TOC entry 4594 (class 2604 OID 32606)
-- Name: relevos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.relevos ALTER COLUMN id SET DEFAULT nextval('public.relevos_id_seq'::regclass);


--
-- TOC entry 4597 (class 2604 OID 32595)
-- Name: remessas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.remessas ALTER COLUMN id SET DEFAULT nextval('public.remessas_id_seq'::regclass);


--
-- TOC entry 4603 (class 2604 OID 32607)
-- Name: solos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solos ALTER COLUMN id SET DEFAULT nextval('public.solos_id_seq'::regclass);


--
-- TOC entry 4606 (class 2604 OID 32608)
-- Name: specieslink id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.specieslink ALTER COLUMN id SET DEFAULT nextval('public.specieslink_id_seq'::regclass);


--
-- TOC entry 4611 (class 2604 OID 32611)
-- Name: sub_especies id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sub_especies ALTER COLUMN id SET DEFAULT nextval('public.sub_especies_id_seq'::regclass);


--
-- TOC entry 4614 (class 2604 OID 32612)
-- Name: sub_familias id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sub_familias ALTER COLUMN id SET DEFAULT nextval('public.sub_familias_id_seq'::regclass);


--
-- TOC entry 4617 (class 2604 OID 32613)
-- Name: telefones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telefones ALTER COLUMN id SET DEFAULT nextval('public.telefones_id_seq'::regclass);


--
-- TOC entry 4618 (class 2604 OID 32614)
-- Name: tipos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipos ALTER COLUMN id SET DEFAULT nextval('public.tipos_id_seq'::regclass);


--
-- TOC entry 4621 (class 2604 OID 32616)
-- Name: tipos_usuarios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipos_usuarios ALTER COLUMN id SET DEFAULT nextval('public.tipos_usuarios_id_seq'::regclass);


--
-- TOC entry 4625 (class 2604 OID 31293)
-- Name: tombos hcf; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tombos ALTER COLUMN hcf SET DEFAULT nextval('public.tombos_hcf_seq'::regclass);


--
-- TOC entry 4633 (class 2604 OID 32609)
-- Name: tombos_fotos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tombos_fotos ALTER COLUMN id SET DEFAULT nextval('public.tombos_fotos_id_seq'::regclass);


--
-- TOC entry 4640 (class 2604 OID 32610)
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- TOC entry 4646 (class 2604 OID 32617)
-- Name: variedades id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.variedades ALTER COLUMN id SET DEFAULT nextval('public.variedades_id_seq'::regclass);


--
-- TOC entry 4649 (class 2604 OID 32615)
-- Name: vegetacoes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vegetacoes ALTER COLUMN id SET DEFAULT nextval('public.vegetacoes_id_seq'::regclass);


--
-- TOC entry 4660 (class 2606 OID 31299)
-- Name: alteracoes idx_41012_primary; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alteracoes
    ADD CONSTRAINT idx_41012_primary PRIMARY KEY (id);


--
-- TOC entry 4662 (class 2606 OID 31301)
-- Name: autores idx_41023_primary; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.autores
    ADD CONSTRAINT idx_41023_primary PRIMARY KEY (id);


--
-- TOC entry 4666 (class 2606 OID 31303)
-- Name: cidades idx_41031_primary; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cidades
    ADD CONSTRAINT idx_41031_primary PRIMARY KEY (id);


--
-- TOC entry 4668 (class 2606 OID 31305)
-- Name: colecoes_anexas idx_41038_primary; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.colecoes_anexas
    ADD CONSTRAINT idx_41038_primary PRIMARY KEY (id);


--
-- TOC entry 4670 (class 2606 OID 31307)
-- Name: coletores idx_41047_primary; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coletores
    ADD CONSTRAINT idx_41047_primary PRIMARY KEY (id);


--
-- TOC entry 4672 (class 2606 OID 31309)
-- Name: coletores_complementares idx_41054_primary; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coletores_complementares
    ADD CONSTRAINT idx_41054_primary PRIMARY KEY (hcf);


--
-- TOC entry 4674 (class 2606 OID 31311)
-- Name: configuracao idx_41062_primary; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracao
    ADD CONSTRAINT idx_41062_primary PRIMARY KEY (id);


--
-- TOC entry 4677 (class 2606 OID 31313)
-- Name: enderecos idx_41070_primary; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enderecos
    ADD CONSTRAINT idx_41070_primary PRIMARY KEY (id);


--
-- TOC entry 4682 (class 2606 OID 31315)
-- Name: especies idx_41080_primary; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.especies
    ADD CONSTRAINT idx_41080_primary PRIMARY KEY (id);


--
-- TOC entry 4685 (class 2606 OID 31317)
-- Name: estados idx_41087_primary; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estados
    ADD CONSTRAINT idx_41087_primary PRIMARY KEY (id);


--
-- TOC entry 4687 (class 2606 OID 31319)
-- Name: familias idx_41095_primary; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.familias
    ADD CONSTRAINT idx_41095_primary PRIMARY KEY (id);


--
-- TOC entry 4689 (class 2606 OID 31321)
-- Name: fase_sucessional idx_41101_primary; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fase_sucessional
    ADD CONSTRAINT idx_41101_primary PRIMARY KEY (id);


--
-- TOC entry 4530 (class 2604 OID 32603)
-- Name: fase_sucessional id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fase_sucessional ALTER COLUMN id SET DEFAULT nextval('public.fase_sucessional_id_seq'::regclass);


--
-- TOC entry 4692 (class 2606 OID 31323)
-- Name: generos idx_41107_primary; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generos
    ADD CONSTRAINT idx_41107_primary PRIMARY KEY (id);


--
-- TOC entry 4695 (class 2606 OID 31325)
-- Name: herbarios idx_41114_primary; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.herbarios
    ADD CONSTRAINT idx_41114_primary PRIMARY KEY (id);


--
-- TOC entry 4697 (class 2606 OID 31327)
-- Name: historico_acessos idx_41124_primary; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_acessos
    ADD CONSTRAINT idx_41124_primary PRIMARY KEY (id);


--
-- TOC entry 4699 (class 2606 OID 31329)
-- Name: identificadores idx_41129_primary; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.identificadores
    ADD CONSTRAINT idx_41129_primary PRIMARY KEY (id);


--
-- TOC entry 4704 (class 2606 OID 31331)
-- Name: locais_coleta idx_41136_primary; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locais_coleta
    ADD CONSTRAINT idx_41136_primary PRIMARY KEY (id);


--
-- TOC entry 4706 (class 2606 OID 31333)
-- Name: migrations idx_41144_primary; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT idx_41144_primary PRIMARY KEY (name);


--
-- TOC entry 4708 (class 2606 OID 31335)
-- Name: paises idx_41149_primary; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paises
    ADD CONSTRAINT idx_41149_primary PRIMARY KEY (id);


--
-- TOC entry 4710 (class 2606 OID 31337)
-- Name: reflora idx_41157_primary; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reflora
    ADD CONSTRAINT idx_41157_primary PRIMARY KEY (id);


--
-- TOC entry 4712 (class 2606 OID 31339)
-- Name: reinos idx_41168_primary; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reinos
    ADD CONSTRAINT idx_41168_primary PRIMARY KEY (id);


--
-- TOC entry 4714 (class 2606 OID 31341)
-- Name: relevos idx_41175_primary; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.relevos
    ADD CONSTRAINT idx_41175_primary PRIMARY KEY (id);


--
-- TOC entry 4717 (class 2606 OID 31343)
-- Name: remessas idx_41182_primary; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.remessas
    ADD CONSTRAINT idx_41182_primary PRIMARY KEY (id);


--
-- TOC entry 4721 (class 2606 OID 31345)
-- Name: retirada_exsiccata_tombos idx_41190_primary; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.retirada_exsiccata_tombos
    ADD CONSTRAINT idx_41190_primary PRIMARY KEY (retirada_exsiccata_id, tombo_hcf);


--
-- TOC entry 4723 (class 2606 OID 31347)
-- Name: solos idx_41197_primary; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solos
    ADD CONSTRAINT idx_41197_primary PRIMARY KEY (id);


--
-- TOC entry 4725 (class 2606 OID 31349)
-- Name: specieslink idx_41204_primary; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.specieslink
    ADD CONSTRAINT idx_41204_primary PRIMARY KEY (id);


--
-- TOC entry 4731 (class 2606 OID 31351)
-- Name: sub_especies idx_41215_primary; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sub_especies
    ADD CONSTRAINT idx_41215_primary PRIMARY KEY (id);


--
-- TOC entry 4735 (class 2606 OID 31353)
-- Name: sub_familias idx_41222_primary; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sub_familias
    ADD CONSTRAINT idx_41222_primary PRIMARY KEY (id);


--
-- TOC entry 4738 (class 2606 OID 31355)
-- Name: telefones idx_41229_primary; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telefones
    ADD CONSTRAINT idx_41229_primary PRIMARY KEY (id);


--
-- TOC entry 4740 (class 2606 OID 31357)
-- Name: tipos idx_41234_primary; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipos
    ADD CONSTRAINT idx_41234_primary PRIMARY KEY (id);


--
-- TOC entry 4742 (class 2606 OID 31359)
-- Name: tipos_usuarios idx_41241_primary; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipos_usuarios
    ADD CONSTRAINT idx_41241_primary PRIMARY KEY (id);


--
-- TOC entry 4762 (class 2606 OID 31361)
-- Name: tombos idx_41249_primary; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tombos
    ADD CONSTRAINT idx_41249_primary PRIMARY KEY (hcf);


--
-- TOC entry 4767 (class 2606 OID 31363)
-- Name: tombos_fotos idx_41263_primary; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tombos_fotos
    ADD CONSTRAINT idx_41263_primary PRIMARY KEY (id);


--
-- TOC entry 4771 (class 2606 OID 31365)
-- Name: tombos_identificadores idx_41274_primary; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tombos_identificadores
    ADD CONSTRAINT idx_41274_primary PRIMARY KEY (identificador_id, tombo_hcf);


--
-- TOC entry 4745 (class 2606 OID 31367)
-- Name: tombo_alteracoes_antigas idx_41278_primary; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tombo_alteracoes_antigas
    ADD CONSTRAINT idx_41278_primary PRIMARY KEY (sequencia, tombo_hcf);


--
-- TOC entry 4775 (class 2606 OID 31369)
-- Name: usuarios idx_41284_primary; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT idx_41284_primary PRIMARY KEY (id);


--
-- TOC entry 4781 (class 2606 OID 31371)
-- Name: variedades idx_41296_primary; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.variedades
    ADD CONSTRAINT idx_41296_primary PRIMARY KEY (id);


--
-- TOC entry 4783 (class 2606 OID 31373)
-- Name: vegetacoes idx_41303_primary; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vegetacoes
    ADD CONSTRAINT idx_41303_primary PRIMARY KEY (id);


--
-- TOC entry 4657 (class 1259 OID 31374)
-- Name: idx_41012_fk_alteracoes_tombo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41012_fk_alteracoes_tombo ON public.alteracoes USING btree (tombo_hcf);


--
-- TOC entry 4658 (class 1259 OID 31375)
-- Name: idx_41012_fk_alteracoes_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41012_fk_alteracoes_usuario ON public.alteracoes USING btree (usuario_id);


--
-- TOC entry 4663 (class 1259 OID 31376)
-- Name: idx_41031_fk_cidades_estado_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41031_fk_cidades_estado_idx ON public.cidades USING btree (estado_id);


--
-- TOC entry 4664 (class 1259 OID 31377)
-- Name: idx_41031_pais_estado_nome; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41031_pais_estado_nome ON public.cidades USING btree (estado_id, nome);


--
-- TOC entry 4675 (class 1259 OID 31378)
-- Name: idx_41070_fk_enderecos_cidade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41070_fk_enderecos_cidade ON public.enderecos USING btree (cidade_id);


--
-- TOC entry 4678 (class 1259 OID 31379)
-- Name: idx_41080_fk_especies_autor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41080_fk_especies_autor ON public.especies USING btree (autor_id);


--
-- TOC entry 4679 (class 1259 OID 31380)
-- Name: idx_41080_fk_especies_familia; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41080_fk_especies_familia ON public.especies USING btree (familia_id);


--
-- TOC entry 4680 (class 1259 OID 31381)
-- Name: idx_41080_fk_especies_genero; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41080_fk_especies_genero ON public.especies USING btree (genero_id);


--
-- TOC entry 4683 (class 1259 OID 31382)
-- Name: idx_41087_pais_nome; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41087_pais_nome ON public.estados USING btree (pais_id, nome);


--
-- TOC entry 4690 (class 1259 OID 31383)
-- Name: idx_41107_fk_generos_familias; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41107_fk_generos_familias ON public.generos USING btree (familia_id);


--
-- TOC entry 4693 (class 1259 OID 31384)
-- Name: idx_41114_fk_herbarios_endereco; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41114_fk_herbarios_endereco ON public.herbarios USING btree (endereco_id);


--
-- TOC entry 4700 (class 1259 OID 31385)
-- Name: idx_41136_fk_99i0itontmoklfxmoo8armtnv; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41136_fk_99i0itontmoklfxmoo8armtnv ON public.locais_coleta USING btree (fase_numero);


--
-- TOC entry 4701 (class 1259 OID 31386)
-- Name: idx_41136_fk_locais_coleta_cidades_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41136_fk_locais_coleta_cidades_idx ON public.locais_coleta USING btree (cidade_id);


--
-- TOC entry 4702 (class 1259 OID 31387)
-- Name: idx_41136_fk_locais_coleta_fase_sucessional1_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41136_fk_locais_coleta_fase_sucessional1_idx ON public.locais_coleta USING btree (fase_sucessional_id);


--
-- TOC entry 4715 (class 1259 OID 31388)
-- Name: idx_41182_fk_remessas_herbario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41182_fk_remessas_herbario ON public.remessas USING btree (herbario_id);


--
-- TOC entry 4718 (class 1259 OID 31389)
-- Name: idx_41190_fk_retirada_exsiccata_tombos_remessa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41190_fk_retirada_exsiccata_tombos_remessa ON public.retirada_exsiccata_tombos USING btree (retirada_exsiccata_id);


--
-- TOC entry 4719 (class 1259 OID 31390)
-- Name: idx_41190_fk_retirada_exsiccata_tombos_tombo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41190_fk_retirada_exsiccata_tombos_tombo ON public.retirada_exsiccata_tombos USING btree (tombo_hcf);


--
-- TOC entry 4726 (class 1259 OID 31391)
-- Name: idx_41215_fk_sub_especies_autor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41215_fk_sub_especies_autor ON public.sub_especies USING btree (autor_id);


--
-- TOC entry 4727 (class 1259 OID 31392)
-- Name: idx_41215_fk_sub_especies_especie; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41215_fk_sub_especies_especie ON public.sub_especies USING btree (especie_id);


--
-- TOC entry 4728 (class 1259 OID 31393)
-- Name: idx_41215_fk_sub_especies_familia; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41215_fk_sub_especies_familia ON public.sub_especies USING btree (familia_id);


--
-- TOC entry 4729 (class 1259 OID 31394)
-- Name: idx_41215_fk_sub_especies_genero; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41215_fk_sub_especies_genero ON public.sub_especies USING btree (genero_id);


--
-- TOC entry 4732 (class 1259 OID 31395)
-- Name: idx_41222_fk_sub_familias_autor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41222_fk_sub_familias_autor ON public.sub_familias USING btree (autor_id);


--
-- TOC entry 4733 (class 1259 OID 31396)
-- Name: idx_41222_fk_sub_familias_familia; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41222_fk_sub_familias_familia ON public.sub_familias USING btree (familia_id);


--
-- TOC entry 4736 (class 1259 OID 31397)
-- Name: idx_41229_fk_telefones_herbario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41229_fk_telefones_herbario ON public.telefones USING btree (herbario_id);


--
-- TOC entry 4746 (class 1259 OID 31398)
-- Name: idx_41249_fk_tombos_colecao_anexa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41249_fk_tombos_colecao_anexa ON public.tombos USING btree (colecao_anexa_id);


--
-- TOC entry 4747 (class 1259 OID 31399)
-- Name: idx_41249_fk_tombos_coletor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41249_fk_tombos_coletor ON public.tombos USING btree (coletor_id);


--
-- TOC entry 4748 (class 1259 OID 31400)
-- Name: idx_41249_fk_tombos_entidade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41249_fk_tombos_entidade ON public.tombos USING btree (entidade_id);


--
-- TOC entry 4749 (class 1259 OID 31401)
-- Name: idx_41249_fk_tombos_especie; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41249_fk_tombos_especie ON public.tombos USING btree (especie_id);


--
-- TOC entry 4750 (class 1259 OID 31402)
-- Name: idx_41249_fk_tombos_familia; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41249_fk_tombos_familia ON public.tombos USING btree (familia_id);


--
-- TOC entry 4751 (class 1259 OID 31403)
-- Name: idx_41249_fk_tombos_genero; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41249_fk_tombos_genero ON public.tombos USING btree (genero_id);


--
-- TOC entry 4752 (class 1259 OID 31404)
-- Name: idx_41249_fk_tombos_local_coleta; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41249_fk_tombos_local_coleta ON public.tombos USING btree (local_coleta_id);


--
-- TOC entry 4753 (class 1259 OID 31405)
-- Name: idx_41249_fk_tombos_relevo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41249_fk_tombos_relevo ON public.tombos USING btree (relevo_id);


--
-- TOC entry 4754 (class 1259 OID 31406)
-- Name: idx_41249_fk_tombos_solo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41249_fk_tombos_solo ON public.tombos USING btree (solo_id);


--
-- TOC entry 4755 (class 1259 OID 31407)
-- Name: idx_41249_fk_tombos_sub_especie; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41249_fk_tombos_sub_especie ON public.tombos USING btree (sub_especie_id);


--
-- TOC entry 4756 (class 1259 OID 31408)
-- Name: idx_41249_fk_tombos_sub_familia; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41249_fk_tombos_sub_familia ON public.tombos USING btree (sub_familia_id);


--
-- TOC entry 4757 (class 1259 OID 31409)
-- Name: idx_41249_fk_tombos_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41249_fk_tombos_tipo ON public.tombos USING btree (tipo_id);


--
-- TOC entry 4758 (class 1259 OID 31410)
-- Name: idx_41249_fk_tombos_variedade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41249_fk_tombos_variedade ON public.tombos USING btree (variedade_id);


--
-- TOC entry 4759 (class 1259 OID 31411)
-- Name: idx_41249_fk_tombos_vegetacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41249_fk_tombos_vegetacao ON public.tombos USING btree (vegetacao_id);


--
-- TOC entry 4760 (class 1259 OID 31412)
-- Name: idx_41249_idx_tombos_coletor_id_numero_coleta; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41249_idx_tombos_coletor_id_numero_coleta ON public.tombos USING btree (coletor_id, numero_coleta);


--
-- TOC entry 4763 (class 1259 OID 31413)
-- Name: idx_41249_tombos_cidade_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41249_tombos_cidade_id_index ON public.tombos USING btree (cidade_id);


--
-- TOC entry 4764 (class 1259 OID 31414)
-- Name: idx_41263_fk_tombos_fotos_tombo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41263_fk_tombos_fotos_tombo ON public.tombos_fotos USING btree (tombo_hcf);


--
-- TOC entry 4765 (class 1259 OID 31415)
-- Name: idx_41263_idx_tombos_fotos_num_barra; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41263_idx_tombos_fotos_num_barra ON public.tombos_fotos USING btree (num_barra);


--
-- TOC entry 4768 (class 1259 OID 31416)
-- Name: idx_41274_fk_tombos_identificadores_identificador; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41274_fk_tombos_identificadores_identificador ON public.tombos_identificadores USING btree (identificador_id);


--
-- TOC entry 4769 (class 1259 OID 31417)
-- Name: idx_41274_fk_tombos_identificadores_tombo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41274_fk_tombos_identificadores_tombo ON public.tombos_identificadores USING btree (tombo_hcf);


--
-- TOC entry 4743 (class 1259 OID 31418)
-- Name: idx_41278_fk_tombo_alteracoes_antigas_tombo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41278_fk_tombo_alteracoes_antigas_tombo ON public.tombo_alteracoes_antigas USING btree (tombo_hcf);


--
-- TOC entry 4772 (class 1259 OID 31419)
-- Name: idx_41284_fk_usuarios_herbario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41284_fk_usuarios_herbario ON public.usuarios USING btree (herbario_id);


--
-- TOC entry 4773 (class 1259 OID 31420)
-- Name: idx_41284_fk_usuarios_tipo_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41284_fk_usuarios_tipo_usuario ON public.usuarios USING btree (tipo_usuario_id);


--
-- TOC entry 4776 (class 1259 OID 31421)
-- Name: idx_41296_fk_variedades_autor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41296_fk_variedades_autor ON public.variedades USING btree (autor_id);


--
-- TOC entry 4777 (class 1259 OID 31422)
-- Name: idx_41296_fk_variedades_especie; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41296_fk_variedades_especie ON public.variedades USING btree (especie_id);


--
-- TOC entry 4778 (class 1259 OID 31423)
-- Name: idx_41296_fk_variedades_familia; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41296_fk_variedades_familia ON public.variedades USING btree (familia_id);


--
-- TOC entry 4779 (class 1259 OID 31424)
-- Name: idx_41296_fk_variedades_genero; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_41296_fk_variedades_genero ON public.variedades USING btree (genero_id);


--
-- TOC entry 4805 (class 2606 OID 31425)
-- Name: locais_coleta fk_99i0itontmoklfxmoo8armtnv; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locais_coleta
    ADD CONSTRAINT fk_99i0itontmoklfxmoo8armtnv FOREIGN KEY (fase_numero) REFERENCES public.fase_sucessional(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4794 (class 2606 OID 31430)
-- Name: alteracoes fk_alteracoes_tombo; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alteracoes
    ADD CONSTRAINT fk_alteracoes_tombo FOREIGN KEY (tombo_hcf) REFERENCES public.tombos(hcf) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4795 (class 2606 OID 31435)
-- Name: alteracoes fk_alteracoes_usuario; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alteracoes
    ADD CONSTRAINT fk_alteracoes_usuario FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4796 (class 2606 OID 31440)
-- Name: cidades fk_cidades_estados; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cidades
    ADD CONSTRAINT fk_cidades_estados FOREIGN KEY (estado_id) REFERENCES public.estados(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4797 (class 2606 OID 31445)
-- Name: coletores_complementares fk_coletores_complementares_tombo; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coletores_complementares
    ADD CONSTRAINT fk_coletores_complementares_tombo FOREIGN KEY (hcf) REFERENCES public.tombos(hcf) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4798 (class 2606 OID 31450)
-- Name: enderecos fk_enderecos_cidade; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enderecos
    ADD CONSTRAINT fk_enderecos_cidade FOREIGN KEY (cidade_id) REFERENCES public.cidades(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4799 (class 2606 OID 31455)
-- Name: especies fk_especies_autor; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.especies
    ADD CONSTRAINT fk_especies_autor FOREIGN KEY (autor_id) REFERENCES public.autores(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4800 (class 2606 OID 31460)
-- Name: especies fk_especies_familia; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.especies
    ADD CONSTRAINT fk_especies_familia FOREIGN KEY (familia_id) REFERENCES public.familias(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4801 (class 2606 OID 31465)
-- Name: especies fk_especies_genero; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.especies
    ADD CONSTRAINT fk_especies_genero FOREIGN KEY (genero_id) REFERENCES public.generos(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4802 (class 2606 OID 31470)
-- Name: estados fk_estados_paises; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estados
    ADD CONSTRAINT fk_estados_paises FOREIGN KEY (pais_id) REFERENCES public.paises(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4803 (class 2606 OID 31475)
-- Name: generos fk_generos_familias; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generos
    ADD CONSTRAINT fk_generos_familias FOREIGN KEY (familia_id) REFERENCES public.familias(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4804 (class 2606 OID 31480)
-- Name: herbarios fk_herbarios_endereco; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.herbarios
    ADD CONSTRAINT fk_herbarios_endereco FOREIGN KEY (endereco_id) REFERENCES public.enderecos(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4806 (class 2606 OID 31485)
-- Name: locais_coleta fk_locais_coleta_cidades; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locais_coleta
    ADD CONSTRAINT fk_locais_coleta_cidades FOREIGN KEY (cidade_id) REFERENCES public.cidades(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4807 (class 2606 OID 31490)
-- Name: locais_coleta fk_locais_coleta_fase_sucessional1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locais_coleta
    ADD CONSTRAINT fk_locais_coleta_fase_sucessional1 FOREIGN KEY (fase_sucessional_id) REFERENCES public.fase_sucessional(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4808 (class 2606 OID 31495)
-- Name: remessas fk_remessas_herbario; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.remessas
    ADD CONSTRAINT fk_remessas_herbario FOREIGN KEY (herbario_id) REFERENCES public.herbarios(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4809 (class 2606 OID 31500)
-- Name: retirada_exsiccata_tombos fk_retirada_exsiccata_tombos_remessa; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.retirada_exsiccata_tombos
    ADD CONSTRAINT fk_retirada_exsiccata_tombos_remessa FOREIGN KEY (retirada_exsiccata_id) REFERENCES public.remessas(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4810 (class 2606 OID 31505)
-- Name: retirada_exsiccata_tombos fk_retirada_exsiccata_tombos_tombo; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.retirada_exsiccata_tombos
    ADD CONSTRAINT fk_retirada_exsiccata_tombos_tombo FOREIGN KEY (tombo_hcf) REFERENCES public.tombos(hcf) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4811 (class 2606 OID 31510)
-- Name: sub_especies fk_sub_especies_autor; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sub_especies
    ADD CONSTRAINT fk_sub_especies_autor FOREIGN KEY (autor_id) REFERENCES public.autores(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4812 (class 2606 OID 31515)
-- Name: sub_especies fk_sub_especies_especie; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sub_especies
    ADD CONSTRAINT fk_sub_especies_especie FOREIGN KEY (especie_id) REFERENCES public.especies(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4813 (class 2606 OID 31520)
-- Name: sub_especies fk_sub_especies_familia; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sub_especies
    ADD CONSTRAINT fk_sub_especies_familia FOREIGN KEY (familia_id) REFERENCES public.familias(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4814 (class 2606 OID 31525)
-- Name: sub_especies fk_sub_especies_genero; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sub_especies
    ADD CONSTRAINT fk_sub_especies_genero FOREIGN KEY (genero_id) REFERENCES public.generos(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4815 (class 2606 OID 31530)
-- Name: sub_familias fk_sub_familias_autor; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sub_familias
    ADD CONSTRAINT fk_sub_familias_autor FOREIGN KEY (autor_id) REFERENCES public.autores(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4816 (class 2606 OID 31535)
-- Name: sub_familias fk_sub_familias_familia; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sub_familias
    ADD CONSTRAINT fk_sub_familias_familia FOREIGN KEY (familia_id) REFERENCES public.familias(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4817 (class 2606 OID 31540)
-- Name: telefones fk_telefones_herbario; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telefones
    ADD CONSTRAINT fk_telefones_herbario FOREIGN KEY (herbario_id) REFERENCES public.herbarios(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4818 (class 2606 OID 31545)
-- Name: tombo_alteracoes_antigas fk_tombo_alteracoes_antigas_tombo; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tombo_alteracoes_antigas
    ADD CONSTRAINT fk_tombo_alteracoes_antigas_tombo FOREIGN KEY (tombo_hcf) REFERENCES public.tombos(hcf) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4819 (class 2606 OID 31550)
-- Name: tombos fk_tombos_cidade; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tombos
    ADD CONSTRAINT fk_tombos_cidade FOREIGN KEY (cidade_id) REFERENCES public.cidades(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4820 (class 2606 OID 31555)
-- Name: tombos fk_tombos_colecao_anexa; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tombos
    ADD CONSTRAINT fk_tombos_colecao_anexa FOREIGN KEY (colecao_anexa_id) REFERENCES public.colecoes_anexas(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4821 (class 2606 OID 31560)
-- Name: tombos fk_tombos_coletor; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tombos
    ADD CONSTRAINT fk_tombos_coletor FOREIGN KEY (coletor_id) REFERENCES public.coletores(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4822 (class 2606 OID 31565)
-- Name: tombos fk_tombos_entidade; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tombos
    ADD CONSTRAINT fk_tombos_entidade FOREIGN KEY (entidade_id) REFERENCES public.herbarios(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4823 (class 2606 OID 31570)
-- Name: tombos fk_tombos_especie; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tombos
    ADD CONSTRAINT fk_tombos_especie FOREIGN KEY (especie_id) REFERENCES public.especies(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4824 (class 2606 OID 31575)
-- Name: tombos fk_tombos_familia; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tombos
    ADD CONSTRAINT fk_tombos_familia FOREIGN KEY (familia_id) REFERENCES public.familias(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4833 (class 2606 OID 31580)
-- Name: tombos_fotos fk_tombos_fotos_tombo; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tombos_fotos
    ADD CONSTRAINT fk_tombos_fotos_tombo FOREIGN KEY (tombo_hcf) REFERENCES public.tombos(hcf) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4825 (class 2606 OID 31585)
-- Name: tombos fk_tombos_genero; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tombos
    ADD CONSTRAINT fk_tombos_genero FOREIGN KEY (genero_id) REFERENCES public.generos(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4834 (class 2606 OID 31590)
-- Name: tombos_identificadores fk_tombos_identificadores_identificador; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tombos_identificadores
    ADD CONSTRAINT fk_tombos_identificadores_identificador FOREIGN KEY (identificador_id) REFERENCES public.identificadores(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4835 (class 2606 OID 31595)
-- Name: tombos_identificadores fk_tombos_identificadores_tombo; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tombos_identificadores
    ADD CONSTRAINT fk_tombos_identificadores_tombo FOREIGN KEY (tombo_hcf) REFERENCES public.tombos(hcf) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4826 (class 2606 OID 31600)
-- Name: tombos fk_tombos_local_coleta; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tombos
    ADD CONSTRAINT fk_tombos_local_coleta FOREIGN KEY (local_coleta_id) REFERENCES public.locais_coleta(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4827 (class 2606 OID 31605)
-- Name: tombos fk_tombos_relevo; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tombos
    ADD CONSTRAINT fk_tombos_relevo FOREIGN KEY (relevo_id) REFERENCES public.relevos(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4828 (class 2606 OID 31610)
-- Name: tombos fk_tombos_solo; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tombos
    ADD CONSTRAINT fk_tombos_solo FOREIGN KEY (solo_id) REFERENCES public.solos(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4829 (class 2606 OID 31615)
-- Name: tombos fk_tombos_sub_especie; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tombos
    ADD CONSTRAINT fk_tombos_sub_especie FOREIGN KEY (sub_especie_id) REFERENCES public.sub_especies(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4830 (class 2606 OID 31620)
-- Name: tombos fk_tombos_sub_familia; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tombos
    ADD CONSTRAINT fk_tombos_sub_familia FOREIGN KEY (sub_familia_id) REFERENCES public.sub_familias(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4831 (class 2606 OID 31625)
-- Name: tombos fk_tombos_tipo; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tombos
    ADD CONSTRAINT fk_tombos_tipo FOREIGN KEY (tipo_id) REFERENCES public.tipos(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4832 (class 2606 OID 31630)
-- Name: tombos fk_tombos_vegetacao; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tombos
    ADD CONSTRAINT fk_tombos_vegetacao FOREIGN KEY (vegetacao_id) REFERENCES public.vegetacoes(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4836 (class 2606 OID 31635)
-- Name: usuarios fk_usuarios_herbario; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT fk_usuarios_herbario FOREIGN KEY (herbario_id) REFERENCES public.herbarios(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4837 (class 2606 OID 31640)
-- Name: usuarios fk_usuarios_tipo_usuario; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT fk_usuarios_tipo_usuario FOREIGN KEY (tipo_usuario_id) REFERENCES public.tipos_usuarios(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4838 (class 2606 OID 31645)
-- Name: variedades fk_variedades_autor; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.variedades
    ADD CONSTRAINT fk_variedades_autor FOREIGN KEY (autor_id) REFERENCES public.autores(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4839 (class 2606 OID 31650)
-- Name: variedades fk_variedades_especie; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.variedades
    ADD CONSTRAINT fk_variedades_especie FOREIGN KEY (especie_id) REFERENCES public.especies(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4840 (class 2606 OID 31655)
-- Name: variedades fk_variedades_familia; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.variedades
    ADD CONSTRAINT fk_variedades_familia FOREIGN KEY (familia_id) REFERENCES public.familias(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4841 (class 2606 OID 31660)
-- Name: variedades fk_variedades_genero; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.variedades
    ADD CONSTRAINT fk_variedades_genero FOREIGN KEY (genero_id) REFERENCES public.generos(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


-- Completed on 2026-06-19 09:50:16

--
-- PostgreSQL database dump complete
--

\unrestrict 6jAa2KinsvKEOg1UbHoVMtEdyuVatRpHS5aFz6F6xH4vaNfTZHZIHyPU01e9TJ8
