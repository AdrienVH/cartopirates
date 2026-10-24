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
INSERT INTO bateaux VALUES (DEFAULT, 'Los Profesores', 'm1geomatique2027', NULL);

-- Etudiants
INSERT INTO bateaux VALUES (DEFAULT, 'Zéphyr',    'm1geomatique2027', NULL);
INSERT INTO bateaux VALUES (DEFAULT, 'Arnaud',    'm1geomatique2027', NULL);
INSERT INTO bateaux VALUES (DEFAULT, 'Chrysalis', 'm1geomatique2027', NULL);
INSERT INTO bateaux VALUES (DEFAULT, 'Bateau 5',  'm1geomatique2027', NULL);
INSERT INTO bateaux VALUES (DEFAULT, 'Bateau 6',  'm1geomatique2027', NULL);
INSERT INTO bateaux VALUES (DEFAULT, 'Bateau 7',  'm1geomatique2027', NULL);
INSERT INTO bateaux VALUES (DEFAULT, 'Bateau 8',  'm1geomatique2027', NULL);
