import { AbstractDriver } from "./AbstractDriver";
import * as PG from "pg";
import { ColumnInfo } from "../models/ColumnInfo";
import { EntityInfo } from "../models/EntityInfo";
import * as TomgUtils from "../Utils";
import { IndexInfo } from "../models/IndexInfo";
import { IndexColumnInfo } from "../models/IndexColumnInfo";
import { RelationTempInfo } from "../models/RelationTempInfo";

export class PostgresDriver extends AbstractDriver {
    private Connection: PG.Client;

    GetAllTablesQuery = async (schema: string) => {
        let response: {
            TABLE_SCHEMA: string;
            TABLE_NAME: string;
        }[] = (await this.Connection.query(
            `SELECT table_schema as "TABLE_SCHEMA",table_name as "TABLE_NAME" FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE' AND table_schema in (${schema}) `
        )).rows;
        return response;
    };

    async GetCoulmnsFromEntity(
        entities: EntityInfo[],
        schema: string
    ): Promise<EntityInfo[]> {
        let response: {
            table_name: string;
            column_name: string;
            udt_name: string;
            column_default: string;
            is_nullable: string;
            data_type: string;
            character_maximum_length: number;
            numeric_precision: number;
            numeric_scale: number;
            isidentity: string;
            isunique: number;
        }[] = (await this.Connection
            .query(`SELECT table_name,column_name,udt_name,column_default,is_nullable,
            data_type,character_maximum_length,numeric_precision,numeric_scale,
            case when column_default LIKE 'nextval%' then 'YES' else 'NO' end isidentity,
			(SELECT count(*)
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
        inner join INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE cu
            on cu.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
    where
        tc.CONSTRAINT_TYPE = 'UNIQUE'
        and tc.TABLE_NAME = c.TABLE_NAME
        and cu.COLUMN_NAME = c.COLUMN_NAME
        and tc.TABLE_SCHEMA=c.TABLE_SCHEMA) IsUnique
            FROM INFORMATION_SCHEMA.COLUMNS c where table_schema in (${schema})`))
            .rows;
        entities.forEach(ent => {
            response
                .filter(filterVal => {
                    return filterVal.table_name == ent.EntityName;
                })
                .forEach(resp => {
                    let colInfo: ColumnInfo = new ColumnInfo();
                    colInfo.tsName = resp.column_name;
                    colInfo.sqlName = resp.column_name;
                    colInfo.is_nullable = resp.is_nullable == "YES";
                    colInfo.is_generated = resp.isidentity == "YES";
                    colInfo.is_unique = resp.isunique == 1;
                    colInfo.default = colInfo.is_generated
                        ? null
                        : resp.column_default;

                    var columnTypes = this.MatchColumnTypes(
                        resp.data_type,
                        resp.udt_name
                    );
                    if (!columnTypes.sql_type || !columnTypes.ts_type) {
                        if (
                            resp.data_type == "USER-DEFINED" ||
                            resp.data_type == "ARRAY"
                        ) {
                            TomgUtils.LogError(
                                `Unknown ${resp.data_type} column type: ${
                                    resp.udt_name
                                }  table name: ${
                                    resp.table_name
                                } column name: ${resp.column_name}`
                            );
                        } else {
                            TomgUtils.LogError(
                                `Unknown column type: ${
                                    resp.data_type
                                }  table name: ${
                                    resp.table_name
                                } column name: ${resp.column_name}`
                            );
                        }
                        return;
                    }
                    colInfo.sql_type = columnTypes.sql_type;
                    colInfo.ts_type = columnTypes.ts_type;
                    colInfo.is_array = columnTypes.is_array;
                    if (colInfo.is_array) {
                        colInfo.ts_type = <any>colInfo.ts_type
                            .split("|")
                            .map(x => x.replace("|", "").trim() + "[]")
                            .join(" | ");
                    }

                    if (
                        this.ColumnTypesWithPrecision.some(
                            v => v == colInfo.sql_type
                        )
                    ) {
                        colInfo.numericPrecision = resp.numeric_precision;
                        colInfo.numericScale = resp.numeric_scale;
                    }
                    if (
                        this.ColumnTypesWithLength.some(
                            v => v == colInfo.sql_type
                        )
                    ) {
                        colInfo.lenght =
                            resp.character_maximum_length > 0
                                ? resp.character_maximum_length
                                : null;
                    }
                    if (
                        this.ColumnTypesWithWidth.some(
                            v => v == colInfo.sql_type
                        )
                    ) {
                        colInfo.width =
                            resp.character_maximum_length > 0
                                ? resp.character_maximum_length
                                : null;
                    }
                    if (colInfo.sql_type && colInfo.ts_type) {
                        ent.Columns.push(colInfo);
                    }
                });
        });
        return entities;
    }

    MatchColumnTypes(data_type: string, udt_name: string) {
        let ret: {
            ts_type:
                | "number"
                | "string"
                | "boolean"
                | "Date"
                | "Buffer"
                | "Object"
                | "string | Object"
                | "string | string[]"
                | "any"
                | null;
            sql_type: string | null;
            is_array: boolean;
        } = { ts_type: null, sql_type: null, is_array: false };
        ret.sql_type = data_type;
        switch (data_type) {
            case "int2":
                ret.ts_type = "number";
                break;
            case "int4":
                ret.ts_type = "number";
                break;
            case "int8":
                ret.ts_type = "string";
                break;
            case "smallint":
                ret.ts_type = "number";
                break;
            case "integer":
                ret.ts_type = "number";
                break;
            case "bigint":
                ret.ts_type = "string";
                break;
            case "decimal":
                ret.ts_type = "string";
                break;
            case "numeric":
                ret.ts_type = "string";
                break;
            case "real":
                ret.ts_type = "number";
                break;
            case "float":
                ret.ts_type = "number";
                break;
            case "float4":
                ret.ts_type = "number";
                break;
            case "float8":
                ret.ts_type = "number";
                break;
            case "double precision":
                ret.ts_type = "number";
                break;
            case "money":
                ret.ts_type = "string";
                break;
            case "character varying":
                ret.ts_type = "string";
                break;
            case "varchar":
                ret.ts_type = "string";
                break;
            case "character":
                ret.ts_type = "string";
                break;
            case "char":
                ret.ts_type = "string";
                break;
            case "bpchar":
                ret.sql_type = "char";
                ret.ts_type = "string";
                break;
            case "text":
                ret.ts_type = "string";
                break;
            case "citext":
                ret.ts_type = "string";
                break;
            case "hstore":
                ret.ts_type = "string";
                break;
            case "bytea":
                ret.ts_type = "Buffer";
                break;
            case "bit":
                ret.ts_type = "string";
                break;
            case "varbit":
                ret.ts_type = "string";
                break;
            case "bit varying":
                ret.ts_type = "string";
                break;
            case "timetz":
                ret.ts_type = "string";
                break;
            case "timestamptz":
                ret.ts_type = "Date";
                break;
            case "timestamp":
                ret.ts_type = "string";
                break;
            case "timestamp without time zone":
                ret.ts_type = "Date";
                break;
            case "timestamp with time zone":
                ret.ts_type = "Date";
                break;
            case "date":
                ret.ts_type = "string";
                break;
            case "time":
                ret.ts_type = "string";
                break;
            case "time without time zone":
                ret.ts_type = "string";
                break;
            case "time with time zone":
                ret.ts_type = "string";
                break;
            case "interval":
                ret.ts_type = "any";
                break;
            case "bool":
                ret.ts_type = "boolean";
                break;
            case "boolean":
                ret.ts_type = "boolean";
                break;
            case "enum":
                ret.ts_type = "string";
                break;
            case "point":
                ret.ts_type = "string | Object";
                break;
            case "line":
                ret.ts_type = "string";
                break;
            case "lseg":
                ret.ts_type = "string | string[]";
                break;
            case "box":
                ret.ts_type = "string | Object";
                break;
            case "path":
                ret.ts_type = "string";
                break;
            case "polygon":
                ret.ts_type = "string";
                break;
            case "circle":
                ret.ts_type = "string | Object";
                break;
            case "cidr":
                ret.ts_type = "string";
                break;
            case "inet":
                ret.ts_type = "string";
                break;
            case "macaddr":
                ret.ts_type = "string";
                break;
            case "tsvector":
                ret.ts_type = "string";
                break;
            case "tsquery":
                ret.ts_type = "string";
                break;
            case "uuid":
                ret.ts_type = "string";
                break;
            case "xml":
                ret.ts_type = "string";
                break;
            case "json":
                ret.ts_type = "Object";
                break;
            case "jsonb":
                ret.ts_type = "Object";
                break;
            case "int4range":
                ret.ts_type = "string";
                break;
            case "int8range":
                ret.ts_type = "string";
                break;
            case "numrange":
                ret.ts_type = "string";
                break;
            case "tsrange":
                ret.ts_type = "string";
                break;
            case "tstzrange":
                ret.ts_type = "string";
                break;
            case "daterange":
                ret.ts_type = "string";
                break;
            case "ARRAY":
                let z = this.MatchColumnTypes(udt_name.substring(1), udt_name);
                ret.ts_type = z.ts_type;
                ret.sql_type = z.sql_type;
                ret.is_array = true;
                break;
            case "USER-DEFINED":
                ret.sql_type = udt_name;
                ret.ts_type = "string";
                switch (udt_name) {
                    case "citext":
                    case "hstore":
                    case "geometry":
                        break;
                    default:
                        ret.ts_type = null;
                        ret.sql_type = null;
                        break;
                }
                break;
            default:
                ret.ts_type = null;
                ret.sql_type = null;
                break;
        }
        return ret;
    }

    async GetIndexesFromEntity(
        entities: EntityInfo[],
        schema: string
    ): Promise<EntityInfo[]> {
        let response: {
            tablename: string;
            indexname: string;
            columnname: string;
            is_unique: number;
            is_primary_key: number;
        }[] = (await this.Connection.query(`SELECT
        c.relname AS tablename,
        i.relname as indexname,
        f.attname AS columnname,
        CASE
            WHEN ix.indisunique = true THEN '1'
            ELSE '0'
        END AS is_unique,
        CASE
            WHEN ix.indisprimary='true' THEN '1'
            ELSE '0'
        END AS is_primary_key
        FROM pg_attribute f
        JOIN pg_class c ON c.oid = f.attrelid
        JOIN pg_type t ON t.oid = f.atttypid
        LEFT JOIN pg_attrdef d ON d.adrelid = c.oid AND d.adnum = f.attnum
        LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
        LEFT JOIN pg_index AS ix ON f.attnum = ANY(ix.indkey) and c.oid = f.attrelid and c.oid = ix.indrelid
        LEFT JOIN pg_class AS i ON ix.indexrelid = i.oid
        WHERE c.relkind = 'r'::char
        AND n.nspname in (${schema})
        AND f.attnum > 0
        AND i.oid<>0
        ORDER BY c.relname,f.attname;`)).rows;
        entities.forEach(ent => {
            response
                .filter(filterVal => {
                    return filterVal.tablename == ent.EntityName;
                })
                .forEach(resp => {
                    let indexInfo: IndexInfo = <IndexInfo>{};
                    let indexColumnInfo: IndexColumnInfo = <IndexColumnInfo>{};
                    if (
                        ent.Indexes.filter(filterVal => {
                            return filterVal.name == resp.indexname;
                        }).length > 0
                    ) {
                        indexInfo = ent.Indexes.filter(filterVal => {
                            return filterVal.name == resp.indexname;
                        })[0];
                    } else {
                        indexInfo.columns = <IndexColumnInfo[]>[];
                        indexInfo.name = resp.indexname;
                        indexInfo.isUnique = resp.is_unique == 1;
                        indexInfo.isPrimaryKey = resp.is_primary_key == 1;
                        ent.Indexes.push(indexInfo);
                    }
                    indexColumnInfo.name = resp.columnname;
                    if (resp.is_primary_key == 0) {
                        indexInfo.isPrimaryKey = false;
                    }
                    indexInfo.columns.push(indexColumnInfo);
                });
        });

        return entities;
    }

    async GetRelations(
        entities: EntityInfo[],
        schema: string
    ): Promise<EntityInfo[]> {
        let response: {
            tablewithforeignkey: string;
            fk_partno: number;
            foreignkeycolumn: string;
            tablereferenced: string;
            foreignkeycolumnreferenced: string;
            ondelete: "RESTRICT" | "CASCADE" | "SET NULL" | "NO ACTION";
            onupdate: "RESTRICT" | "CASCADE" | "SET NULL" | "NO ACTION";
            object_id: string;
        }[] = (await this.Connection.query(`SELECT
            con.relname AS tablewithforeignkey,
            att.attnum as fk_partno,
                 att2.attname AS foreignkeycolumn,
              cl.relname AS tablereferenced,
              att.attname AS foreignkeycolumnreferenced,
              delete_rule as ondelete,
              update_rule as onupdate,
                con.conname as object_id
               FROM (
                   SELECT
                     unnest(con1.conkey) AS parent,
                     unnest(con1.confkey) AS child,
                     con1.confrelid,
                     con1.conrelid,
                     cl_1.relname,
                   con1.conname
                   FROM
                     pg_class cl_1,
                     pg_namespace ns,
                     pg_constraint con1
                   WHERE
                     con1.contype = 'f'::"char"
                     AND cl_1.relnamespace = ns.oid
                     AND con1.conrelid = cl_1.oid
                     and nspname in (${schema})
              ) con,
                pg_attribute att,
                pg_class cl,
                pg_attribute att2,
                information_schema.referential_constraints rc
              WHERE
                att.attrelid = con.confrelid
                AND att.attnum = con.child
                AND cl.oid = con.confrelid
                AND att2.attrelid = con.conrelid
                AND att2.attnum = con.parent
                and rc.constraint_name= con.conname`)).rows;
        let relationsTemp: RelationTempInfo[] = <RelationTempInfo[]>[];
        response.forEach(resp => {
            let rels = relationsTemp.find(val => {
                return val.object_id == resp.object_id;
            });
            if (rels == undefined) {
                rels = <RelationTempInfo>{};
                rels.ownerColumnsNames = [];
                rels.referencedColumnsNames = [];
                rels.actionOnDelete =
                    resp.ondelete == "NO ACTION" ? null : resp.ondelete;
                rels.actionOnUpdate =
                    resp.onupdate == "NO ACTION" ? null : resp.onupdate;
                rels.object_id = resp.object_id;
                rels.ownerTable = resp.tablewithforeignkey;
                rels.referencedTable = resp.tablereferenced;
                relationsTemp.push(rels);
            }
            rels.ownerColumnsNames.push(resp.foreignkeycolumn);
            rels.referencedColumnsNames.push(resp.foreignkeycolumnreferenced);
        });
        entities = this.GetRelationsFromRelationTempInfo(
            relationsTemp,
            entities
        );
        return entities;
    }

    async DisconnectFromServer() {
        if (this.Connection) {
            let promise = new Promise<boolean>((resolve, reject) => {
                this.Connection.end(err => {
                    if (!err) {
                        resolve(true);
                    } else {
                        TomgUtils.LogError(
                            "Error connecting to Postgres Server.",
                            false,
                            err.message
                        );
                        reject(err);
                    }
                });
            });
            await promise;
        }
    }

    async ConnectToServer(
        database: string,
        server: string,
        port: number,
        user: string,
        password: string,
        ssl: boolean
    ) {
        this.Connection = new PG.Client({
            database: database,
            host: server,
            port: port,
            user: user,
            password: password,
            ssl: ssl
        });

        let promise = new Promise<boolean>((resolve, reject) => {
            this.Connection.connect(err => {
                if (!err) {
                    resolve(true);
                } else {
                    TomgUtils.LogError(
                        "Error connecting to Postgres Server.",
                        false,
                        err.message
                    );
                    reject(err);
                }
            });
        });

        await promise;
    }

    async CreateDB(dbName: string) {
        await this.Connection.query(`CREATE DATABASE ${dbName}; `);
    }

    async UseDB(dbName: string) {
        await this.Connection.query(`USE ${dbName}; `);
    }

    async DropDB(dbName: string) {
        await this.Connection.query(`DROP DATABASE ${dbName}; `);
    }

    async CheckIfDBExists(dbName: string): Promise<boolean> {
        let resp = await this.Connection.query(
            `SELECT datname FROM pg_database  WHERE datname  ='${dbName}' `
        );
        return resp.rowCount > 0;
    }
}
