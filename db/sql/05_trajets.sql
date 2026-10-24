DROP TABLE IF EXISTS trajets;
CREATE TABLE trajets (
    id serial CONSTRAINT pkey_trajets_id PRIMARY KEY,
    id_bateau integer,
    date date,
    geom geometry(MULTILINESTRING, 4326),
    CONSTRAINT fkey_trajets_bateaux FOREIGN KEY(id_bateau) REFERENCES bateaux(id)  ON DELETE CASCADE
);