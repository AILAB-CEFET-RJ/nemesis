from fastapi import APIRouter, HTTPException, Query
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
import pandas as pd
from sqlalchemy import text
from routes.db import engine

router = APIRouter()


@router.get("/api/variabilidade-semantica")
def get_variabilidade_semantica(
    group_by: str = Query("ente", pattern="^(ente|jurisdicionado)$"),
    min_n: int = Query(5, ge=2),
    max_n: int = Query(50, ge=2),
    limit: int = Query(200, ge=1, le=10000),
    offset: int = Query(0, ge=0),
    group_key: str | None = Query(default=None),
    cnpjraiz: str | None = Query(default=None),
):
    """
    Variabilidade semantica administrativa:
    mede consistencia de descricoes ("historico") de um jurisdicionado
    ao registrar compras semelhantes para o mesmo fornecedor (cnpjraiz).
    """
    if group_by not in ("ente", "jurisdicionado"):
        raise HTTPException(status_code=400, detail="group_by deve ser 'ente' ou 'jurisdicionado'.")

    group_col = "ente" if group_by == "ente" else "idunid"
    group_label_col = None if group_by == "ente" else "unidade"
    filters = [
        "e.cnpjraiz IS NOT NULL",
        f"e.{group_col} IS NOT NULL",
    ]
    if max_n < min_n:
        raise HTTPException(status_code=400, detail="max_n deve ser maior ou igual a min_n.")

    params = {"min_n": min_n, "max_n": max_n, "limit": limit, "offset": offset}

    if cnpjraiz:
        filters.append("e.cnpjraiz = :cnpjraiz")
        params["cnpjraiz"] = cnpjraiz
    if group_key:
        filters.append(f"e.{group_col}::text = :group_key")
        params["group_key"] = group_key

    where_clause = " AND ".join(filters)

    query = text(
        f"""
        WITH base AS (
            SELECT
                e.id,
                e.{group_col} AS group_key,
                {f"e.{group_label_col} AS group_label," if group_label_col else ""}
                e.cnpjraiz,
                e.dtempenho,
                e.vlr_empenhado,
                emb.embedding
            FROM empenhos e
            JOIN empenho_embeddings emb ON emb.id_empenho = e.id
            WHERE {where_clause}
        ),
        counts AS (
            SELECT
                group_key,
                {f"MAX(group_label) AS group_label," if group_label_col else ""}
                cnpjraiz,
                COUNT(*) AS n_empenhos,
                to_timestamp(AVG(EXTRACT(EPOCH FROM dtempenho)))::date AS mean_date,
                SUM(vlr_empenhado) AS total_value
            FROM base
            GROUP BY group_key, cnpjraiz
                HAVING COUNT(*) >= :min_n AND COUNT(*) <= :max_n
        ),
        filtered AS (
            SELECT b.*
            FROM base b
            JOIN counts c
              ON c.group_key = b.group_key
             AND c.cnpjraiz = b.cnpjraiz
        ),
        paired AS (
            SELECT
                f1.group_key,
                f1.cnpjraiz,
                (f1.embedding <=> f2.embedding) AS cos_dist
            FROM filtered f1
            JOIN filtered f2
              ON f1.group_key = f2.group_key
             AND f1.cnpjraiz = f2.cnpjraiz
             AND f1.id < f2.id
        ),
        stats AS (
            SELECT
                group_key,
                cnpjraiz,
                AVG(cos_dist) AS semantic_variability
            FROM paired
            GROUP BY group_key, cnpjraiz
        )
        SELECT
            c.group_key,
            {f"c.group_label," if group_label_col else ""}
            c.cnpjraiz,
            c.n_empenhos,
            s.semantic_variability,
            c.mean_date,
            c.total_value
        FROM counts c
        JOIN stats s
          ON s.group_key = c.group_key
         AND s.cnpjraiz = c.cnpjraiz
        ORDER BY s.semantic_variability DESC
        LIMIT :limit OFFSET :offset;
        """
    )

    agg = None
    with engine.connect() as conn:
        if group_key and cnpjraiz:
            agg_query = text(
                f"""
                SELECT
                    COUNT(*) AS n_empenhos,
                    MAX(e.dtempenho) AS max_dtempenho,
                    {f"MAX(e.{group_label_col}) AS group_label," if group_label_col else ""}
                    to_timestamp(AVG(EXTRACT(EPOCH FROM e.dtempenho)))::date AS mean_date,
                    SUM(e.vlr_empenhado) AS total_value
                FROM empenhos e
                JOIN empenho_embeddings emb ON emb.id_empenho = e.id
                WHERE e.cnpjraiz = :cnpjraiz
                  AND e.{group_col}::text = :group_key
                """
            )
            agg = conn.execute(agg_query, {"cnpjraiz": cnpjraiz, "group_key": group_key}).mappings().first()
            if not agg or agg["n_empenhos"] < min_n or agg["n_empenhos"] > max_n:
                return JSONResponse(content=[])

            cache_query = text(
                """
                SELECT
                    group_by,
                    group_key,
                    cnpjraiz,
                    min_n,
                    mode,
                    n_empenhos,
                    semantic_variability,
                    mean_date,
                    total_value,
                    max_dtempenho
                FROM variabilidade_cache
                WHERE group_by = :group_by
                  AND group_key = :group_key
                  AND cnpjraiz = :cnpjraiz
                  AND min_n = :min_n
                  AND mode = 'pairwise'
                """
            )
            cache = conn.execute(
                cache_query,
                {
                    "group_by": group_by,
                    "group_key": group_key,
                    "cnpjraiz": cnpjraiz,
                    "min_n": min_n,
                },
            ).mappings().first()

            if cache and cache["n_empenhos"] == agg["n_empenhos"] and cache["max_dtempenho"] == agg["max_dtempenho"]:
                cached_payload = jsonable_encoder(
                    [
                        {
                            "group_key": cache["group_key"],
                            "group_label": agg.get("group_label"),
                            "cnpjraiz": cache["cnpjraiz"],
                            "n_empenhos": cache["n_empenhos"],
                            "semantic_variability": cache["semantic_variability"],
                            "mean_date": agg["mean_date"],
                            "total_value": agg["total_value"],
                        }
                    ]
                )
                return JSONResponse(content=cached_payload)

        df = pd.read_sql(query, conn, params=params)

    if group_key and cnpjraiz and not df.empty:
        row = df.iloc[0].to_dict()
        with engine.begin() as write_conn:
            write_conn.execute(
                text(
                    """
                    INSERT INTO variabilidade_cache (
                        group_by,
                        group_key,
                        cnpjraiz,
                        min_n,
                        mode,
                        n_empenhos,
                        semantic_variability,
                        mean_date,
                        total_value,
                        computed_at,
                        max_dtempenho
                    ) VALUES (
                        :group_by,
                        :group_key,
                        :cnpjraiz,
                        :min_n,
                        'pairwise',
                        :n_empenhos,
                        :semantic_variability,
                        :mean_date,
                        :total_value,
                        now(),
                        :max_dtempenho
                    )
                    ON CONFLICT (group_by, group_key, cnpjraiz, min_n, mode)
                    DO UPDATE SET
                        n_empenhos = EXCLUDED.n_empenhos,
                        semantic_variability = EXCLUDED.semantic_variability,
                        mean_date = EXCLUDED.mean_date,
                        total_value = EXCLUDED.total_value,
                        computed_at = now(),
                        max_dtempenho = EXCLUDED.max_dtempenho
                    """
                ),
                {
                    "group_by": group_by,
                    "group_key": row["group_key"],
                    "cnpjraiz": row["cnpjraiz"],
                    "min_n": min_n,
                    "n_empenhos": row["n_empenhos"],
                    "semantic_variability": row["semantic_variability"],
                    "mean_date": row["mean_date"],
                    "total_value": row["total_value"],
                    "max_dtempenho": agg["max_dtempenho"] if agg else None,
                },
            )

    payload = jsonable_encoder(df.to_dict(orient="records"))
    return JSONResponse(content=payload)


@router.get("/api/variabilidade-semantica/empenhos")
def get_empenhos_variabilidade(
    group_by: str = Query("ente", pattern="^(ente|jurisdicionado)$"),
    group_key: str = Query(...),
    cnpjraiz: str = Query(...),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    order_by: str = Query("dtempenho", pattern="^(dtempenho|vlr_empenhado|idempenho)$"),
    order_dir: str = Query("desc", pattern="^(asc|desc)$"),
):
    if group_by not in ("ente", "jurisdicionado"):
        raise HTTPException(status_code=400, detail="group_by deve ser 'ente' ou 'jurisdicionado'.")

    group_col = "ente" if group_by == "ente" else "idunid"
    order_col = {"dtempenho": "e.dtempenho", "vlr_empenhado": "e.vlr_empenhado", "idempenho": "e.idempenho"}[order_by]
    order_direction = "ASC" if order_dir == "asc" else "DESC"

    query = text(
        f"""
        SELECT
            e.id,
            e.idempenho,
            e.ente,
            e.idorgao,
            e.unidade,
            e.idunid,
            e.credor,
            e.cnpjraiz,
            e.elemdespesatce,
            e.dtempenho,
            e.vlr_empenhado,
            e.historico
        FROM empenhos e
        WHERE e.cnpjraiz = :cnpjraiz
          AND e.{group_col}::text = :group_key
        ORDER BY {order_col} {order_direction}
        LIMIT :limit OFFSET :offset;
        """
    )

    with engine.connect() as conn:
        df = pd.read_sql(
            query,
            conn,
            params={
                "cnpjraiz": cnpjraiz,
                "group_key": group_key,
                "limit": limit,
                "offset": offset,
            },
        )

    payload = jsonable_encoder(df.to_dict(orient="records"))
    return JSONResponse(content=payload)
