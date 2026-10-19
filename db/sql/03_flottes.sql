DROP TABLE IF EXISTS flottes;
CREATE TABLE flottes (
    id serial,
    nom text CONSTRAINT pkey_flottes_nom PRIMARY KEY
);

INSERT INTO flottes VALUES (DEFAULT, 'm1geomatique2027');