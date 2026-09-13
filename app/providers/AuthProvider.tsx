"use client";

import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

type AuthUser = {
    id: number;
    name: string;
    email: string;
    avatarUrl: string | null;
    role: string;
};

type LoginInput = {
    email: string;
    password: string;
    remember: boolean;
};

type AuthContextType = {
    user: AuthUser | null;
    loading: boolean;

    login: (
        data: LoginInput
    ) => Promise<AuthUser>;

    register: (
        data: RegisterInput
    ) => Promise<AuthUser>;

    logout: () => Promise<void>;

    apiFetch: (
        input: RequestInfo | URL,
        init?: RequestInit
    ) => Promise<Response>;
};

type RegisterInput = {
    name: string;
    email: string;
    phone?: string;
    password: string;
    remember: boolean;
};

const AuthContext =
    createContext<AuthContextType | null>(null);

export function AuthProvider({
                                 children,
                             }: {
    children: ReactNode;
}) {
    const [user, setUser] =
        useState<AuthUser | null>(null);

    const [loading, setLoading] =
        useState(true);

    const accessTokenRef =
        useRef<string | null>(null);

    const refreshPromiseRef =
        useRef<Promise<string | null> | null>(null);

    const saveAccessToken = useCallback(
        (token: string | null) => {
            accessTokenRef.current = token;
        },
        []
    );

    const refreshAccessToken =
        useCallback(async (): Promise<
            string | null
        > => {
            if (refreshPromiseRef.current) {
                return refreshPromiseRef.current;
            }

            const refreshPromise = (async () => {
                try {
                    const response = await fetch(
                        "/api/auth/refresh",
                        {
                            method: "POST",
                            credentials: "include",
                        }
                    );

                    if (!response.ok) {
                        saveAccessToken(null);
                        setUser(null);

                        return null;
                    }

                    const data = await response.json();

                    saveAccessToken(data.accessToken);
                    setUser(data.user);

                    return data.accessToken as string;
                } catch {
                    saveAccessToken(null);
                    setUser(null);

                    return null;
                }
            })();

            refreshPromiseRef.current =
                refreshPromise;

            try {
                return await refreshPromise;
            } finally {
                if (
                    refreshPromiseRef.current ===
                    refreshPromise
                ) {
                    refreshPromiseRef.current = null;
                }
            }
        }, [saveAccessToken]);

    useEffect(() => {
        refreshAccessToken().finally(() => {
            setLoading(false);
        });
    }, [refreshAccessToken]);

    const login = useCallback(
        async ({
                   email,
                   password,
                   remember,
               }: LoginInput) => {
            const response = await fetch(
                "/api/auth/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                    },

                    credentials: "include",

                    body: JSON.stringify({
                        email,
                        password,
                        remember,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ?? "Login failed."
                );
            }

            saveAccessToken(data.accessToken);
            setUser(data.user);

            return data.user as AuthUser;
        },
        [saveAccessToken]
    );


    const register = useCallback(
        async ({
                   name,
                   email,
                   phone,
                   password,
                   remember,
               }: RegisterInput) => {
            const response = await fetch(
                "/api/auth/register",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                    },

                    credentials: "include",

                    body: JSON.stringify({
                        name,
                        email,
                        phone,
                        password,
                        remember,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ??
                    "Unable to create account."
                );
            }

            saveAccessToken(data.accessToken);

            setUser(data.user);

            return data.user as AuthUser;
        },
        [saveAccessToken]
    );

    const logout = useCallback(async () => {
        try {
            await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include",
            });
        } finally {
            saveAccessToken(null);
            setUser(null);
        }
    }, [saveAccessToken]);


    const apiFetch = useCallback(
        async (
            input: RequestInfo | URL,
            init: RequestInit = {}
        ) => {
            const makeRequest = (
                token: string | null
            ) => {
                const headers =
                    new Headers(init.headers);

                if (token) {
                    headers.set(
                        "Authorization",
                        `Bearer ${token}`
                    );
                }

                return fetch(input, {
                    ...init,
                    headers,
                    credentials: "include",
                });
            };

            let response = await makeRequest(
                accessTokenRef.current
            );

            if (response.status === 401) {
                const newToken =
                    await refreshAccessToken();

                if (newToken) {
                    response =
                        await makeRequest(newToken);
                }
            }

            return response;
        },
        [refreshAccessToken]
    );

    const value = useMemo(
        () => ({
            user,
            loading,
            login,
            register,
            logout,
            apiFetch,
        }),
        [
            user,
            loading,
            login,
            register,
            logout,
            apiFetch,
        ]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used inside AuthProvider"
        );
    }

    return context;
}