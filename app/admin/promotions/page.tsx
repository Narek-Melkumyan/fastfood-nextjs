"use client";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import type {
    ChangeEvent,
    FormEvent,
} from "react";

import { useAuth } from "@/app/providers/AuthProvider";

type PromotionType =
    | "PERCENTAGE"
    | "FIXED_AMOUNT"
    | "FREE_DELIVERY";

type Option = {
    id: number;
    name: string;
};

type ProductOption = {
    id: number;
    name: string;
    restaurant: {
        name: string;
    };
};

type Promotion = {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    code: string | null;
    imageUrl: string | null;
    type: PromotionType;
    value: number;
    minimumOrder: number;
    maxDiscount: number | null;
    newCustomersOnly: boolean;
    isStackable: boolean;
    usageLimit: number | null;
    perUserLimit: number | null;
    startsAt: string | null;
    endsAt: string | null;
    isActive: boolean;
    createdAt: string;

    restaurants: Option[];
    categories: Option[];
    products: Option[];

    _count: {
        redemptions: number;
        orders: number;
    };
};

type ImageUpload = {
    key: string;
    url: string;
};

const emptyForm = {
    title: "",
    description: "",
    code: "",
    type: "PERCENTAGE" as PromotionType,
    value: "10",
    minimumOrder: "0",
    maxDiscount: "",
    usageLimit: "",
    perUserLimit: "",
    startsAt: "",
    endsAt: "",
    newCustomersOnly: false,
    isStackable: false,
    isActive: true,
};

function money(value: number) {
    return value.toLocaleString(
        "en-US"
    );
}

function formatType(
    type: PromotionType
) {
    if (
        type ===
        "PERCENTAGE"
    ) {
        return "Percentage";
    }

    if (
        type ===
        "FIXED_AMOUNT"
    ) {
        return "Fixed amount";
    }

    return "Free delivery";
}

function promotionValue(
    promotion: Promotion
) {
    if (
        promotion.type ===
        "PERCENTAGE"
    ) {
        return `${promotion.value}%`;
    }

    if (
        promotion.type ===
        "FIXED_AMOUNT"
    ) {
        return `${money(
            promotion.value
        )}֏`;
    }

    return "Free delivery";
}

function toDateInput(
    value: string | null
) {
    if (!value) {
        return "";
    }

    const date =
        new Date(value);

    const offset =
        date.getTimezoneOffset();

    const local =
        new Date(
            date.getTime() -
            offset * 60_000
        );

    return local
        .toISOString()
        .slice(0, 16);
}

export default function AdminPromotionsPage() {
    const { apiFetch } =
        useAuth();

    const [
        promotions,
        setPromotions,
    ] =
        useState<Promotion[]>(
            []
        );

    const [
        restaurants,
        setRestaurants,
    ] =
        useState<Option[]>([]);

    const [
        categories,
        setCategories,
    ] =
        useState<Option[]>([]);

    const [
        products,
        setProducts,
    ] =
        useState<ProductOption[]>(
            []
        );

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [
        statusFilter,
        setStatusFilter,
    ] =
        useState<
            "ALL" | "ACTIVE" | "INACTIVE"
        >("ALL");

    const [
        showForm,
        setShowForm,
    ] =
        useState(false);

    const [
        editingId,
        setEditingId,
    ] =
        useState<number | null>(
            null
        );

    const [saving, setSaving] =
        useState(false);

    const [
        updatingId,
        setUpdatingId,
    ] =
        useState<number | null>(
            null
        );

    const [
        uploadingImage,
        setUploadingImage,
    ] =
        useState(false);

    const [form, setForm] =
        useState(emptyForm);

    const [
        image,
        setImage,
    ] =
        useState<ImageUpload | null>(
            null
        );

    const [
        newImageKey,
        setNewImageKey,
    ] =
        useState<string | null>(
            null
        );

    const [
        selectedRestaurants,
        setSelectedRestaurants,
    ] =
        useState<number[]>([]);

    const [
        selectedCategories,
        setSelectedCategories,
    ] =
        useState<number[]>([]);

    const [
        selectedProducts,
        setSelectedProducts,
    ] =
        useState<number[]>([]);

    useEffect(() => {
        let ignore = false;

        async function loadPromotions() {
            try {
                setLoading(true);
                setError("");

                const response =
                    await apiFetch(
                        "/api/admin/promotions"
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.error ||
                        "Could not load promotions."
                    );
                }

                if (!ignore) {
                    setPromotions(
                        data.promotions || []
                    );

                    setRestaurants(
                        data.restaurants || []
                    );

                    setCategories(
                        data.categories || []
                    );

                    setProducts(
                        data.products || []
                    );
                }
            } catch (error) {
                if (!ignore) {
                    setError(
                        error instanceof Error
                            ? error.message
                            : "Could not load promotions."
                    );
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        }

        loadPromotions();

        return () => {
            ignore = true;
        };
    }, [apiFetch]);

    const filteredPromotions =
        useMemo(() => {
            const query =
                search
                    .trim()
                    .toLowerCase();

            return promotions.filter(
                (promotion) => {
                    const matchesSearch =
                        !query ||
                        promotion.title
                            .toLowerCase()
                            .includes(
                                query
                            ) ||
                        promotion.code
                            ?.toLowerCase()
                            .includes(
                                query
                            );

                    const matchesStatus =
                        statusFilter ===
                        "ALL" ||
                        (
                            statusFilter ===
                            "ACTIVE" &&
                            promotion.isActive
                        ) ||
                        (
                            statusFilter ===
                            "INACTIVE" &&
                            !promotion.isActive
                        );

                    return (
                        Boolean(
                            matchesSearch
                        ) &&
                        matchesStatus
                    );
                }
            );
        }, [
            promotions,
            search,
            statusFilter,
        ]);

    function updateForm(
        field:
        keyof typeof emptyForm,
        value:
            | string
            | boolean
    ) {
        setForm(
            (current) => ({
                ...current,
                [field]: value,
            })
        );
    }

    function toggleId(
        id: number,
        setter:
        React.Dispatch<
            React.SetStateAction<
                number[]
            >
        >
    ) {
        setter(
            (current) =>
                current.includes(id)
                    ? current.filter(
                        (value) =>
                            value !== id
                    )
                    : [
                        ...current,
                        id,
                    ]
        );
    }

    async function uploadImage(
        file: File
    ) {
        const formData =
            new FormData();

        formData.append(
            "file",
            file
        );

        formData.append(
            "kind",
            "promotion"
        );

        const response =
            await apiFetch(
                "/api/admin/media",
                {
                    method: "POST",
                    body: formData,
                }
            );

        const data =
            await response.json();

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
        const response =
            await apiFetch(
                "/api/admin/media",
                {
                    method:
                        "DELETE",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body:
                        JSON.stringify({
                            key,
                        }),
                }
            );

        if (!response.ok) {
            const data =
                await response.json();

            throw new Error(
                data.error ||
                "Could not delete image."
            );
        }
    }

    async function handleImage(
        event:
        ChangeEvent<HTMLInputElement>
    ) {
        const file =
            event.target
                .files?.[0];

        if (!file) {
            return;
        }

        const previousKey =
            newImageKey;

        try {
            setUploadingImage(
                true
            );

            setError("");

            const uploaded =
                await uploadImage(
                    file
                );

            setImage(
                uploaded
            );

            setNewImageKey(
                uploaded.key
            );

            if (previousKey) {
                try {
                    await deleteUploadedImage(
                        previousKey
                    );
                } catch (error) {
                    console.error(
                        "TEMP PROMOTION IMAGE CLEANUP ERROR:",
                        error
                    );
                }
            }
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Could not upload image."
            );
        } finally {
            setUploadingImage(
                false
            );

            event.target.value =
                "";
        }
    }

    function resetEditor() {
        setShowForm(false);
        setEditingId(null);
        setForm(emptyForm);
        setImage(null);
        setNewImageKey(null);
        setSelectedRestaurants([]);
        setSelectedCategories([]);
        setSelectedProducts([]);
    }

    function openCreate() {
        resetEditor();

        setForm(
            emptyForm
        );

        setShowForm(true);
    }

    function openEdit(
        promotion: Promotion
    ) {
        setEditingId(
            promotion.id
        );

        setForm({
            title:
            promotion.title,

            description:
                promotion.description ||
                "",

            code:
                promotion.code || "",

            type:
            promotion.type,

            value:
                String(
                    promotion.value
                ),

            minimumOrder:
                String(
                    promotion.minimumOrder
                ),

            maxDiscount:
                promotion.maxDiscount ===
                null
                    ? ""
                    : String(
                        promotion.maxDiscount
                    ),

            usageLimit:
                promotion.usageLimit ===
                null
                    ? ""
                    : String(
                        promotion.usageLimit
                    ),

            perUserLimit:
                promotion.perUserLimit ===
                null
                    ? ""
                    : String(
                        promotion.perUserLimit
                    ),

            startsAt:
                toDateInput(
                    promotion.startsAt
                ),

            endsAt:
                toDateInput(
                    promotion.endsAt
                ),

            newCustomersOnly:
            promotion.newCustomersOnly,

            isStackable:
            promotion.isStackable,

            isActive:
            promotion.isActive,
        });

        setImage(
            promotion.imageUrl
                ? {
                    key: "",
                    url:
                    promotion.imageUrl,
                }
                : null
        );

        setSelectedRestaurants(
            promotion.restaurants.map(
                (item) =>
                    item.id
            )
        );

        setSelectedCategories(
            promotion.categories.map(
                (item) =>
                    item.id
            )
        );

        setSelectedProducts(
            promotion.products.map(
                (item) =>
                    item.id
            )
        );

        setNewImageKey(null);

        setShowForm(true);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }

    async function closeForm() {
        const tempKey =
            newImageKey;

        resetEditor();

        if (tempKey) {
            try {
                await deleteUploadedImage(
                    tempKey
                );
            } catch (error) {
                console.error(
                    "TEMP PROMOTION IMAGE CLEANUP ERROR:",
                    error
                );
            }
        }
    }

    async function savePromotion(
        event:
        FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        try {
            setSaving(true);
            setError("");

            const body = {
                title:
                form.title,

                description:
                form.description,

                code:
                form.code,

                type:
                form.type,

                value:
                    Number(
                        form.value
                    ),

                minimumOrder:
                    Number(
                        form.minimumOrder
                    ),

                maxDiscount:
                form.maxDiscount,

                usageLimit:
                form.usageLimit,

                perUserLimit:
                form.perUserLimit,

                startsAt:
                    form.startsAt
                        ? new Date(
                            form.startsAt
                        ).toISOString()
                        : null,

                endsAt:
                    form.endsAt
                        ? new Date(
                            form.endsAt
                        ).toISOString()
                        : null,

                newCustomersOnly:
                form.newCustomersOnly,

                isStackable:
                form.isStackable,

                isActive:
                form.isActive,

                imageUrl:
                    image?.url || null,

                restaurantIds:
                selectedRestaurants,

                categoryIds:
                selectedCategories,

                productIds:
                selectedProducts,
            };

            const response =
                await apiFetch(
                    editingId
                        ? `/api/admin/promotions/${editingId}`
                        : "/api/admin/promotions",
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
                    "Could not save promotion."
                );
            }

            if (editingId) {
                setPromotions(
                    (current) =>
                        current.map(
                            (promotion) =>
                                promotion.id ===
                                editingId
                                    ? data.promotion
                                    : promotion
                        )
                );
            } else {
                setPromotions(
                    (current) => [
                        data.promotion,
                        ...current,
                    ]
                );
            }

            resetEditor();
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Could not save promotion."
            );
        } finally {
            setSaving(false);
        }
    }

    async function toggleActive(
        promotion: Promotion
    ) {
        try {
            setUpdatingId(
                promotion.id
            );

            setError("");

            const response =
                await apiFetch(
                    `/api/admin/promotions/${promotion.id}`,
                    {
                        method:
                            "PATCH",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify({
                                isActive:
                                    !promotion.isActive,
                            }),
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    "Could not update promotion."
                );
            }

            setPromotions(
                (current) =>
                    current.map(
                        (item) =>
                            item.id ===
                            promotion.id
                                ? data.promotion
                                : item
                    )
            );
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Could not update promotion."
            );
        } finally {
            setUpdatingId(null);
        }
    }

    if (loading) {
        return (
            <div className="panel">
                <div className="panel-body text-center py-5">
                    Loading promotions...
                </div>
            </div>
        );
    }

    return (
        <div>
            <style>{`
        .promotion-image {
          width: 70px;
          height: 46px;
          object-fit: cover;
          border-radius: 10px;
          border: 1px solid var(--line);
        }

        .promotion-placeholder {
          width: 70px;
          height: 46px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: var(--surface-2);
          border: 1px solid var(--line);
          font-size: 20px;
        }

        .promotion-preview {
          width: 100%;
          max-width: 480px;
          height: 230px;
          object-fit: cover;
          border-radius: 16px;
          border: 1px solid var(--line);
        }

        .promotion-scope {
          max-height: 190px;
          overflow: auto;
          padding: 12px;
          border: 1px solid var(--line);
          border-radius: 12px;
        }

        .promotion-scope-row {
          padding: 5px 0;
        }

        .promotion-actions {
          display: flex;
          justify-content: flex-end;
          gap: 7px;
          white-space: nowrap;
        }

        @media (max-width: 991px) {
          .promotion-table {
            min-width: 900px;
          }
        }
      `}</style>

            <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-4">
                <div>
          <span className="eyebrow">
            Promotions
          </span>

                    <h1 className="display-md mb-1">
                        Manage promotions
                    </h1>

                    <p className="muted mb-0">
                        Create discount codes,
                        free delivery offers and campaigns.
                    </p>
                </div>

                <button
                    type="button"
                    className="btn btn-brand"
                    disabled={
                        saving ||
                        uploadingImage
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
                        : "+ Add promotion"}
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
                            ? "Edit promotion"
                            : "Add promotion"}
                    </div>

                    <div className="panel-body">
                        <form
                            onSubmit={
                                savePromotion
                            }
                        >
                            <div className="row g-3">
                                <div className="col-12 col-md-6">
                                    <label className="form-label">
                                        Title
                                    </label>

                                    <input
                                        type="text"
                                        className="form-control"
                                        value={
                                            form.title
                                        }
                                        onChange={(event) =>
                                            updateForm(
                                                "title",
                                                event.target.value
                                            )
                                        }
                                        required
                                    />
                                </div>

                                <div className="col-12 col-md-6">
                                    <label className="form-label">
                                        Promo code
                                    </label>

                                    <input
                                        type="text"
                                        className="form-control text-uppercase"
                                        placeholder="FOODLY20"
                                        value={
                                            form.code
                                        }
                                        onChange={(event) =>
                                            updateForm(
                                                "code",
                                                event.target.value
                                            )
                                        }
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
                                        onChange={(event) =>
                                            updateForm(
                                                "description",
                                                event.target.value
                                            )
                                        }
                                    />
                                </div>

                                <div className="col-12 col-md-4">
                                    <label className="form-label">
                                        Type
                                    </label>

                                    <select
                                        className="form-select"
                                        value={
                                            form.type
                                        }
                                        onChange={(event) =>
                                            updateForm(
                                                "type",
                                                event.target.value
                                            )
                                        }
                                    >
                                        <option value="PERCENTAGE">
                                            Percentage
                                        </option>

                                        <option value="FIXED_AMOUNT">
                                            Fixed amount
                                        </option>

                                        <option value="FREE_DELIVERY">
                                            Free delivery
                                        </option>
                                    </select>
                                </div>

                                <div className="col-12 col-md-4">
                                    <label className="form-label">
                                        {form.type ===
                                        "PERCENTAGE"
                                            ? "Percentage"
                                            : "Value"}
                                    </label>

                                    <input
                                        type="number"
                                        min="0"
                                        max={
                                            form.type ===
                                            "PERCENTAGE"
                                                ? 100
                                                : undefined
                                        }
                                        className="form-control"
                                        disabled={
                                            form.type ===
                                            "FREE_DELIVERY"
                                        }
                                        value={
                                            form.type ===
                                            "FREE_DELIVERY"
                                                ? "0"
                                                : form.value
                                        }
                                        onChange={(event) =>
                                            updateForm(
                                                "value",
                                                event.target.value
                                            )
                                        }
                                        required={
                                            form.type !==
                                            "FREE_DELIVERY"
                                        }
                                    />
                                </div>

                                <div className="col-12 col-md-4">
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
                                            onChange={(event) =>
                                                updateForm(
                                                    "minimumOrder",
                                                    event.target.value
                                                )
                                            }
                                        />

                                        <span className="input-group-text">
                      ֏
                    </span>
                                    </div>
                                </div>

                                {form.type ===
                                    "PERCENTAGE" && (
                                        <div className="col-12 col-md-4">
                                            <label className="form-label">
                                                Max discount
                                            </label>

                                            <input
                                                type="number"
                                                min="0"
                                                className="form-control"
                                                placeholder="Optional"
                                                value={
                                                    form.maxDiscount
                                                }
                                                onChange={(event) =>
                                                    updateForm(
                                                        "maxDiscount",
                                                        event.target.value
                                                    )
                                                }
                                            />
                                        </div>
                                    )}

                                <div className="col-12 col-md-4">
                                    <label className="form-label">
                                        Total usage limit
                                    </label>

                                    <input
                                        type="number"
                                        min="1"
                                        className="form-control"
                                        placeholder="Unlimited"
                                        value={
                                            form.usageLimit
                                        }
                                        onChange={(event) =>
                                            updateForm(
                                                "usageLimit",
                                                event.target.value
                                            )
                                        }
                                    />
                                </div>

                                <div className="col-12 col-md-4">
                                    <label className="form-label">
                                        Per user limit
                                    </label>

                                    <input
                                        type="number"
                                        min="1"
                                        className="form-control"
                                        placeholder="Unlimited"
                                        value={
                                            form.perUserLimit
                                        }
                                        onChange={(event) =>
                                            updateForm(
                                                "perUserLimit",
                                                event.target.value
                                            )
                                        }
                                    />
                                </div>

                                <div className="col-12 col-md-6">
                                    <label className="form-label">
                                        Starts
                                    </label>

                                    <input
                                        type="datetime-local"
                                        className="form-control"
                                        value={
                                            form.startsAt
                                        }
                                        onChange={(event) =>
                                            updateForm(
                                                "startsAt",
                                                event.target.value
                                            )
                                        }
                                    />
                                </div>

                                <div className="col-12 col-md-6">
                                    <label className="form-label">
                                        Ends
                                    </label>

                                    <input
                                        type="datetime-local"
                                        className="form-control"
                                        value={
                                            form.endsAt
                                        }
                                        onChange={(event) =>
                                            updateForm(
                                                "endsAt",
                                                event.target.value
                                            )
                                        }
                                    />
                                </div>

                                <div className="col-12">
                                    <label className="form-label">
                                        Promotion image
                                    </label>

                                    <input
                                        type="file"
                                        className="form-control"
                                        accept="image/jpeg,image/png,image/webp,image/avif"
                                        disabled={
                                            uploadingImage
                                        }
                                        onChange={
                                            handleImage
                                        }
                                    />

                                    {image && (
                                        <div className="mt-3">
                                            <img
                                                src={
                                                    image.url
                                                }
                                                alt="Promotion preview"
                                                className="promotion-preview"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="col-12 col-lg-4">
                                    <label className="form-label">
                                        Restaurants
                                    </label>

                                    <div className="promotion-scope">
                                        {restaurants.map(
                                            (restaurant) => (
                                                <div
                                                    className="form-check promotion-scope-row"
                                                    key={
                                                        restaurant.id
                                                    }
                                                >
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id={`promo-restaurant-${restaurant.id}`}
                                                        checked={
                                                            selectedRestaurants.includes(
                                                                restaurant.id
                                                            )
                                                        }
                                                        onChange={() =>
                                                            toggleId(
                                                                restaurant.id,
                                                                setSelectedRestaurants
                                                            )
                                                        }
                                                    />

                                                    <label
                                                        className="form-check-label"
                                                        htmlFor={`promo-restaurant-${restaurant.id}`}
                                                    >
                                                        {
                                                            restaurant.name
                                                        }
                                                    </label>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>

                                <div className="col-12 col-lg-4">
                                    <label className="form-label">
                                        Categories
                                    </label>

                                    <div className="promotion-scope">
                                        {categories.map(
                                            (category) => (
                                                <div
                                                    className="form-check promotion-scope-row"
                                                    key={
                                                        category.id
                                                    }
                                                >
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id={`promo-category-${category.id}`}
                                                        checked={
                                                            selectedCategories.includes(
                                                                category.id
                                                            )
                                                        }
                                                        onChange={() =>
                                                            toggleId(
                                                                category.id,
                                                                setSelectedCategories
                                                            )
                                                        }
                                                    />

                                                    <label
                                                        className="form-check-label"
                                                        htmlFor={`promo-category-${category.id}`}
                                                    >
                                                        {
                                                            category.name
                                                        }
                                                    </label>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>

                                <div className="col-12 col-lg-4">
                                    <label className="form-label">
                                        Products
                                    </label>

                                    <div className="promotion-scope">
                                        {products.map(
                                            (product) => (
                                                <div
                                                    className="form-check promotion-scope-row"
                                                    key={
                                                        product.id
                                                    }
                                                >
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id={`promo-product-${product.id}`}
                                                        checked={
                                                            selectedProducts.includes(
                                                                product.id
                                                            )
                                                        }
                                                        onChange={() =>
                                                            toggleId(
                                                                product.id,
                                                                setSelectedProducts
                                                            )
                                                        }
                                                    />

                                                    <label
                                                        className="form-check-label"
                                                        htmlFor={`promo-product-${product.id}`}
                                                    >
                                                        {
                                                            product.name
                                                        }

                                                        <span className="muted small">
                              {" "}
                                                            ·{" "}
                                                            {
                                                                product.restaurant
                                                                    .name
                                                            }
                            </span>
                                                    </label>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>

                                <div className="col-12">
                                    <p className="muted small mb-2">
                                        Leave all three scope sections empty
                                        to make the promotion general.
                                    </p>

                                    <div className="d-flex flex-wrap gap-4">
                                        <div className="form-check">
                                            <input
                                                id="promo-new"
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={
                                                    form.newCustomersOnly
                                                }
                                                onChange={(event) =>
                                                    updateForm(
                                                        "newCustomersOnly",
                                                        event.target.checked
                                                    )
                                                }
                                            />

                                            <label
                                                className="form-check-label"
                                                htmlFor="promo-new"
                                            >
                                                New customers only
                                            </label>
                                        </div>

                                        <div className="form-check">
                                            <input
                                                id="promo-stackable"
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={
                                                    form.isStackable
                                                }
                                                onChange={(event) =>
                                                    updateForm(
                                                        "isStackable",
                                                        event.target.checked
                                                    )
                                                }
                                            />

                                            <label
                                                className="form-check-label"
                                                htmlFor="promo-stackable"
                                            >
                                                Stackable
                                            </label>
                                        </div>

                                        <div className="form-check">
                                            <input
                                                id="promo-active"
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={
                                                    form.isActive
                                                }
                                                onChange={(event) =>
                                                    updateForm(
                                                        "isActive",
                                                        event.target.checked
                                                    )
                                                }
                                            />

                                            <label
                                                className="form-check-label"
                                                htmlFor="promo-active"
                                            >
                                                Active
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
                                            uploadingImage
                                        }
                                    >
                                        {saving
                                            ? "Saving..."
                                            : editingId
                                                ? "Save changes"
                                                : "Create promotion"}
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-line"
                                        disabled={
                                            saving ||
                                            uploadingImage
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
                    <div className="row g-3">
                        <div className="col">
                            <input
                                type="search"
                                className="form-control"
                                placeholder="Search promotion or code..."
                                value={
                                    search
                                }
                                onChange={(event) =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                            />
                        </div>

                        <div className="col-auto">
                            <select
                                className="form-select"
                                value={
                                    statusFilter
                                }
                                onChange={(event) =>
                                    setStatusFilter(
                                        event.target
                                            .value as
                                            | "ALL"
                                            | "ACTIVE"
                                            | "INACTIVE"
                                    )
                                }
                            >
                                <option value="ALL">
                                    All
                                </option>

                                <option value="ACTIVE">
                                    Active
                                </option>

                                <option value="INACTIVE">
                                    Inactive
                                </option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="panel">
                <div className="panel-head d-flex justify-content-between">
          <span>
            Promotions
          </span>

                    <span className="muted">
            {
                filteredPromotions.length
            }{" "}
                        results
          </span>
                </div>

                {filteredPromotions.length ===
                0 ? (
                    <div className="panel-body">
                        <div className="empty-state">
                            No promotions found.
                        </div>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table promotion-table align-middle mb-0">
                            <thead>
                            <tr>
                                <th>
                                    Promotion
                                </th>

                                <th>
                                    Discount
                                </th>

                                <th>
                                    Code
                                </th>

                                <th>
                                    Uses
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
                            {filteredPromotions.map(
                                (promotion) => (
                                    <tr
                                        key={
                                            promotion.id
                                        }
                                    >
                                        <td>
                                            <div className="d-flex align-items-center gap-3">
                                                {promotion.imageUrl ? (
                                                    <img
                                                        src={
                                                            promotion.imageUrl
                                                        }
                                                        alt={
                                                            promotion.title
                                                        }
                                                        className="promotion-image"
                                                    />
                                                ) : (
                                                    <div className="promotion-placeholder">
                                                        🏷️
                                                    </div>
                                                )}

                                                <div>
                                                    <div className="fw-bold">
                                                        {
                                                            promotion.title
                                                        }
                                                    </div>

                                                    <div className="muted small">
                                                        {formatType(
                                                            promotion.type
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="fw-bold">
                                            {promotionValue(
                                                promotion
                                            )}
                                        </td>

                                        <td>
                                            {promotion.code ? (
                                                <code>
                                                    {
                                                        promotion.code
                                                    }
                                                </code>
                                            ) : (
                                                <span className="muted">
                            Automatic
                          </span>
                                            )}
                                        </td>

                                        <td>
                                            {
                                                promotion
                                                    ._count
                                                    .redemptions
                                            }

                                            {promotion.usageLimit !==
                                                null &&
                                                ` / ${promotion.usageLimit}`}
                                        </td>

                                        <td>
                        <span
                            className={`badge ${
                                promotion.isActive
                                    ? "text-bg-success"
                                    : "text-bg-secondary"
                            }`}
                        >
                          {promotion.isActive
                              ? "Active"
                              : "Inactive"}
                        </span>
                                        </td>

                                        <td>
                                            <div className="promotion-actions">
                                                <button
                                                    type="button"
                                                    className="btn btn-line btn-sm"
                                                    onClick={() =>
                                                        openEdit(
                                                            promotion
                                                        )
                                                    }
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    className={`btn btn-sm ${
                                                        promotion.isActive
                                                            ? "btn-outline-danger"
                                                            : "btn-outline-success"
                                                    }`}
                                                    disabled={
                                                        updatingId ===
                                                        promotion.id
                                                    }
                                                    onClick={() =>
                                                        toggleActive(
                                                            promotion
                                                        )
                                                    }
                                                >
                                                    {promotion.isActive
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