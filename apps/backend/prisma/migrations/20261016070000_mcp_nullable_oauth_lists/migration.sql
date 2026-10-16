-- Optional OAuth list columns become nullable JSONB: Prisma lists can't be
-- NULL, and better-auth's OAuth provider distinguishes NULL ("not set", e.g.
-- no scope restriction) from an empty list. Empty arrays could only come from
-- the list default, so they convert to NULL.

ALTER TABLE "OauthClient"
  ALTER COLUMN "scopes" DROP DEFAULT,
  ALTER COLUMN "scopes" TYPE JSONB USING (CASE WHEN cardinality("scopes") > 0 THEN to_jsonb("scopes") END),
  ALTER COLUMN "scopes" DROP NOT NULL,
  ALTER COLUMN "contacts" DROP DEFAULT,
  ALTER COLUMN "contacts" TYPE JSONB USING (CASE WHEN cardinality("contacts") > 0 THEN to_jsonb("contacts") END),
  ALTER COLUMN "contacts" DROP NOT NULL,
  ALTER COLUMN "postLogoutRedirectUris" DROP DEFAULT,
  ALTER COLUMN "postLogoutRedirectUris" TYPE JSONB USING (CASE WHEN cardinality("postLogoutRedirectUris") > 0 THEN to_jsonb("postLogoutRedirectUris") END),
  ALTER COLUMN "postLogoutRedirectUris" DROP NOT NULL,
  ALTER COLUMN "grantTypes" DROP DEFAULT,
  ALTER COLUMN "grantTypes" TYPE JSONB USING (CASE WHEN cardinality("grantTypes") > 0 THEN to_jsonb("grantTypes") END),
  ALTER COLUMN "grantTypes" DROP NOT NULL,
  ALTER COLUMN "responseTypes" DROP DEFAULT,
  ALTER COLUMN "responseTypes" TYPE JSONB USING (CASE WHEN cardinality("responseTypes") > 0 THEN to_jsonb("responseTypes") END),
  ALTER COLUMN "responseTypes" DROP NOT NULL;

ALTER TABLE "OauthResource"
  ALTER COLUMN "allowedScopes" DROP DEFAULT,
  ALTER COLUMN "allowedScopes" TYPE JSONB USING (CASE WHEN cardinality("allowedScopes") > 0 THEN to_jsonb("allowedScopes") END),
  ALTER COLUMN "allowedScopes" DROP NOT NULL;

ALTER TABLE "OauthRefreshToken"
  ALTER COLUMN "resources" DROP DEFAULT,
  ALTER COLUMN "resources" TYPE JSONB USING (CASE WHEN cardinality("resources") > 0 THEN to_jsonb("resources") END),
  ALTER COLUMN "resources" DROP NOT NULL,
  ALTER COLUMN "requestedUserInfoClaims" DROP DEFAULT,
  ALTER COLUMN "requestedUserInfoClaims" TYPE JSONB USING (CASE WHEN cardinality("requestedUserInfoClaims") > 0 THEN to_jsonb("requestedUserInfoClaims") END),
  ALTER COLUMN "requestedUserInfoClaims" DROP NOT NULL;

ALTER TABLE "OauthAccessToken"
  ALTER COLUMN "resources" DROP DEFAULT,
  ALTER COLUMN "resources" TYPE JSONB USING (CASE WHEN cardinality("resources") > 0 THEN to_jsonb("resources") END),
  ALTER COLUMN "resources" DROP NOT NULL,
  ALTER COLUMN "requestedUserInfoClaims" DROP DEFAULT,
  ALTER COLUMN "requestedUserInfoClaims" TYPE JSONB USING (CASE WHEN cardinality("requestedUserInfoClaims") > 0 THEN to_jsonb("requestedUserInfoClaims") END),
  ALTER COLUMN "requestedUserInfoClaims" DROP NOT NULL;

ALTER TABLE "OauthConsent"
  ALTER COLUMN "resources" DROP DEFAULT,
  ALTER COLUMN "resources" TYPE JSONB USING (CASE WHEN cardinality("resources") > 0 THEN to_jsonb("resources") END),
  ALTER COLUMN "resources" DROP NOT NULL,
  ALTER COLUMN "requestedUserInfoClaims" DROP DEFAULT,
  ALTER COLUMN "requestedUserInfoClaims" TYPE JSONB USING (CASE WHEN cardinality("requestedUserInfoClaims") > 0 THEN to_jsonb("requestedUserInfoClaims") END),
  ALTER COLUMN "requestedUserInfoClaims" DROP NOT NULL;
