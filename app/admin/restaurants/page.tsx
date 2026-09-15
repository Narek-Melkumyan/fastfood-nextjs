"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useAuth } from "@/app/providers/AuthProvider";

type Restaurant = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    logoUrl: string | null;
    coverImageUrl: string | null;
    address: string;
    city: string;
    deliveryMinMinutes: number;
    deliveryMaxMinutes: number;
    deliveryFee: number;
    minimumOrder: number;
    isAcceptingOrders: boolean;
    isActive: boolean;
    createdAt: string;

    owner: {
        id: number;
        name: string;
        email: string;
    } | null;

    _count: {
        products: number;
    };
};

type ImageUpload = {
    key: string;
    url: string;
};

const emptyForm = {
    name: "",
    description: "",
    address: "",
    city: "Yerevan",
    deliveryMinMinutes: "20",
    deliveryMaxMinutes: "40",
    deliveryFee: "0",
    minimumOrder: "0",
    isAcceptingOrders: true,
    isActive: true,
};

function money(value: number) {
    return value.toLocaleString("en-US");
}

export default function AdminRestaurantsPage() {
    const { apiFetch } = useAuth();

    const [restaurants, setRestaurants] =
        useState<Restaurant[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] =
        useState<number | null>(null);

    const [saving, setSaving] = useState(false);
    const [updatingId, setUpdatingId] =
        useState<number | null>(null);

    const [uploadingLogo, setUploadingLogo] =
        useState(false);

    const [uploadingCover, setUploadingCover] =
        useState(false);

    const [form, setForm] = useState(emptyForm);

    const [logo, setLogo] =
        useState<ImageUpload | null>(null);

    const [cover, setCover] =
        useState<ImageUpload | null>(null);

    const [newLogoKey, setNewLogoKey] =
        useState<string | null>(null);

    const [newCoverKey, setNewCoverKey] =
        useState<string | null>(null);

    useEffect(() => {
        let ignore = false;

        async function loadRestaurants() {
            try {
                setLoading(true);
                setError("");

                const response = await apiFetch(
                    "/api/admin/restaurants"
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.error ||
                        "Could not load restaurants."
                    );
                }

                if (!ignore) {
                    setRestaurants(
                        Array.isArray(data.restaurants)
                            ? data.restaurants
                            : []
                    );
                }
            } catch (error) {
                if (!ignore) {
                    setError(
                        error instanceof Error
                            ? error.message
                            : "Could not load restaurants."
                    );
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        }

        loadRestaurants();

        return () => {
            ignore = true;
        };
    }, [apiFetch]);

    const filteredRestaurants = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return restaurants;
        }

        return restaurants.filter((restaurant) =>
            [
                restaurant.name,
                restaurant.slug,
                restaurant.city,
                restaurant.address,
                restaurant.owner?.name || "",
                restaurant.owner?.email || "",
            ].some((value) =>
                value.toLowerCase().includes(query)
            )
        );
    }, [restaurants, search]);

    function updateForm(
        field: keyof typeof emptyForm,
        value: string | boolean
    ) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    }

    async function uploadImage(
        file: File,
        kind:
            | "restaurant-logo"
            | "restaurant-cover"
    ) {
        const formData = new FormData();

        formData.append("file", file);
        formData.append("kind", kind);

        const response = await apiFetch(
            "/api/admin/media",
            {
                method: "POST",
                body: formData,
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error ||
                "Could not upload image."
            );
        }

        return data as ImageUpload;
    }

    async function deleteUploadedImage(
        key: string
    ) {
        const response = await apiFetch(
            "/api/admin/media",
            {
                method: "DELETE",
                headers: {
                    "Content-Type":
                        "application/json",
                },
                body: JSON.stringify({
                    key,
                }),
            }
        );

        if (!response.ok) {
            const data =
                await response.json();

            throw new Error(
                data.error ||
                "Could not delete uploaded image."
            );
        }
    }

    async function handleLogo(
        event: ChangeEvent<HTMLInputElement>
    ) {
        const file =
            event.target.files?.[0];





        if (!file) {
            return;
        }

        const previousKey =
            newLogoKey;

        try {
            setUploadingLogo(true);
            setError("");

            const image =
                await uploadImage(
                    file,
                    "restaurant-logo"
                );

            setLogo(image);
            setNewLogoKey(image.key);

            if (previousKey) {
                try {
                    await deleteUploadedImage(
                        previousKey
                    );
                } catch (error) {
                    console.error(
                        "OLD TEMP LOGO CLEANUP ERROR:",
                        error
                    );
                }
            }
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Could not upload logo."
            );
        } finally {
            setUploadingLogo(false);
            event.target.value = "";
        }
    }

    async function handleCover(
        event: ChangeEvent<HTMLInputElement>
    ) {
        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        const previousKey =
            newCoverKey;

        try {
            setUploadingCover(true);
            setError("");

            const image =
                await uploadImage(
                    file,
                    "restaurant-cover"
                );

            setCover(image);
            setNewCoverKey(image.key);

            if (previousKey) {
                try {
                    await deleteUploadedImage(
                        previousKey
                    );
                } catch (error) {
                    console.error(
                        "OLD TEMP COVER CLEANUP ERROR:",
                        error
                    );
                }
            }
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Could not upload cover."
            );
        } finally {
            setUploadingCover(false);
            event.target.value = "";
        }
    }

    function resetEditor() {
        setShowForm(false);
        setEditingId(null);
        setForm(emptyForm);
        setLogo(null);
        setCover(null);
        setNewLogoKey(null);
        setNewCoverKey(null);
    }

    function openCreate() {
        setEditingId(null);
        setForm(emptyForm);
        setLogo(null);
        setCover(null);
        setNewLogoKey(null);
        setNewCoverKey(null);
        setShowForm(true);
    }

    function openEdit(
        restaurant: Restaurant
    ) {
        setEditingId(
            restaurant.id
        );

        setForm({
            name:
            restaurant.name,

            description:
                restaurant.description || "",

            address:
            restaurant.address,

            city:
            restaurant.city,

            deliveryMinMinutes:
                String(
                    restaurant.deliveryMinMinutes
                ),

            deliveryMaxMinutes:
                String(
                    restaurant.deliveryMaxMinutes
                ),

            deliveryFee:
                String(
                    restaurant.deliveryFee
                ),

            minimumOrder:
                String(
                    restaurant.minimumOrder
                ),

            isAcceptingOrders:
            restaurant.isAcceptingOrders,

            isActive:
            restaurant.isActive,
        });

        setLogo(
            restaurant.logoUrl
                ? {
                    key: "",
                    url:
                    restaurant.logoUrl,
                }
                : null
        );

        setCover(
            restaurant.coverImageUrl
                ? {
                    key: "",
                    url:
                    restaurant.coverImageUrl,
                }
                : null
        );

        setNewLogoKey(null);
        setNewCoverKey(null);

        setShowForm(true);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }

    async function closeForm() {
        const logoKey =
            newLogoKey;

        const coverKey =
            newCoverKey;

        resetEditor();

        if (logoKey) {
            try {
                await deleteUploadedImage(
                    logoKey
                );
            } catch (error) {
                console.error(
                    "TEMP LOGO CLEANUP ERROR:",
                    error
                );
            }
        }

        if (coverKey) {
            try {
                await deleteUploadedImage(
                    coverKey
                );
            } catch (error) {
                console.error(
                    "TEMP COVER CLEANUP ERROR:",
                    error
                );
            }
        }
    }

    async function saveRestaurant(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        try {
            setSaving(true);
            setError("");

            const body = {
                name:
                form.name,

                description:
                form.description,

                address:
                form.address,

                city:
                form.city,

                logoUrl:
                    logo?.url || null,

                coverImageUrl:
                    cover?.url || null,

                deliveryMinMinutes:
                    Number(
                        form.deliveryMinMinutes
                    ),

                deliveryMaxMinutes:
                    Number(
                        form.deliveryMaxMinutes
                    ),

                deliveryFee:
                    Number(
                        form.deliveryFee
                    ),

                minimumOrder:
                    Number(
                        form.minimumOrder
                    ),

                isAcceptingOrders:
                form.isAcceptingOrders,

                isActive:
                form.isActive,
            };

            const response =
                await apiFetch(
                    editingId
                        ? `/api/admin/restaurants/${editingId}`
                        : "/api/admin/restaurants",
                    {
                        method:
                            editingId
                                ? "PATCH"
                                : "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify(
                                body
                            ),
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    "Could not save restaurant."
                );
            }

            if (editingId) {
                setRestaurants(
                    (current) =>
                        current.map(
                            (restaurant) =>
                                restaurant.id ===
                                editingId
                                    ? data.restaurant
                                    : restaurant
                        )
                );
            } else {
                setRestaurants(
                    (current) => [
                        data.restaurant,
                        ...current,
                    ]
                );
            }

            resetEditor();
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Could not save restaurant."
            );
        } finally {
            setSaving(false);
        }
    }

    async function updateRestaurant(
        restaurantId: number,
        values: {
            isActive?: boolean;
            isAcceptingOrders?: boolean;
        }
    ) {
        try {
            setUpdatingId(
                restaurantId
            );

            setError("");

            const response =
                await apiFetch(
                    `/api/admin/restaurants/${restaurantId}`,
                    {
                        method: "PATCH",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify(
                                values
                            ),
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    "Could not update restaurant."
                );
            }

            setRestaurants(
                (current) =>
                    current.map(
                        (restaurant) =>
                            restaurant.id ===
                            restaurantId
                                ? data.restaurant
                                : restaurant
                    )
            );
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Could not update restaurant."
            );
        } finally {
            setUpdatingId(null);
        }
    }

    if (loading) {
        return (
            <div className="panel">
                <div className="panel-body text-center py-5">
                    Loading restaurants...
                </div>
            </div>
        );
    }

    return (
        <div>
            <style>{`
        .restaurants-admin-table th {
          padding: 13px 16px;
          font-size: 11px;
          font-weight: 800;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: .06em;
          white-space: nowrap;
          border-bottom: 1px solid var(--line);
        }

        .restaurants-admin-table td {
          padding: 15px 16px;
          border-bottom: 1px solid var(--line);
          vertical-align: middle;
        }

        .restaurants-admin-table tbody tr:last-child td {
          border-bottom: 0;
        }

        .restaurants-admin-table tbody tr {
          transition: background .15s ease;
        }

        .restaurants-admin-table tbody tr:hover {
          background: var(--surface-2);
        }

        .restaurant-table-main {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 225px;
        }

        .restaurant-table-logo {
          width: 48px;
          height: 48px;
          flex: 0 0 48px;
          object-fit: cover;
          border-radius: 13px;
          border: 1px solid var(--line);
          background: var(--surface-2);
        }

        .restaurant-table-placeholder {
          width: 48px;
          height: 48px;
          flex: 0 0 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 13px;
          border: 1px solid var(--line);
          background: var(--surface-2);
          font-size: 20px;
        }

        .restaurant-table-name {
          font-size: 15px;
          font-weight: 750;
          line-height: 1.25;
          color: var(--ink);
        }

        .restaurant-table-meta {
          margin-top: 3px;
          max-width: 230px;
          color: var(--muted);
          font-size: 12px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .restaurant-table-owner {
          margin-top: 2px;
          color: var(--muted);
          font-size: 11px;
        }

        .restaurant-delivery-time {
          font-size: 14px;
          font-weight: 750;
          color: var(--ink);
          white-space: nowrap;
        }

        .restaurant-delivery-meta {
          margin-top: 3px;
          color: var(--muted);
          font-size: 12px;
          white-space: nowrap;
        }

        .restaurant-count {
          min-width: 32px;
          height: 30px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 9px;
          border-radius: 999px;
          background: var(--surface-2);
          border: 1px solid var(--line);
          font-size: 13px;
          font-weight: 750;
        }

        .restaurant-order-toggle {
          border: 0;
          background: transparent;
          padding: 5px 0;
          font-size: 13px;
          font-weight: 750;
          color: var(--muted);
          white-space: nowrap;
        }

        .restaurant-order-toggle.accepting {
          color: #198754;
        }

        .restaurant-order-toggle:disabled {
          opacity: .5;
        }

        .restaurant-status {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 5px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 750;
          white-space: nowrap;
        }

        .restaurant-status.active {
          background: rgba(25, 135, 84, .12);
          color: #198754;
        }

        .restaurant-status.inactive {
          background: var(--surface-2);
          color: var(--muted);
        }

        .restaurant-table-actions {
          display: flex;
          justify-content: flex-end;
          gap: 7px;
          white-space: nowrap;
        }

        .restaurant-table-actions .btn {
          min-width: 66px;
        }

        .restaurant-preview-logo {
          width: 110px;
          height: 110px;
          object-fit: cover;
          border-radius: 16px;
          border: 1px solid var(--line);
        }

        .restaurant-preview-cover {
          width: 100%;
          max-width: 420px;
          height: 170px;
          object-fit: cover;
          border-radius: 16px;
          border: 1px solid var(--line);
        }

        @media (max-width: 991px) {
          .restaurants-admin-table {
            min-width: 850px;
          }
        }
      `}</style>

            <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-4">
                <div>
          <span className="eyebrow">
            Restaurants
          </span>

                    <h1 className="display-md mb-1">
                        Manage restaurants
                    </h1>

                    <p className="muted mb-0">
                        Add restaurants and manage delivery,
                        availability and images.
                    </p>
                </div>

                <button
                    type="button"
                    className="btn btn-brand"
                    disabled={
                        saving ||
                        uploadingLogo ||
                        uploadingCover
                    }
                    onClick={() => {
                        if (showForm) {
                            void closeForm();
                        } else {
                            openCreate();
                        }
                    }}
                >
                    {showForm
                        ? "Cancel"
                        : "+ Add restaurant"}
                </button>
            </div>

            {error && (
                <div className="alert alert-danger">
                    {error}
                </div>
            )}

            {showForm && (
                <div className="panel mb-4">
                    <div className="panel-head">
                        {editingId
                            ? "Edit restaurant"
                            : "Add restaurant"}
                    </div>

                    <div className="panel-body">
                        <form
                            onSubmit={
                                saveRestaurant
                            }
                        >
                            <div className="row g-3">
                                <div className="col-12 col-md-6">
                                    <label className="form-label">
                                        Restaurant name
                                    </label>

                                    <input
                                        type="text"
                                        className="form-control"
                                        value={
                                            form.name
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            updateForm(
                                                "name",
                                                event.target
                                                    .value
                                            )
                                        }
                                        required
                                    />
                                </div>

                                <div className="col-12 col-md-6">
                                    <label className="form-label">
                                        City
                                    </label>

                                    <input
                                        type="text"
                                        className="form-control"
                                        value={
                                            form.city
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            updateForm(
                                                "city",
                                                event.target
                                                    .value
                                            )
                                        }
                                        required
                                    />
                                </div>

                                <div className="col-12">
                                    <label className="form-label">
                                        Description
                                    </label>

                                    <textarea
                                        className="form-control"
                                        rows={3}
                                        value={
                                            form.description
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            updateForm(
                                                "description",
                                                event.target
                                                    .value
                                            )
                                        }
                                    />
                                </div>

                                <div className="col-12">
                                    <label className="form-label">
                                        Address
                                    </label>

                                    <input
                                        type="text"
                                        className="form-control"
                                        value={
                                            form.address
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            updateForm(
                                                "address",
                                                event.target
                                                    .value
                                            )
                                        }
                                        required
                                    />
                                </div>

                                <div className="col-6 col-lg-3">
                                    <label className="form-label">
                                        Delivery min
                                    </label>

                                    <input
                                        type="number"
                                        min="0"
                                        className="form-control"
                                        value={
                                            form.deliveryMinMinutes
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            updateForm(
                                                "deliveryMinMinutes",
                                                event.target
                                                    .value
                                            )
                                        }
                                        required
                                    />
                                </div>

                                <div className="col-6 col-lg-3">
                                    <label className="form-label">
                                        Delivery max
                                    </label>

                                    <input
                                        type="number"
                                        min="0"
                                        className="form-control"
                                        value={
                                            form.deliveryMaxMinutes
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            updateForm(
                                                "deliveryMaxMinutes",
                                                event.target
                                                    .value
                                            )
                                        }
                                        required
                                    />
                                </div>

                                <div className="col-6 col-lg-3">
                                    <label className="form-label">
                                        Delivery fee
                                    </label>

                                    <div className="input-group">
                                        <input
                                            type="number"
                                            min="0"
                                            className="form-control"
                                            value={
                                                form.deliveryFee
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                updateForm(
                                                    "deliveryFee",
                                                    event.target
                                                        .value
                                                )
                                            }
                                            required
                                        />

                                        <span className="input-group-text">
                      ֏
                    </span>
                                    </div>
                                </div>

                                <div className="col-6 col-lg-3">
                                    <label className="form-label">
                                        Minimum order
                                    </label>

                                    <div className="input-group">
                                        <input
                                            type="number"
                                            min="0"
                                            className="form-control"
                                            value={
                                                form.minimumOrder
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                updateForm(
                                                    "minimumOrder",
                                                    event.target
                                                        .value
                                                )
                                            }
                                            required
                                        />

                                        <span className="input-group-text">
                      ֏
                    </span>
                                    </div>
                                </div>

                                <div className="col-12 col-lg-6">
                                    <label className="form-label">
                                        Logo
                                    </label>

                                    <input
                                        type="file"
                                        className="form-control"
                                        accept="image/jpeg,image/png,image/webp,image/avif"
                                        disabled={
                                            uploadingLogo
                                        }
                                        onChange={
                                            handleLogo
                                        }
                                    />

                                    <div className="form-text">
                                        {uploadingLogo
                                            ? "Uploading..."
                                            : "The image will be optimized and uploaded to R2."}
                                    </div>

                                    {logo && (
                                        <div className="mt-3">
                                            <img
                                                src={
                                                    logo.url
                                                }
                                                alt="Restaurant logo preview"
                                                className="restaurant-preview-logo"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="col-12 col-lg-6">
                                    <label className="form-label">
                                        Cover image
                                    </label>

                                    <input
                                        type="file"
                                        className="form-control"
                                        accept="image/jpeg,image/png,image/webp,image/avif"
                                        disabled={
                                            uploadingCover
                                        }
                                        onChange={
                                            handleCover
                                        }
                                    />

                                    <div className="form-text">
                                        {uploadingCover
                                            ? "Uploading..."
                                            : "The image will be optimized and uploaded to R2."}
                                    </div>

                                    {cover && (
                                        <div className="mt-3">
                                            <img
                                                src={
                                                    cover.url
                                                }
                                                alt="Restaurant cover preview"
                                                className="restaurant-preview-cover"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="col-12">
                                    <div className="d-flex gap-4 flex-wrap">
                                        <div className="form-check">
                                            <input
                                                id="restaurant-active"
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={
                                                    form.isActive
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    updateForm(
                                                        "isActive",
                                                        event.target
                                                            .checked
                                                    )
                                                }
                                            />

                                            <label
                                                className="form-check-label"
                                                htmlFor="restaurant-active"
                                            >
                                                Active
                                            </label>
                                        </div>

                                        <div className="form-check">
                                            <input
                                                id="restaurant-orders"
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={
                                                    form.isAcceptingOrders
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    updateForm(
                                                        "isAcceptingOrders",
                                                        event.target
                                                            .checked
                                                    )
                                                }
                                            />

                                            <label
                                                className="form-check-label"
                                                htmlFor="restaurant-orders"
                                            >
                                                Accepting orders
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-12 d-flex gap-2">
                                    <button
                                        type="submit"
                                        className="btn btn-brand"
                                        disabled={
                                            saving ||
                                            uploadingLogo ||
                                            uploadingCover
                                        }
                                    >
                                        {saving
                                            ? "Saving..."
                                            : editingId
                                                ? "Save changes"
                                                : "Create restaurant"}
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-line"
                                        disabled={
                                            saving ||
                                            uploadingLogo ||
                                            uploadingCover
                                        }
                                        onClick={() => {
                                            void closeForm();
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

            <div className="panel mb-4">
                <div className="panel-body">
                    <input
                        type="search"
                        className="form-control"
                        placeholder="Search restaurant, city, address or owner..."
                        value={
                            search
                        }
                        onChange={(
                            event
                        ) =>
                            setSearch(
                                event.target.value
                            )
                        }
                    />
                </div>
            </div>

            <div className="panel">
                <div className="panel-head d-flex justify-content-between align-items-center">
          <span>
            Restaurants
          </span>

                    <span className="muted">
            {
                filteredRestaurants
                    .length
            }{" "}
                        results
          </span>
                </div>

                {filteredRestaurants.length ===
                0 ? (
                    <div className="panel-body">
                        <div className="empty-state">
                            No restaurants found.
                        </div>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table restaurants-admin-table align-middle mb-0">
                            <thead>
                            <tr>
                                <th>
                                    Restaurant
                                </th>

                                <th>
                                    Delivery
                                </th>

                                <th>
                                    Products
                                </th>

                                <th>
                                    Orders
                                </th>

                                <th>
                                    Status
                                </th>

                                <th className="text-end">
                                    Actions
                                </th>
                            </tr>
                            </thead>

                            <tbody>
                            {filteredRestaurants.map(
                                (
                                    restaurant
                                ) => (
                                    <tr
                                        key={
                                            restaurant.id
                                        }
                                    >
                                        <td>
                                            <div className="restaurant-table-main">
                                                {restaurant.logoUrl ? (
                                                    <img
                                                        src={
                                                            restaurant.logoUrl
                                                        }
                                                        alt={
                                                            restaurant.name
                                                        }
                                                        className="restaurant-table-logo"
                                                    />
                                                ) : (
                                                    <div className="restaurant-table-placeholder">
                                                        🍽️
                                                    </div>
                                                )}

                                                <div>
                                                    <div className="restaurant-table-name">
                                                        {
                                                            restaurant.name
                                                        }
                                                    </div>

                                                    <div className="restaurant-table-meta">
                                                        {
                                                            restaurant.city
                                                        }
                                                        {" · "}
                                                        {
                                                            restaurant.address
                                                        }
                                                    </div>

                                                    {restaurant.owner && (
                                                        <div className="restaurant-table-owner">
                                                            Owner:{" "}
                                                            {
                                                                restaurant
                                                                    .owner
                                                                    .name
                                                            }
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            <div className="restaurant-delivery-time">
                                                {
                                                    restaurant.deliveryMinMinutes
                                                }
                                                –
                                                {
                                                    restaurant.deliveryMaxMinutes
                                                }{" "}
                                                min
                                            </div>

                                            <div className="restaurant-delivery-meta">
                                                {money(
                                                    restaurant.deliveryFee
                                                )}
                                                ֏ delivery
                                            </div>

                                            <div className="restaurant-delivery-meta">
                                                Min.{" "}
                                                {money(
                                                    restaurant.minimumOrder
                                                )}
                                                ֏
                                            </div>
                                        </td>

                                        <td>
                        <span className="restaurant-count">
                          {
                              restaurant
                                  ._count
                                  .products
                          }
                        </span>
                                        </td>

                                        <td>
                                            <button
                                                type="button"
                                                className={`restaurant-order-toggle ${
                                                    restaurant.isAcceptingOrders
                                                        ? "accepting"
                                                        : ""
                                                }`}
                                                disabled={
                                                    updatingId ===
                                                    restaurant.id
                                                }
                                                onClick={() =>
                                                    updateRestaurant(
                                                        restaurant.id,
                                                        {
                                                            isAcceptingOrders:
                                                                !restaurant.isAcceptingOrders,
                                                        }
                                                    )
                                                }
                                            >
                                                {restaurant.isAcceptingOrders
                                                    ? "Accepting"
                                                    : "Paused"}
                                            </button>
                                        </td>

                                        <td>
                        <span
                            className={`restaurant-status ${
                                restaurant.isActive
                                    ? "active"
                                    : "inactive"
                            }`}
                        >
                          {restaurant.isActive
                              ? "Active"
                              : "Inactive"}
                        </span>
                                        </td>

                                        <td>
                                            <div className="restaurant-table-actions">
                                                <button
                                                    type="button"
                                                    className="btn btn-line btn-sm"
                                                    disabled={
                                                        updatingId ===
                                                        restaurant.id
                                                    }
                                                    onClick={() =>
                                                        openEdit(
                                                            restaurant
                                                        )
                                                    }
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    className={`btn btn-sm ${
                                                        restaurant.isActive
                                                            ? "btn-outline-danger"
                                                            : "btn-outline-success"
                                                    }`}
                                                    disabled={
                                                        updatingId ===
                                                        restaurant.id
                                                    }
                                                    onClick={() =>
                                                        updateRestaurant(
                                                            restaurant.id,
                                                            {
                                                                isActive:
                                                                    !restaurant.isActive,
                                                            }
                                                        )
                                                    }
                                                >
                                                    {restaurant.isActive
                                                        ? "Disable"
                                                        : "Enable"}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}