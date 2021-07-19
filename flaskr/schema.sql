DROP TABLE IF EXISTS taxii_info;
DROP TABLE IF EXISTS results;
DROP TABLE IF EXISTS filled_mitigations;
DROP TABLE IF EXISTS filters;

CREATE TABLE taxii_info (
  mid TEXT PRIMARY KEY,
  mitigation_name TEXT NOT NULL,
  tid TEXT PRIMARY KEY,
  technique_name TEXT,
  tactics TEXT NOT NULL,
  description TEXT,
  application TEXT
);

CREATE TABLE results (
  tid TEXT PRIMARY KEY,
  tactics TEXT NOT NULL,
  comment TEXT,
  score INTEGER NOT NULL
);

CREATE TABLE filled_mitigations(
  mid TEXT PRIMARY KEY,
  confidence_level INTEGER NOT NULL,
  comment TEXT,
  FOREIGN KEY (mid) REFERENCES taxii_info (mid)

)

CREATE TABLE filters (
  domain TEXT PRIMARY KEY,
  platform TEXT,
)

