--
-- PostgreSQL database dump
--

\restrict 5whMsSIB6T0h72R44ZMNwFyM1ZjsM0yTvwBwMlzA8rnNcbBMVPen3gwS4JvgU2s

-- Dumped from database version 14.19 (Homebrew)
-- Dumped by pg_dump version 14.19 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


--
-- Name: fill_id_empenho_1(integer); Type: PROCEDURE; Schema: public; Owner: nemesis
--

CREATE PROCEDURE public.fill_id_empenho_1(IN batch_size integer)
    LANGUAGE plpgsql
    AS $$
DECLARE
  updated int;
  remaining bigint;
  processed bigint := 0;
  total_before bigint;
BEGIN
  SELECT COUNT(*) INTO total_before FROM empenho_distancias WHERE id_empenho_1 IS NULL;

  LOOP
    WITH batch AS (
      SELECT d.ctid AS rid, e.id
      FROM empenho_distancias d
      JOIN empenhos e ON d.idempenho_1 = e.idempenho
      WHERE d.id_empenho_1 IS NULL
      LIMIT batch_size
    )
    UPDATE empenho_distancias d
    SET id_empenho_1 = b.id
    FROM batch b
    WHERE d.ctid = b.rid;

    GET DIAGNOSTICS updated = ROW_COUNT;
    EXIT WHEN updated = 0;

    processed := processed + updated;
    SELECT COUNT(*) INTO remaining FROM empenho_distancias WHERE id_empenho_1 IS NULL;

    RAISE NOTICE '[id_empenho_1] Lote: %, processados: % (%.2f %%), faltam: %',
      updated, processed,
      CASE WHEN total_before > 0 THEN processed::numeric * 100 / total_before ELSE 100 END,
      remaining;

    COMMIT;
  END LOOP;
END$$;


ALTER PROCEDURE public.fill_id_empenho_1(IN batch_size integer) OWNER TO nemesis;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: clusters_fracionamento; Type: TABLE; Schema: public; Owner: nemesis
--

CREATE TABLE public.clusters_fracionamento (
    cluster_id bigint,
    cluster_size integer,
    soma_cluster numeric(18,2),
    min_sim double precision,
    max_sim double precision,
    ano integer,
    ente text,
    idunid bigint,
    elemdespesatce text,
    credor text,
    idempenho character varying,
    data date,
    valor numeric(18,2),
    historico text,
    data_processamento timestamp without time zone DEFAULT now(),
    id_empenho bigint
);


ALTER TABLE public.clusters_fracionamento OWNER TO nemesis;

--
-- Name: empenho_distancias; Type: TABLE; Schema: public; Owner: nemesis
--

CREATE TABLE public.empenho_distancias (
    ente character varying NOT NULL,
    idunid bigint NOT NULL,
    ano integer NOT NULL,
    elemdespesatce character varying NOT NULL,
    idempenho_1 character varying NOT NULL,
    idempenho_2 character varying NOT NULL,
    similaridade double precision NOT NULL,
    id_empenho_1 bigint,
    id_empenho_2 bigint
);


ALTER TABLE public.empenho_distancias OWNER TO nemesis;

--
-- Name: empenho_embeddings; Type: TABLE; Schema: public; Owner: nemesis
--

CREATE TABLE public.empenho_embeddings (
    idempenho character varying NOT NULL,
    embedding public.vector(384),
    embedding_reduced public.vector(3),
    embedding_array real[],
    id_empenho bigint
);


ALTER TABLE public.empenho_embeddings OWNER TO nemesis;

--
-- Name: empenhos; Type: TABLE; Schema: public; Owner: nemesis
--

CREATE TABLE public.empenhos (
    idempenho character varying NOT NULL,
    ano integer,
    vlr_anulacaoempenho numeric(18,2),
    cdfontetce bigint,
    cdfonteug bigint,
    cnpjraiz character varying(8),
    cpfcnpjcredorqtnrs smallint,
    cpfcnpjcredor character varying(14),
    credor text,
    dtempenho date,
    defontetce text,
    defonteug text,
    deprograma text,
    deprojativ text,
    dtanomes integer,
    elemento bigint,
    elemdespesatce text,
    elemdespesaug text,
    ente text,
    esfera text,
    funcao text,
    historico text,
    idcontrato character varying,
    idfonte bigint,
    idfuncao bigint,
    id_orgao numeric(20,0),
    idprograma bigint,
    idsubfuncao bigint,
    idunid bigint,
    idorgao numeric(20,0),
    nrfonte bigint,
    nrfonteug bigint,
    nrlicitacao character varying,
    nrprojativ bigint,
    nrempenho bigint,
    progtrab text,
    progtrabred text,
    projativ text,
    subfuncao text,
    tp_empenho text,
    unidade text,
    vlr_empenho numeric(18,2),
    vlr_anul_liquidacao numeric(18,2),
    vlr_liquidacao numeric(18,2),
    vlr_pagto numeric(18,2),
    vlr_retencao numeric(18,2),
    vlr_subempenho numeric(18,2),
    vlr_empenhado numeric(18,2),
    vlr_liquidado numeric(18,2),
    vlr_pago numeric(18,2),
    cgelem bigint,
    cgprogtrab bigint,
    cgigual boolean,
    cod_elem numeric(18,2),
    cod_pt bigint,
    cg bigint,
    cgtitulo text,
    cgdesc text,
    cgtittce text,
    cgfreq bigint,
    cglevel text,
    cgpai bigint,
    cgroot bigint,
    cgchild bigint,
    id_jurisdicionado integer,
    id bigint NOT NULL
);


ALTER TABLE public.empenhos OWNER TO nemesis;

--
-- Name: empenhos_id_seq; Type: SEQUENCE; Schema: public; Owner: nemesis
--

CREATE SEQUENCE public.empenhos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.empenhos_id_seq OWNER TO nemesis;

--
-- Name: empenhos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nemesis
--

ALTER SEQUENCE public.empenhos_id_seq OWNED BY public.empenhos.id;


--
-- Name: jurisdicionados; Type: TABLE; Schema: public; Owner: nemesis
--

CREATE TABLE public.jurisdicionados (
    id integer NOT NULL,
    nome text NOT NULL,
    id_municipio integer NOT NULL
);


ALTER TABLE public.jurisdicionados OWNER TO nemesis;

--
-- Name: jurisdicionados_id_seq; Type: SEQUENCE; Schema: public; Owner: nemesis
--

CREATE SEQUENCE public.jurisdicionados_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.jurisdicionados_id_seq OWNER TO nemesis;

--
-- Name: jurisdicionados_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nemesis
--

ALTER SEQUENCE public.jurisdicionados_id_seq OWNED BY public.jurisdicionados.id;


--
-- Name: municipios; Type: TABLE; Schema: public; Owner: nemesis
--

CREATE TABLE public.municipios (
    id integer NOT NULL,
    nome text NOT NULL
);


ALTER TABLE public.municipios OWNER TO nemesis;

--
-- Name: municipios_id_seq; Type: SEQUENCE; Schema: public; Owner: nemesis
--

CREATE SEQUENCE public.municipios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.municipios_id_seq OWNER TO nemesis;

--
-- Name: municipios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nemesis
--

ALTER SEQUENCE public.municipios_id_seq OWNED BY public.municipios.id;


--
-- Name: variabilidade_cache; Type: TABLE; Schema: public; Owner: nemesis
--

CREATE TABLE public.variabilidade_cache (
    id bigint NOT NULL,
    group_by text NOT NULL,
    group_key text NOT NULL,
    cnpjraiz text NOT NULL,
    min_n integer NOT NULL,
    mode text NOT NULL,
    n_empenhos integer NOT NULL,
    semantic_variability numeric,
    mean_date date,
    total_value numeric,
    computed_at timestamp with time zone DEFAULT now() NOT NULL,
    max_dtempenho date
);


ALTER TABLE public.variabilidade_cache OWNER TO nemesis;

--
-- Name: variabilidade_cache_id_seq; Type: SEQUENCE; Schema: public; Owner: nemesis
--

CREATE SEQUENCE public.variabilidade_cache_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.variabilidade_cache_id_seq OWNER TO nemesis;

--
-- Name: variabilidade_cache_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nemesis
--

ALTER SEQUENCE public.variabilidade_cache_id_seq OWNED BY public.variabilidade_cache.id;


--
-- Name: empenhos id; Type: DEFAULT; Schema: public; Owner: nemesis
--

ALTER TABLE ONLY public.empenhos ALTER COLUMN id SET DEFAULT nextval('public.empenhos_id_seq'::regclass);


--
-- Name: jurisdicionados id; Type: DEFAULT; Schema: public; Owner: nemesis
--

ALTER TABLE ONLY public.jurisdicionados ALTER COLUMN id SET DEFAULT nextval('public.jurisdicionados_id_seq'::regclass);


--
-- Name: municipios id; Type: DEFAULT; Schema: public; Owner: nemesis
--

ALTER TABLE ONLY public.municipios ALTER COLUMN id SET DEFAULT nextval('public.municipios_id_seq'::regclass);


--
-- Name: variabilidade_cache id; Type: DEFAULT; Schema: public; Owner: nemesis
--

ALTER TABLE ONLY public.variabilidade_cache ALTER COLUMN id SET DEFAULT nextval('public.variabilidade_cache_id_seq'::regclass);


--
-- Name: empenho_distancias empenho_distancias_pkey; Type: CONSTRAINT; Schema: public; Owner: nemesis
--

ALTER TABLE ONLY public.empenho_distancias
    ADD CONSTRAINT empenho_distancias_pkey PRIMARY KEY (ente, idunid, ano, elemdespesatce, idempenho_1, idempenho_2);


--
-- Name: empenho_embeddings empenho_embeddings_pkey; Type: CONSTRAINT; Schema: public; Owner: nemesis
--

ALTER TABLE ONLY public.empenho_embeddings
    ADD CONSTRAINT empenho_embeddings_pkey PRIMARY KEY (idempenho);


--
-- Name: empenhos empenhos_idempenho_uk; Type: CONSTRAINT; Schema: public; Owner: nemesis
--

ALTER TABLE ONLY public.empenhos
    ADD CONSTRAINT empenhos_idempenho_uk UNIQUE (idempenho);


--
-- Name: empenhos empenhos_pkey; Type: CONSTRAINT; Schema: public; Owner: nemesis
--

ALTER TABLE ONLY public.empenhos
    ADD CONSTRAINT empenhos_pkey PRIMARY KEY (id);


--
-- Name: jurisdicionados jurisdicionados_pkey; Type: CONSTRAINT; Schema: public; Owner: nemesis
--

ALTER TABLE ONLY public.jurisdicionados
    ADD CONSTRAINT jurisdicionados_pkey PRIMARY KEY (id);


--
-- Name: municipios municipios_nome_key; Type: CONSTRAINT; Schema: public; Owner: nemesis
--

ALTER TABLE ONLY public.municipios
    ADD CONSTRAINT municipios_nome_key UNIQUE (nome);


--
-- Name: municipios municipios_pkey; Type: CONSTRAINT; Schema: public; Owner: nemesis
--

ALTER TABLE ONLY public.municipios
    ADD CONSTRAINT municipios_pkey PRIMARY KEY (id);


--
-- Name: jurisdicionados uq_jurisdicionado; Type: CONSTRAINT; Schema: public; Owner: nemesis
--

ALTER TABLE ONLY public.jurisdicionados
    ADD CONSTRAINT uq_jurisdicionado UNIQUE (nome, id_municipio);


--
-- Name: variabilidade_cache variabilidade_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: nemesis
--

ALTER TABLE ONLY public.variabilidade_cache
    ADD CONSTRAINT variabilidade_cache_pkey PRIMARY KEY (id);


--
-- Name: idx_ano; Type: INDEX; Schema: public; Owner: nemesis
--

CREATE INDEX idx_ano ON public.empenhos USING btree (ano);


--
-- Name: idx_cf_id_empenho; Type: INDEX; Schema: public; Owner: nemesis
--

CREATE INDEX idx_cf_id_empenho ON public.clusters_fracionamento USING btree (id_empenho);


--
-- Name: idx_cnpj; Type: INDEX; Schema: public; Owner: nemesis
--

CREATE INDEX idx_cnpj ON public.empenhos USING btree (cpfcnpjcredor);


--
-- Name: idx_dist_ano_grupo_sim; Type: INDEX; Schema: public; Owner: nemesis
--

CREATE INDEX idx_dist_ano_grupo_sim ON public.empenho_distancias USING btree (ano, ente, idunid, elemdespesatce, similaridade);


--
-- Name: idx_dist_ano_sim; Type: INDEX; Schema: public; Owner: nemesis
--

CREATE INDEX idx_dist_ano_sim ON public.empenho_distancias USING btree (ano, similaridade);


--
-- Name: idx_dist_idempenho_1; Type: INDEX; Schema: public; Owner: nemesis
--

CREATE INDEX idx_dist_idempenho_1 ON public.empenho_distancias USING btree (idempenho_1) WHERE (id_empenho_1 IS NULL);


--
-- Name: idx_empenho_distancias_grupo; Type: INDEX; Schema: public; Owner: nemesis
--

CREATE INDEX idx_empenho_distancias_grupo ON public.empenho_distancias USING btree (ano, ente, idunid, elemdespesatce);


--
-- Name: idx_empenho_distancias_sim; Type: INDEX; Schema: public; Owner: nemesis
--

CREATE INDEX idx_empenho_distancias_sim ON public.empenho_distancias USING btree (ano, idunid, ente, elemdespesatce, similaridade);


--
-- Name: idx_empenhos_idempenho; Type: INDEX; Schema: public; Owner: nemesis
--

CREATE INDEX idx_empenhos_idempenho ON public.empenhos USING btree (idempenho);


--
-- Name: idx_nrlicitacao; Type: INDEX; Schema: public; Owner: nemesis
--

CREATE INDEX idx_nrlicitacao ON public.empenhos USING btree (nrlicitacao);


--
-- Name: idx_variabilidade_cache_computed_at; Type: INDEX; Schema: public; Owner: nemesis
--

CREATE INDEX idx_variabilidade_cache_computed_at ON public.variabilidade_cache USING btree (computed_at);


--
-- Name: uq_variabilidade_cache_key; Type: INDEX; Schema: public; Owner: nemesis
--

CREATE UNIQUE INDEX uq_variabilidade_cache_key ON public.variabilidade_cache USING btree (group_by, group_key, cnpjraiz, min_n, mode);


--
-- Name: clusters_fracionamento fk_clusters_fracionamento_id_empenho; Type: FK CONSTRAINT; Schema: public; Owner: nemesis
--

ALTER TABLE ONLY public.clusters_fracionamento
    ADD CONSTRAINT fk_clusters_fracionamento_id_empenho FOREIGN KEY (id_empenho) REFERENCES public.empenhos(id);


--
-- Name: empenhos fk_jurisdicionado; Type: FK CONSTRAINT; Schema: public; Owner: nemesis
--

ALTER TABLE ONLY public.empenhos
    ADD CONSTRAINT fk_jurisdicionado FOREIGN KEY (id_jurisdicionado) REFERENCES public.jurisdicionados(id);


--
-- Name: jurisdicionados fk_municipio; Type: FK CONSTRAINT; Schema: public; Owner: nemesis
--

ALTER TABLE ONLY public.jurisdicionados
    ADD CONSTRAINT fk_municipio FOREIGN KEY (id_municipio) REFERENCES public.municipios(id);


--
-- PostgreSQL database dump complete
--

\unrestrict 5whMsSIB6T0h72R44ZMNwFyM1ZjsM0yTvwBwMlzA8rnNcbBMVPen3gwS4JvgU2s

