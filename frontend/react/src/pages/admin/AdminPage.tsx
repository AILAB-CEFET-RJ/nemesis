import React, { useEffect, useMemo, useState } from "react";
import { ShieldCheck, UserPlus } from "lucide-react";
import { useTranslation } from "../../context/LanguageContext";
import {
  AdminRole,
  AdminUser,
  createAdminUser,
  fetchAdminRoles,
  fetchAdminUsers,
  updateAdminUser,
  updateAdminUserRoles,
} from "../../utils/adminApi";

export const AdminPage: React.FC = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeUser, setActiveUser] = useState<AdminUser | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [activeStatus, setActiveStatus] = useState(true);
  const [newPassword, setNewPassword] = useState("");

  const [newUsername, setNewUsername] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRoles, setNewUserRoles] = useState<string[]>([]);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const [userList, roleList] = await Promise.all([fetchAdminUsers(), fetchAdminRoles()]);
      setUsers(userList);
      setRoles(roleList);
    } catch (err: any) {
      setError(err.message || t("admin.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const openUser = (user: AdminUser) => {
    setActiveUser(user);
    setSelectedRoles(user.roles || []);
    setActiveStatus(user.is_active);
    setNewPassword("");
  };

  const closeUser = () => {
    setActiveUser(null);
    setSelectedRoles([]);
    setNewPassword("");
  };

  const toggleRole = (role: string, current: string[], setter: (value: string[]) => void) => {
    if (current.includes(role)) {
      setter(current.filter((r) => r !== role));
    } else {
      setter([...current, role]);
    }
  };

  const roleOptions = useMemo(() => roles.map((r) => r.name), [roles]);

  const handleSaveUser = async () => {
    if (!activeUser) return;
    try {
      await updateAdminUserRoles(activeUser.id, selectedRoles);
      if (activeStatus !== activeUser.is_active || newPassword.trim()) {
        await updateAdminUser(activeUser.id, {
          is_active: activeStatus,
          password: newPassword.trim() || undefined,
        });
      }
      await reload();
      closeUser();
    } catch (err: any) {
      setError(err.message || t("admin.error"));
    }
  };

  const handleCreateUser = async () => {
    if (!newUsername.trim() || !newUserPassword.trim()) {
      setError(t("admin.createValidation"));
      return;
    }
    try {
      await createAdminUser(newUsername.trim(), newUserPassword.trim(), newUserRoles);
      setNewUsername("");
      setNewUserPassword("");
      setNewUserRoles([]);
      await reload();
    } catch (err: any) {
      setError(err.message || t("admin.error"));
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-80" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-14">
        <header className="text-center lg:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-rose-200">
            {t("admin.badge")}
          </p>
          <h1 className="mt-2 text-4xl font-semibold text-white sm:text-5xl">
            {t("admin.title")}
          </h1>
          <p className="mt-3 text-sm text-slate-300 sm:text-base">{t("admin.subtitle")}</p>
        </header>

        {error && (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
            <h2 className="text-lg font-semibold text-white">{t("admin.usersTitle")}</h2>
            <p className="mt-2 text-sm text-slate-300">{t("admin.usersSubtitle")}</p>

            {loading ? (
              <div className="mt-6 text-sm text-slate-300">{t("common.loading")}</div>
            ) : (
              <div className="mt-6 overflow-auto rounded-2xl border border-white/10">
                <table className="w-full min-w-[620px] text-sm">
                  <thead className="bg-white/10 text-left text-xs uppercase tracking-wide text-slate-300">
                    <tr>
                      <th className="px-4 py-3">{t("admin.tableUser")}</th>
                      <th className="px-4 py-3">{t("admin.tableStatus")}</th>
                      <th className="px-4 py-3">{t("admin.tableRoles")}</th>
                      <th className="px-4 py-3 text-right">{t("admin.tableAction")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {users.map((user) => (
                      <tr key={user.id} className="text-slate-100">
                        <td className="px-4 py-3 font-medium">{user.username}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs ${
                              user.is_active ? "bg-emerald-500/20 text-emerald-200" : "bg-rose-500/20 text-rose-200"
                            }`}
                          >
                            {user.is_active ? t("admin.active") : t("admin.inactive")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300">{(user.roles || []).join(", ") || "—"}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => openUser(user)}
                            className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-200 hover:border-rose-300 hover:text-white transition"
                          >
                            {t("admin.edit")}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
            <div className="flex items-center gap-2 text-rose-200">
              <UserPlus className="h-5 w-5" />
              <h2 className="text-lg font-semibold text-white">{t("admin.createTitle")}</h2>
            </div>
            <p className="mt-2 text-sm text-slate-300">{t("admin.createSubtitle")}</p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm text-slate-200">{t("admin.username")}</label>
                <input
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-white outline-none transition focus:border-rose-300 focus:bg-slate-900/80"
                />
              </div>
              <div>
                <label className="text-sm text-slate-200">{t("admin.password")}</label>
                <input
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-white outline-none transition focus:border-rose-300 focus:bg-slate-900/80"
                />
              </div>
              <div>
                <label className="text-sm text-slate-200">{t("admin.roles")}</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {roleOptions.map((role) => (
                    <button
                      type="button"
                      key={role}
                      onClick={() => toggleRole(role, newUserRoles, setNewUserRoles)}
                      className={`rounded-full border px-3 py-1 text-xs ${
                        newUserRoles.includes(role)
                          ? "border-rose-300 bg-rose-500/20 text-rose-100"
                          : "border-white/20 text-slate-200 hover:border-rose-300"
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={handleCreateUser}
                className="mt-2 inline-flex items-center justify-center rounded-full bg-rose-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-rose-300"
              >
                {t("admin.createButton")}
              </button>
            </div>
          </div>
        </section>
      </div>

      {activeUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={closeUser}>
          <div
            className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-200">
                <ShieldCheck className="h-5 w-5" />
                <h3 className="text-lg font-semibold text-white">{t("admin.editTitle")}</h3>
              </div>
              <button
                type="button"
                onClick={closeUser}
                className="rounded-full border border-white/20 px-3 py-1 text-sm text-slate-200 hover:border-white/40"
              >
                {t("common.close")}
              </button>
            </div>

            <div className="mt-4 text-sm text-slate-300">
              {t("admin.editing")} <span className="font-semibold text-white">{activeUser.username}</span>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm text-slate-200">{t("admin.roles")}</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {roleOptions.map((role) => (
                    <button
                      type="button"
                      key={role}
                      onClick={() => toggleRole(role, selectedRoles, setSelectedRoles)}
                      className={`rounded-full border px-3 py-1 text-xs ${
                        selectedRoles.includes(role)
                          ? "border-emerald-300 bg-emerald-500/20 text-emerald-100"
                          : "border-white/20 text-slate-200 hover:border-emerald-300"
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-200">{t("admin.status")}</label>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveStatus(true)}
                    className={`rounded-full border px-3 py-1 text-xs ${
                      activeStatus
                        ? "border-emerald-300 bg-emerald-500/20 text-emerald-100"
                        : "border-white/20 text-slate-200 hover:border-emerald-300"
                    }`}
                  >
                    {t("admin.active")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStatus(false)}
                    className={`rounded-full border px-3 py-1 text-xs ${
                      !activeStatus
                        ? "border-rose-300 bg-rose-500/20 text-rose-100"
                        : "border-white/20 text-slate-200 hover:border-rose-300"
                    }`}
                  >
                    {t("admin.inactive")}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-200">{t("admin.resetPassword")}</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t("admin.resetPasswordPlaceholder")}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-white outline-none transition focus:border-emerald-300 focus:bg-slate-900/80"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeUser}
                className="rounded-full border border-white/20 px-4 py-2 text-sm text-slate-200 hover:border-white/40"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={handleSaveUser}
                className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
              >
                {t("admin.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
