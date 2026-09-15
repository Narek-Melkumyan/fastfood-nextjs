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

type Product = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    currency: string;
    imageUrl: string | null;
    ingredients: string[];
    allergens: string[];
    badge: string | null;
    ratingAverage: number;
    reviewCount: number;
    isAvailable: boolean;
    isFeatured: boolean;
    isActive: boolean;
    sortOrder: number;
    createdAt: string;

    restaurant: {
        id: number;
        name: string;
        slug: string;
        isActive: boolean;
    };

    category: {
        id: number;
        name: string;
        slug: string;
    };
};

type RestaurantOption = {
    id: number;
    name: string;
    isActive: boolean;
};

type CategoryOption = {
    id: number;
    name: string;
    slug: string;
};

type ImageUpload = {
    key: string;
    url: string;
};

const emptyForm = {
    name: "",
    description: "",
    price: "",
    restaurantId: "",
    categoryId: "",
    ingredients: "",
    allergens: "",
    badge: "",
    sortOrder: "0",
    isAvailable: true,
    isFeatured: false,
    isActive: true,
};

function money(value: number) {
    return value.toLocaleString(
        "en-US"
    );
}

export default function AdminProductsPage() {
    const { apiFetch } = useAuth();

    const [products, setProducts] =
        useState<Product[]>([]);

    const [
        restaurants,
        setRestaurants,
    ] =
        useState<
            RestaurantOption[]
        >([]);

    const [
        categories,
        setCategories,
    ] =
        useState<
            CategoryOption[]
        >([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [
        restaurantFilter,
        setRestaurantFilter,
    ] =
        useState("ALL");

    const [
        categoryFilter,
        setCategoryFilter,
    ] =
        useState("ALL");

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

    useEffect(() => {
        let ignore = false;

        async function loadProducts() {
            try {
                setLoading(true);
                setError("");

                const response =
                    await apiFetch(
                        "/api/admin/products"
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.error ||
                        "Could not load products."
                    );
                }

                if (!ignore) {
                    setProducts(
                        Array.isArray(
                            data.products
                        )
                            ? data.products
                            : []
                    );

                    setRestaurants(
                        Array.isArray(
                            data.restaurants
                        )
                            ? data.restaurants
                            : []
                    );

                    setCategories(
                        Array.isArray(
                            data.categories
                        )
                            ? data.categories
                            : []
                    );
                }
            } catch (error) {
                if (!ignore) {
                    setError(
                        error instanceof Error
                            ? error.message
                            : "Could not load products."
                    );
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        }

        loadProducts();

        return () => {
            ignore = true;
        };
    }, [apiFetch]);

    const filteredProducts =
        useMemo(() => {
            const query =
                search
                    .trim()
                    .toLowerCase();

            return products.filter(
                (product) => {
                    const matchesSearch =
                        !query ||
                        product.name
                            .toLowerCase()
                            .includes(
                                query
                            ) ||
                        product.restaurant
                            .name
                            .toLowerCase()
                            .includes(
                                query
                            ) ||
                        product.category
                            .name
                            .toLowerCase()
                            .includes(
                                query
                            );

                    const matchesRestaurant =
                        restaurantFilter ===
                        "ALL" ||
                        product.restaurant
                            .id ===
                        Number(
                            restaurantFilter
                        );

                    const matchesCategory =
                        categoryFilter ===
                        "ALL" ||
                        product.category
                            .id ===
                        Number(
                            categoryFilter
                        );

                    return (
                        matchesSearch &&
                        matchesRestaurant &&
                        matchesCategory
                    );
                }
            );
        }, [
            products,
            search,
            restaurantFilter,
            categoryFilter,
        ]);

    const availableCount =
        products.filter(
            (product) =>
                product.isAvailable &&
                product.isActive
        ).length;

    const featuredCount =
        products.filter(
            (product) =>
                product.isFeatured
        ).length;

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
            "product"
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
                    method: "DELETE",

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
                        "TEMP PRODUCT IMAGE CLEANUP ERROR:",
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
    }

    function openCreate() {
        setEditingId(null);

        setForm({
            ...emptyForm,

            restaurantId:
                restaurants[0]
                    ? String(
                        restaurants[0].id
                    )
                    : "",

            categoryId:
                categories[0]
                    ? String(
                        categories[0].id
                    )
                    : "",
        });

        setImage(null);
        setNewImageKey(null);
        setShowForm(true);
    }

    function openEdit(
        product: Product
    ) {
        setEditingId(
            product.id
        );

        setForm({
            name:
            product.name,

            description:
                product.description ||
                "",

            price:
                String(
                    product.price
                ),

            restaurantId:
                String(
                    product.restaurant.id
                ),

            categoryId:
                String(
                    product.category.id
                ),

            ingredients:
                product.ingredients.join(
                    ", "
                ),

            allergens:
                product.allergens.join(
                    ", "
                ),

            badge:
                product.badge || "",

            sortOrder:
                String(
                    product.sortOrder
                ),

            isAvailable:
            product.isAvailable,

            isFeatured:
            product.isFeatured,

            isActive:
            product.isActive,
        });

        setImage(
            product.imageUrl
                ? {
                    key: "",
                    url:
                    product.imageUrl,
                }
                : null
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
                    "TEMP PRODUCT IMAGE CLEANUP ERROR:",
                    error
                );
            }
        }
    }

    async function saveProduct(
        event:
        FormEvent<HTMLFormElement>
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

                price:
                    Number(
                        form.price
                    ),

                restaurantId:
                    Number(
                        form.restaurantId
                    ),

                categoryId:
                    Number(
                        form.categoryId
                    ),

                ingredients:
                    form.ingredients
                        .split(",")
                        .map(
                            (value) =>
                                value.trim()
                        )
                        .filter(Boolean),

                allergens:
                    form.allergens
                        .split(",")
                        .map(
                            (value) =>
                                value.trim()
                        )
                        .filter(Boolean),

                badge:
                form.badge,

                imageUrl:
                    image?.url ||
                    null,

                sortOrder:
                    Number(
                        form.sortOrder
                    ),

                isAvailable:
                form.isAvailable,

                isFeatured:
                form.isFeatured,

                isActive:
                form.isActive,
            };

            const response =
                await apiFetch(
                    editingId
                        ? `/api/admin/products/${editingId}`
                        : "/api/admin/products",
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
                    "Could not save product."
                );
            }

            if (editingId) {
                setProducts(
                    (current) =>
                        current.map(
                            (product) =>
                                product.id ===
                                editingId
                                    ? data.product
                                    : product
                        )
                );
            } else {
                setProducts(
                    (current) => [
                        data.product,
                        ...current,
                    ]
                );
            }

            resetEditor();
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Could not save product."
            );
        } finally {
            setSaving(false);
        }
    }

    async function updateProduct(
        productId: number,
        values: {
            isAvailable?: boolean;
            isFeatured?: boolean;
            isActive?: boolean;
        }
    ) {
        try {
            setUpdatingId(
                productId
            );

            setError("");

            const response =
                await apiFetch(
                    `/api/admin/products/${productId}`,
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
                    "Could not update product."
                );
            }

            setProducts(
                (current) =>
                    current.map(
                        (product) =>
                            product.id ===
                            productId
                                ? data.product
                                : product
                    )
            );
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Could not update product."
            );
        } finally {
            setUpdatingId(null);
        }
    }

    if (loading) {
        return (
            <div className="panel">
                <div className="panel-body text-center py-5">
                    Loading products...
                </div>
            </div>
        );
    }

    return (
        <div>
            <style>{`
        .admin-product-image {
          width: 58px;
          height: 58px;
          flex: 0 0 58px;
          object-fit: cover;
          border-radius: 14px;
          border: 1px solid var(--line);
          background: var(--surface-2);
        }

        .admin-product-placeholder {
          width: 58px;
          height: 58px;
          flex: 0 0 58px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: var(--surface-2);
          border: 1px solid var(--line);
          font-size: 22px;
        }

        .admin-product-name {
          font-weight: 750;
          color: var(--ink);
        }

        .admin-product-meta {
          margin-top: 3px;
          color: var(--muted);
          font-size: 12px;
        }

        .product-preview {
          width: 100%;
          max-width: 360px;
          height: 220px;
          object-fit: cover;
          border-radius: 16px;
          border: 1px solid var(--line);
        }

        .admin-product-actions {
          display: flex;
          justify-content: flex-end;
          gap: 7px;
          white-space: nowrap;
        }

        .products-admin-table th {
          white-space: nowrap;
          font-size: 12px;
        }

        .products-admin-table td {
          vertical-align: middle;
        }

        @media (max-width: 991px) {
          .products-admin-table {
            min-width: 920px;
          }
        }
      `}</style>

            <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-4">
                <div>
          <span className="eyebrow">
            Products
          </span>

                    <h1 className="display-md mb-1">
                        Manage products
                    </h1>

                    <p className="muted mb-0">
                        Add menu items and manage price,
                        availability and images.
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
                        : "+ Add product"}
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
                            ? "Edit product"
                            : "Add product"}
                    </div>

                    <div className="panel-body">
                        <form
                            onSubmit={
                                saveProduct
                            }
                        >
                            <div className="row g-3">
                                <div className="col-12 col-md-6">
                                    <label className="form-label">
                                        Product name
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
                                        Price
                                    </label>

                                    <div className="input-group">
                                        <input
                                            type="number"
                                            min="0"
                                            className="form-control"
                                            value={
                                                form.price
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                updateForm(
                                                    "price",
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

                                <div className="col-12 col-md-6">
                                    <label className="form-label">
                                        Restaurant
                                    </label>

                                    <select
                                        className="form-select"
                                        value={
                                            form.restaurantId
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            updateForm(
                                                "restaurantId",
                                                event.target
                                                    .value
                                            )
                                        }
                                        required
                                    >
                                        <option value="">
                                            Select restaurant
                                        </option>

                                        {restaurants.map(
                                            (restaurant) => (
                                                <option
                                                    key={
                                                        restaurant.id
                                                    }
                                                    value={
                                                        restaurant.id
                                                    }
                                                >
                                                    {
                                                        restaurant.name
                                                    }
                                                    {!restaurant.isActive
                                                        ? " (inactive)"
                                                        : ""}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>

                                <div className="col-12 col-md-6">
                                    <label className="form-label">
                                        Category
                                    </label>

                                    <select
                                        className="form-select"
                                        value={
                                            form.categoryId
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            updateForm(
                                                "categoryId",
                                                event.target
                                                    .value
                                            )
                                        }
                                        required
                                    >
                                        <option value="">
                                            Select category
                                        </option>

                                        {categories.map(
                                            (category) => (
                                                <option
                                                    key={
                                                        category.id
                                                    }
                                                    value={
                                                        category.id
                                                    }
                                                >
                                                    {
                                                        category.name
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>
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

                                <div className="col-12 col-md-6">
                                    <label className="form-label">
                                        Ingredients
                                    </label>

                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Beef, cheese, tomato, onion"
                                        value={
                                            form.ingredients
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            updateForm(
                                                "ingredients",
                                                event.target
                                                    .value
                                            )
                                        }
                                    />
                                </div>

                                <div className="col-12 col-md-6">
                                    <label className="form-label">
                                        Allergens
                                    </label>

                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Gluten, dairy"
                                        value={
                                            form.allergens
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            updateForm(
                                                "allergens",
                                                event.target
                                                    .value
                                            )
                                        }
                                    />
                                </div>

                                <div className="col-12 col-md-6">
                                    <label className="form-label">
                                        Badge
                                    </label>

                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Popular, New, Spicy..."
                                        value={
                                            form.badge
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            updateForm(
                                                "badge",
                                                event.target
                                                    .value
                                            )
                                        }
                                    />
                                </div>

                                <div className="col-12 col-md-6">
                                    <label className="form-label">
                                        Sort order
                                    </label>

                                    <input
                                        type="number"
                                        className="form-control"
                                        value={
                                            form.sortOrder
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            updateForm(
                                                "sortOrder",
                                                event.target
                                                    .value
                                            )
                                        }
                                    />
                                </div>

                                <div className="col-12">
                                    <label className="form-label">
                                        Product image
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

                                    <div className="form-text">
                                        {uploadingImage
                                            ? "Uploading..."
                                            : "The image will be resized, converted to WebP and uploaded to R2."}
                                    </div>

                                    {image && (
                                        <div className="mt-3">
                                            <img
                                                src={
                                                    image.url
                                                }
                                                alt="Product preview"
                                                className="product-preview"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="col-12">
                                    <div className="d-flex flex-wrap gap-4">
                                        <div className="form-check">
                                            <input
                                                id="product-available"
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={
                                                    form.isAvailable
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    updateForm(
                                                        "isAvailable",
                                                        event.target
                                                            .checked
                                                    )
                                                }
                                            />

                                            <label
                                                className="form-check-label"
                                                htmlFor="product-available"
                                            >
                                                Available
                                            </label>
                                        </div>

                                        <div className="form-check">
                                            <input
                                                id="product-featured"
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={
                                                    form.isFeatured
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    updateForm(
                                                        "isFeatured",
                                                        event.target
                                                            .checked
                                                    )
                                                }
                                            />

                                            <label
                                                className="form-check-label"
                                                htmlFor="product-featured"
                                            >
                                                Featured
                                            </label>
                                        </div>

                                        <div className="form-check">
                                            <input
                                                id="product-active"
                                                className="form-check-input"
                                                type="checkbox"
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
                                                htmlFor="product-active"
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
                                                : "Create product"}
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

            <div className="row g-3 mb-4">
                <div className="col-6 col-lg-4">
                    <div className="admin-stat">
                        <div className="label">
                            Products
                        </div>

                        <div className="value">
                            {products.length}
                        </div>
                    </div>
                </div>

                <div className="col-6 col-lg-4">
                    <div className="admin-stat">
                        <div className="label">
                            Available
                        </div>

                        <div className="value">
                            {availableCount}
                        </div>
                    </div>
                </div>

                <div className="col-6 col-lg-4">
                    <div className="admin-stat">
                        <div className="label">
                            Featured
                        </div>

                        <div className="value">
                            {featuredCount}
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
                                placeholder="Search product, restaurant or category..."
                                value={
                                    search
                                }
                                onChange={(
                                    event
                                ) =>
                                    setSearch(
                                        event.target
                                            .value
                                    )
                                }
                            />
                        </div>

                        <div className="col-12 col-lg-auto">
                            <select
                                className="form-select"
                                value={
                                    restaurantFilter
                                }
                                onChange={(
                                    event
                                ) =>
                                    setRestaurantFilter(
                                        event.target
                                            .value
                                    )
                                }
                            >
                                <option value="ALL">
                                    All restaurants
                                </option>

                                {restaurants.map(
                                    (restaurant) => (
                                        <option
                                            key={
                                                restaurant.id
                                            }
                                            value={
                                                restaurant.id
                                            }
                                        >
                                            {
                                                restaurant.name
                                            }
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        <div className="col-12 col-lg-auto">
                            <select
                                className="form-select"
                                value={
                                    categoryFilter
                                }
                                onChange={(
                                    event
                                ) =>
                                    setCategoryFilter(
                                        event.target
                                            .value
                                    )
                                }
                            >
                                <option value="ALL">
                                    All categories
                                </option>

                                {categories.map(
                                    (category) => (
                                        <option
                                            key={
                                                category.id
                                            }
                                            value={
                                                category.id
                                            }
                                        >
                                            {
                                                category.name
                                            }
                                        </option>
                                    )
                                )}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="panel">
                <div className="panel-head d-flex justify-content-between align-items-center">
          <span>
            Products
          </span>

                    <span className="muted">
            {filteredProducts.length} results
          </span>
                </div>

                {filteredProducts.length === 0 ? (
                    <div className="panel-body">
                        <div className="empty-state">
                            No products found.
                        </div>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table products-admin-table align-middle mb-0">
                            <thead>
                            <tr>
                                <th>
                                    Product
                                </th>

                                <th>
                                    Restaurant
                                </th>

                                <th>
                                    Price
                                </th>

                                <th>
                                    Available
                                </th>

                                <th>
                                    Featured
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
                            {filteredProducts.map(
                                (product) => (
                                    <tr
                                        key={
                                            product.id
                                        }
                                    >
                                        <td>
                                            <div className="d-flex align-items-center gap-3">
                                                {product.imageUrl ? (
                                                    <img
                                                        src={
                                                            product.imageUrl
                                                        }
                                                        alt={
                                                            product.name
                                                        }
                                                        className="admin-product-image"
                                                    />
                                                ) : (
                                                    <div className="admin-product-placeholder">
                                                        🍕
                                                    </div>
                                                )}

                                                <div>
                                                    <div className="admin-product-name">
                                                        {
                                                            product.name
                                                        }
                                                    </div>

                                                    <div className="admin-product-meta">
                                                        {
                                                            product.category
                                                                .name
                                                        }

                                                        {product.badge
                                                            ? ` · ${product.badge}`
                                                            : ""}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            <div className="fw-semibold">
                                                {
                                                    product.restaurant
                                                        .name
                                                }
                                            </div>
                                        </td>

                                        <td className="fw-bold">
                                            {money(
                                                product.price
                                            )}
                                            ֏
                                        </td>

                                        <td>
                                            <button
                                                type="button"
                                                className={`btn btn-sm ${
                                                    product.isAvailable
                                                        ? "btn-outline-success"
                                                        : "btn-outline-secondary"
                                                }`}
                                                disabled={
                                                    updatingId ===
                                                    product.id
                                                }
                                                onClick={() =>
                                                    updateProduct(
                                                        product.id,
                                                        {
                                                            isAvailable:
                                                                !product.isAvailable,
                                                        }
                                                    )
                                                }
                                            >
                                                {product.isAvailable
                                                    ? "Available"
                                                    : "Unavailable"}
                                            </button>
                                        </td>

                                        <td>
                                            <button
                                                type="button"
                                                className={`btn btn-sm ${
                                                    product.isFeatured
                                                        ? "btn-outline-warning"
                                                        : "btn-line"
                                                }`}
                                                disabled={
                                                    updatingId ===
                                                    product.id
                                                }
                                                onClick={() =>
                                                    updateProduct(
                                                        product.id,
                                                        {
                                                            isFeatured:
                                                                !product.isFeatured,
                                                        }
                                                    )
                                                }
                                            >
                                                {product.isFeatured
                                                    ? "Featured"
                                                    : "Normal"}
                                            </button>
                                        </td>

                                        <td>
                        <span
                            className={`badge ${
                                product.isActive
                                    ? "text-bg-success"
                                    : "text-bg-secondary"
                            }`}
                        >
                          {product.isActive
                              ? "Active"
                              : "Inactive"}
                        </span>
                                        </td>

                                        <td>
                                            <div className="admin-product-actions">
                                                <button
                                                    type="button"
                                                    className="btn btn-line btn-sm"
                                                    onClick={() =>
                                                        openEdit(
                                                            product
                                                        )
                                                    }
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    className={`btn btn-sm ${
                                                        product.isActive
                                                            ? "btn-outline-danger"
                                                            : "btn-outline-success"
                                                    }`}
                                                    disabled={
                                                        updatingId ===
                                                        product.id
                                                    }
                                                    onClick={() =>
                                                        updateProduct(
                                                            product.id,
                                                            {
                                                                isActive:
                                                                    !product.isActive,
                                                            }
                                                        )
                                                    }
                                                >
                                                    {product.isActive
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