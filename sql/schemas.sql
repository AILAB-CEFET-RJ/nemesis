--
-- PostgreSQL database dump
--

-- restrict fIhe4441NWSL63qUW3XY1frQhQJhtqjZmCGCiR6WarRGk3mIYe5NnvMRW8feA9K

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: clusters_fracionamento; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.clusters_fracionamento (
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
    data_processamento timestamp without time zone DEFAULT now()
);


--
-- Name: empenho_distancias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.empenho_distancias (
    ente character varying NOT NULL,
    idunid bigint NOT NULL,
    ano integer NOT NULL,
    elemdespesatce character varying NOT NULL,
    idempenho_1 character varying NOT NULL,
    idempenho_2 character varying NOT NULL,
    similaridade double precision NOT NULL
);


--
-- Name: empenho_embeddings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.empenho_embeddings (
    idempenho character varying NOT NULL,
    embedding public.vector(384),
    embedding_reduced public.vector(3),
    embedding_array real[]
);


--
-- Name: empenhos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.empenhos (
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
    id_jurisdicionado integer
);


--
-- Name: jurisdicionados; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.jurisdicionados (
    id integer NOT NULL,
    nome text NOT NULL,
    id_municipio integer NOT NULL
);


--
-- Name: jurisdicionados_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.jurisdicionados_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: jurisdicionados_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.jurisdicionados_id_seq OWNED BY public.jurisdicionados.id;


--
-- Name: municipios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.municipios (
    id integer NOT NULL,
    nome text NOT NULL
);


--
-- Name: municipios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.municipios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: municipios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.municipios_id_seq OWNED BY public.municipios.id;


--
-- Name: jurisdicionados id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jurisdicionados ALTER COLUMN id SET DEFAULT nextval('public.jurisdicionados_id_seq'::regclass);


--
-- Name: municipios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.municipios ALTER COLUMN id SET DEFAULT nextval('public.municipios_id_seq'::regclass);


--
-- Name: empenho_distancias empenho_distancias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empenho_distancias
    ADD CONSTRAINT empenho_distancias_pkey PRIMARY KEY (ente, idunid, ano, elemdespesatce, idempenho_1, idempenho_2);


--
-- Name: empenho_embeddings empenho_embeddings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empenho_embeddings
    ADD CONSTRAINT empenho_embeddings_pkey PRIMARY KEY (idempenho);


--
-- Name: empenhos empenhos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empenhos
    ADD CONSTRAINT empenhos_pkey PRIMARY KEY (idempenho);


--
-- Name: jurisdicionados jurisdicionados_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jurisdicionados
    ADD CONSTRAINT jurisdicionados_pkey PRIMARY KEY (id);


--
-- Name: municipios municipios_nome_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.municipios
    ADD CONSTRAINT municipios_nome_key UNIQUE (nome);


--
-- Name: municipios municipios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.municipios
    ADD CONSTRAINT municipios_pkey PRIMARY KEY (id);


--
-- Name: jurisdicionados uq_jurisdicionado; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jurisdicionados
    ADD CONSTRAINT uq_jurisdicionado UNIQUE (nome, id_municipio);


--
-- Name: idx_ano; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ano ON public.empenhos USING btree (ano);


--
-- Name: idx_cnpj; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cnpj ON public.empenhos USING btree (cpfcnpjcredor);


--
-- Name: idx_dist_ano_grupo_sim; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dist_ano_grupo_sim ON public.empenho_distancias USING btree (ano, ente, idunid, elemdespesatce, similaridade);


--
-- Name: idx_dist_ano_sim; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dist_ano_sim ON public.empenho_distancias USING btree (ano, similaridade);


--
-- Name: idx_empenho_distancias_grupo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_empenho_distancias_grupo ON public.empenho_distancias USING btree (ano, ente, idunid, elemdespesatce);


--
-- Name: idx_empenho_distancias_sim; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_empenho_distancias_sim ON public.empenho_distancias USING btree (ano, idunid, ente, elemdespesatce, similaridade);


--
-- Name: idx_nrlicitacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nrlicitacao ON public.empenhos USING btree (nrlicitacao);


--
-- Name: empenhos fk_jurisdicionado; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empenhos
    ADD CONSTRAINT fk_jurisdicionado FOREIGN KEY (id_jurisdicionado) REFERENCES public.jurisdicionados(id);


--
-- Name: jurisdicionados fk_municipio; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jurisdicionados
    ADD CONSTRAINT fk_municipio FOREIGN KEY (id_municipio) REFERENCES public.municipios(id);


--
-- PostgreSQL database dump complete
--

\unrestrict fIhe4441NWSL63qUW3XY1frQhQJhtqjZmCGCiR6WarRGk3mIYe5NnvMRW8feA9K

