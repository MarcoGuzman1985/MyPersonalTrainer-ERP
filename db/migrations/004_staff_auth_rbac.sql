-- Bloque 02: Usuarios y Permisos (RBAC) + autenticación custom.

CREATE TABLE roles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        text NOT NULL,
  description text NOT NULL DEFAULT '',
  is_system   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

CREATE TRIGGER trg_roles_updated_at
BEFORE UPDATE ON roles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Catálogo fijo de permisos disponibles en la plataforma (seed único, global).
CREATE TABLE permission_modules (
  key   text PRIMARY KEY,
  label text NOT NULL
);

CREATE TABLE permission_actions (
  key            text PRIMARY KEY,
  module_key     text NOT NULL REFERENCES permission_modules(key) ON DELETE CASCADE,
  label          text NOT NULL
);

CREATE TABLE role_permissions (
  role_id          uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_key   text NOT NULL REFERENCES permission_actions(key) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_key)
);

CREATE TABLE staff_users (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name           text NOT NULL,
  email          citext NOT NULL,
  avatar_url     text,
  role_id        uuid NOT NULL REFERENCES roles(id),
  status         staff_status NOT NULL DEFAULT 'invited',
  password_hash  text,
  last_active_at timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email)
);

CREATE TRIGGER trg_staff_users_updated_at
BEFORE UPDATE ON staff_users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_staff_users_tenant ON staff_users(tenant_id);

-- Refresh tokens (rotación): el valor crudo nunca se persiste, solo su hash SHA-256.
CREATE TABLE refresh_tokens (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_user_id  uuid NOT NULL REFERENCES staff_users(id) ON DELETE CASCADE,
  token_hash     text NOT NULL UNIQUE,
  user_agent     text,
  ip             text,
  expires_at     timestamptz NOT NULL,
  revoked_at     timestamptz,
  replaced_by    uuid REFERENCES refresh_tokens(id),
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_refresh_tokens_staff_user ON refresh_tokens(staff_user_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);
