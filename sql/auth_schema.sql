-- Schema de autenticacao e autorizacao (RBAC)
-- Use este arquivo para criar as tabelas e permissões iniciais.

CREATE TABLE IF NOT EXISTS public.users (
    id bigserial PRIMARY KEY,
    username text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.roles (
    id bigserial PRIMARY KEY,
    name text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.permissions (
    id bigserial PRIMARY KEY,
    code text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role_id bigint NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id bigint NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id bigint NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Permissoes base
INSERT INTO public.permissions (code) VALUES
    ('consulta.read'),
    ('fracionamento.read'),
    ('sobrepreco.read'),
    ('variabilidade.read'),
    ('admin.manage')
ON CONFLICT (code) DO NOTHING;

-- Roles base
INSERT INTO public.roles (name) VALUES
    ('admin'),
    ('avaliadorSOF'),
    ('avaliadorICT')
ON CONFLICT (name) DO NOTHING;

-- Mapeie roles para permissoes (ajuste conforme necessidade)
-- Admin: todas
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON TRUE
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- Avaliador ICT: todas, exceto admin.manage
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.code <> 'admin.manage'
WHERE r.name = 'avaliadorICT'
ON CONFLICT DO NOTHING;

-- Avaliador SOF: todas, exceto admin.manage e variabilidade.read
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.code NOT IN ('admin.manage', 'variabilidade.read')
WHERE r.name = 'avaliadorSOF'
ON CONFLICT DO NOTHING;

-- Crie usuarios com hash de senha (substitua pelos seus hashes)
-- Recomendado: usar pbkdf2_sha256 (gerado via passlib)
-- INSERT INTO public.users (username, password_hash) VALUES
--   ('admin', '<HASH_AQUI>'),
--   ('avaliador', '<HASH_AQUI>');

-- Vincule usuarios a roles
-- INSERT INTO public.user_roles (user_id, role_id)
-- SELECT u.id, r.id
-- FROM public.users u
-- JOIN public.roles r ON r.name = 'admin'
-- WHERE u.username = 'admin';
