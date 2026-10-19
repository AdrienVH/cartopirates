DROP TABLE IF EXISTS bateaux;
CREATE TABLE bateaux (
    id serial CONSTRAINT pkey_bateaux_id PRIMARY KEY,
    nom text NOT NULL,
    nom_flotte text NOT NULL,
    geom geometry(POINT, 4326),
    nearest_node integer,
    CONSTRAINT fkey_bateaux_flottes FOREIGN KEY(nom_flotte) REFERENCES flottes(nom) ON DELETE CASCADE
);

-- Enseignants
INSERT INTO bateaux VALUES (1, 'Los Profesores', 'm1geomatique2027', NULL);

-- Etudiants
INSERT INTO bateaux VALUES (2, 'X', 'm1geomatique2027', NULL);
INSERT INTO bateaux VALUES (3, 'X', 'm1geomatique2027', NULL);
INSERT INTO bateaux VALUES (4, 'X', 'm1geomatique2027', NULL);
INSERT INTO bateaux VALUES (5, 'X', 'm1geomatique2027', NULL);
INSERT INTO bateaux VALUES (6, 'X', 'm1geomatique2027', NULL);
INSERT INTO bateaux VALUES (7, 'X', 'm1geomatique2027', NULL);
INSERT INTO bateaux VALUES (8, 'X', 'm1geomatique2027', NULL);