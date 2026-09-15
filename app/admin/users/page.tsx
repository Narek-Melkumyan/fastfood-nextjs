"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/providers/AuthProvider";

type UserRole = "CUSTOMER" | "PARTNER" | "ADMIN";

type AdminUser = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    role: UserRole;
    isActive: boolean;
    emailVerifiedAt: string | null;
    lastLoginAt: string | null;
    createdAt: string;
    _count: {
        orders: number;
    };
};

const roles: UserRole[] = [
    "CUSTOMER",
    "PARTNER",
    "ADMIN",
];

export default function AdminUsersPage() {
    const { apiFetch, user: currentUser } = useAuth();

    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] =
        useState<"ALL" | UserRole>("ALL");

    const [showAddUser, setShowAddUser] = useState(false);
    const [creating, setCreating] = useState(false);
    const [updatingId, setUpdatingId] =
        useState<number | null>(null);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] =
        useState<UserRole>("CUSTOMER");

    useEffect(() => {
        let ignore = false;

        async function loadUsers() {
            try {
                setLoading(true);
                setError("");

                const response = await apiFetch(
                    "/api/admin/users"
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.error || "Could not load users."
                    );
                }

                if (!ignore) {
                    setUsers(
                        Array.isArray(data.users)
                            ? data.users
                            : []
                    );
                }
            } catch (error) {
                if (!ignore) {
                    setError(
                        error instanceof Error
                            ? error.message
                            : "Could not load users."
                    );
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        }

        loadUsers();

        return () => {
            ignore = true;
        };
    }, [apiFetch]);

    const filteredUsers = useMemo(() => {
        const query = search.trim().toLowerCase();

        return users.filter((user) => {
            const matchesRole =
                roleFilter === "ALL" ||
                user.role === roleFilter;

            const matchesSearch =
                !query ||
                user.name.toLowerCase().includes(query) ||
                user.email.toLowerCase().includes(query) ||
                user.phone?.toLowerCase().includes(query);

            return matchesRole && Boolean(matchesSearch);
        });
    }, [users, search, roleFilter]);

    const customerCount = users.filter(
        (user) => user.role === "CUSTOMER"
    ).length;

    const partnerCount = users.filter(
        (user) => user.role === "PARTNER"
    ).length;

    const adminCount = users.filter(
        (user) => user.role === "ADMIN"
    ).length;

    function resetForm() {
        setName("");
        setEmail("");
        setPhone("");
        setPassword("");
        setRole("CUSTOMER");
    }

    async function createUser(event: FormEvent) {
        event.preventDefault();

        try {
            setCreating(true);
            setError("");

            const response = await apiFetch(
                "/api/admin/users",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name,
                        email,
                        phone,
                        password,
                        role,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Could not create user."
                );
            }

            setUsers((current) => [
                {
                    ...data.user,
                    emailVerifiedAt: null,
                    lastLoginAt: null,
                },
                ...current,
            ]);

            resetForm();
            setShowAddUser(false);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Could not create user."
            );
        } finally {
            setCreating(false);
        }
    }

    async function updateUser(
        userId: number,
        values: {
            role?: UserRole;
            isActive?: boolean;
        }
    ) {
        try {
            setUpdatingId(userId);
            setError("");

            const response = await apiFetch(
                `/api/admin/users/${userId}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(values),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Could not update user."
                );
            }

            setUsers((current) =>
                current.map((user) =>
                    user.id === userId
                        ? data.user
                        : user
                )
            );
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Could not update user."
            );
        } finally {
            setUpdatingId(null);
        }
    }

    if (loading) {
        return (
            <div className="panel">
                <div className="panel-body text-center py-5">
                    Loading users...
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-4">
                <div>
          <span className="eyebrow">
            Users
          </span>

                    <h1 className="display-md mb-1">
                        Manage users
                    </h1>

                    <p className="muted mb-0">
                        Manage customers, partners and administrators.
                    </p>
                </div>

                <button
                    type="button"
                    className="btn btn-brand"
                    onClick={() =>
                        setShowAddUser(
                            (current) => !current
                        )
                    }
                >
                    {showAddUser
                        ? "Cancel"
                        : "+ Add user"}
                </button>
            </div>

            {error && (
                <div className="alert alert-danger">
                    {error}
                </div>
            )}

            {showAddUser && (
                <div className="panel mb-4">
                    <div className="panel-head">
                        Add new user
                    </div>

                    <div className="panel-body">
                        <form onSubmit={createUser}>
                            <div className="row g-3">
                                <div className="col-12 col-md-6">
                                    <label className="form-label">
                                        Name
                                    </label>

                                    <input
                                        type="text"
                                        className="form-control"
                                        value={name}
                                        onChange={(event) =>
                                            setName(
                                                event.target.value
                                            )
                                        }
                                        required
                                    />
                                </div>

                                <div className="col-12 col-md-6">
                                    <label className="form-label">
                                        Email
                                    </label>

                                    <input
                                        type="email"
                                        className="form-control"
                                        value={email}
                                        onChange={(event) =>
                                            setEmail(
                                                event.target.value
                                            )
                                        }
                                        required
                                    />
                                </div>

                                <div className="col-12 col-md-6">
                                    <label className="form-label">
                                        Phone
                                    </label>

                                    <input
                                        type="text"
                                        className="form-control"
                                        value={phone}
                                        onChange={(event) =>
                                            setPhone(
                                                event.target.value
                                            )
                                        }
                                    />
                                </div>

                                <div className="col-12 col-md-6">
                                    <label className="form-label">
                                        Password
                                    </label>

                                    <input
                                        type="password"
                                        className="form-control"
                                        value={password}
                                        minLength={8}
                                        onChange={(event) =>
                                            setPassword(
                                                event.target.value
                                            )
                                        }
                                        required
                                    />
                                </div>

                                <div className="col-12 col-md-6">
                                    <label className="form-label">
                                        Role
                                    </label>

                                    <select
                                        className="form-select"
                                        value={role}
                                        onChange={(event) =>
                                            setRole(
                                                event.target
                                                    .value as UserRole
                                            )
                                        }
                                    >
                                        {roles.map((role) => (
                                            <option
                                                key={role}
                                                value={role}
                                            >
                                                {role}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-12 d-flex gap-2">
                                    <button
                                        type="submit"
                                        className="btn btn-brand"
                                        disabled={creating}
                                    >
                                        {creating
                                            ? "Creating..."
                                            : "Create user"}
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-line"
                                        onClick={() => {
                                            resetForm();
                                            setShowAddUser(false);
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="row g-3 mb-4">
                <div className="col-6 col-xl-3">
                    <div className="admin-stat">
                        <div className="label">
                            All users
                        </div>

                        <div className="value">
                            {users.length}
                        </div>
                    </div>
                </div>

                <div className="col-6 col-xl-3">
                    <div className="admin-stat">
                        <div className="label">
                            Customers
                        </div>

                        <div className="value">
                            {customerCount}
                        </div>
                    </div>
                </div>

                <div className="col-6 col-xl-3">
                    <div className="admin-stat">
                        <div className="label">
                            Partners
                        </div>

                        <div className="value">
                            {partnerCount}
                        </div>
                    </div>
                </div>

                <div className="col-6 col-xl-3">
                    <div className="admin-stat">
                        <div className="label">
                            Admins
                        </div>

                        <div className="value">
                            {adminCount}
                        </div>
                    </div>
                </div>
            </div>

            <div className="panel mb-4">
                <div className="panel-body">
                    <div className="row g-3">
                        <div className="col-12 col-lg">
                            <input
                                type="search"
                                className="form-control"
                                placeholder="Search name, email or phone..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                            />
                        </div>

                        <div className="col-12 col-lg-auto">
                            <select
                                className="form-select"
                                value={roleFilter}
                                onChange={(event) =>
                                    setRoleFilter(
                                        event.target.value as
                                            | "ALL"
                                            | UserRole
                                    )
                                }
                            >
                                <option value="ALL">
                                    All roles
                                </option>

                                {roles.map((role) => (
                                    <option
                                        key={role}
                                        value={role}
                                    >
                                        {role}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="panel">
                <div className="panel-head d-flex justify-content-between">
          <span>
            Users
          </span>

                    <span className="muted">
            {filteredUsers.length} results
          </span>
                </div>

                {filteredUsers.length === 0 ? (
                    <div className="panel-body">
                        <div className="empty-state">
                            No users found.
                        </div>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table align-middle mb-0">
                            <thead>
                            <tr>
                                <th>User</th>
                                <th>Phone</th>
                                <th>Orders</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Joined</th>
                                <th />
                            </tr>
                            </thead>

                            <tbody>
                            {filteredUsers.map((user) => {
                                const isCurrentUser =
                                    currentUser?.id === user.id;

                                return (
                                    <tr key={user.id}>
                                        <td>
                                            <div className="fw-semibold">
                                                {user.name}

                                                {isCurrentUser && (
                                                    <span className="badge text-bg-primary ms-2">
                              You
                            </span>
                                                )}
                                            </div>

                                            <div className="muted small">
                                                {user.email}
                                            </div>
                                        </td>

                                        <td>
                                            {user.phone || "—"}
                                        </td>

                                        <td>
                                            {user._count.orders}
                                        </td>

                                        <td style={{ minWidth: 145 }}>
                                            <select
                                                className="form-select form-select-sm"
                                                value={user.role}
                                                disabled={
                                                    updatingId === user.id ||
                                                    isCurrentUser
                                                }
                                                onChange={(event) =>
                                                    updateUser(user.id, {
                                                        role:
                                                            event.target
                                                                .value as UserRole,
                                                    })
                                                }
                                            >
                                                {roles.map((role) => (
                                                    <option
                                                        key={role}
                                                        value={role}
                                                    >
                                                        {role}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>

                                        <td>
                        <span
                            className={`badge ${
                                user.isActive
                                    ? "text-bg-success"
                                    : "text-bg-secondary"
                            }`}
                        >
                          {user.isActive
                              ? "Active"
                              : "Inactive"}
                        </span>
                                        </td>

                                        <td className="muted small">
                                            {new Date(
                                                user.createdAt
                                            ).toLocaleDateString()}
                                        </td>

                                        <td>
                                            <button
                                                type="button"
                                                className={`btn btn-sm ${
                                                    user.isActive
                                                        ? "btn-outline-danger"
                                                        : "btn-outline-success"
                                                }`}
                                                disabled={
                                                    updatingId === user.id ||
                                                    isCurrentUser
                                                }
                                                onClick={() =>
                                                    updateUser(user.id, {
                                                        isActive:
                                                            !user.isActive,
                                                    })
                                                }
                                            >
                                                {isCurrentUser
                                                    ? "Current admin"
                                                    : user.isActive
                                                        ? "Disable"
                                                        : "Enable"}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}