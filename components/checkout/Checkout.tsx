"use client";

import {
    useEffect,
    useState,
} from "react";

import Link from "next/link";

import {
    useCartStore,
} from "@/store/cartStore";

import {
    useAuth,
} from "@/app/providers/AuthProvider";
import DeliveryMap from "@/components/checkout/DeliveryMap";
import type { DeliveryPreview } from "@/lib/maps";



/*
 * =========================================
 * STYLES
 * =========================================
 */

const pageStyles = `
  .summary-sticky{
    position:sticky;
    top:calc(var(--nav-h) + 16px);
  }

  .stepper{
    display:flex;
    align-items:center;
    gap:.75rem;
    flex-wrap:wrap;
  }

  .stepper .st{
    display:flex;
    align-items:center;
    gap:.55rem;
    font-size:.9rem;
    font-weight:600;
    color:var(--muted);
  }

  .stepper .st b{
    display:grid;
    place-items:center;
    width:26px;
    height:26px;
    border-radius:var(--pill);
    background:var(--surface-2);
    border:1px solid var(--line);
    font-size:.78rem;
  }

  .stepper .st.done{
    color:var(--accent);
  }

  .stepper .st.done b{
    background:var(--accent-tint);
    border-color:transparent;
    color:var(--accent);
  }

  .stepper .st.now{
    color:var(--ink);
  }

  .stepper .st.now b{
    background:var(--brand);
    border-color:transparent;
    color:#fff;
  }

  .stepper .sep{
    flex:1;
    min-width:20px;
    height:1px;
    background:var(--line);
  }

  .pay-option{
    display:flex;
    align-items:center;
    gap:.85rem;
    padding:1rem 1.15rem;
    border:1px solid var(--line);
    border-radius:var(--r-sm);
    cursor:pointer;
    transition:
      border-color .2s var(--ease),
      background .2s var(--ease);
  }

  .pay-option:hover{
    border-color:var(--line-strong);
  }

  .pay-option:has(input:checked){
    border-color:var(--brand);
    background:var(--brand-tint);
  }

  .pay-option.is-disabled{
    opacity:.55;
    cursor:not-allowed;
  }

  .account-info{
    display:flex;
    justify-content:space-between;
    align-items:center;
    gap:1rem;
    padding:.9rem 1rem;
    margin-bottom:1rem;
    border:1px solid var(--line);
    border-radius:var(--r-sm);
    background:var(--surface-2);
  }

  .account-info p{
    margin:0;
    font-size:.88rem;
  }

  .account-badge{
    display:inline-flex;
    align-items:center;
    padding:.32rem .65rem;
    border-radius:999px;
    background:var(--accent-tint);
    color:var(--accent);
    font-size:.75rem;
    font-weight:700;
    white-space:nowrap;
  }

  @media (max-width:991.98px){
    .summary-sticky{
      position:static;
    }
  }

  @media (max-width:767.98px){
    .stepper{
      gap:.5rem;
    }

    .stepper .st{
      font-size:.8rem;
    }

    .stepper .sep{
      min-width:10px;
    }
  }

  @media (max-width:575.98px){
    .stepper .sep{
      display:none;
    }

    .stepper{
      align-items:flex-start;
      justify-content:space-between;
    }

    .stepper .st{
      flex:1 1 30%;
      flex-direction:column;
      text-align:center;
      gap:.35rem;
    }

    .pay-option{
      padding:.9rem;
    }
  }
    .delivery-route-grid{
    display:grid;
    grid-template-columns:repeat(2,minmax(0,1fr));
    gap:14px;
    margin-top:18px;
  }

  .delivery-route-card{
    position:relative;
    overflow:hidden;
    padding:18px;
    border:1px solid var(--line);
    border-radius:18px;
    background:var(--surface);
    box-shadow:0 8px 24px rgba(17,17,17,.05);
  }

  .delivery-route-card::before{
    content:"";
    position:absolute;
    top:0;
    left:0;
    width:4px;
    height:100%;
    background:var(--brand);
  }

  .delivery-route-head{
    display:flex;
    justify-content:space-between;
    align-items:flex-start;
    gap:12px;
  }

  .delivery-route-restaurant{
    display:flex;
    align-items:center;
    gap:10px;
    min-width:0;
  }

  .delivery-route-icon{
    width:38px;
    height:38px;
    flex:0 0 38px;
    display:grid;
    place-items:center;
    border-radius:12px;
    background:var(--brand-tint);
    color:var(--brand);
    font-size:18px;
  }

  .delivery-route-name{
    margin:0;
    font-size:.95rem;
    font-weight:800;
    color:var(--ink);
  }

  .delivery-route-label{
    margin-top:2px;
    font-size:.75rem;
    color:var(--muted);
  }

  .delivery-route-eta{
    flex:0 0 auto;
    padding:6px 10px;
    border-radius:999px;
    background:var(--accent-tint);
    color:var(--accent);
    font-size:.75rem;
    font-weight:800;
    white-space:nowrap;
  }

  .delivery-route-stats{
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:10px;
    margin-top:16px;
  }

  .delivery-route-stat{
    padding:11px 12px;
    border-radius:13px;
    background:var(--surface-2);
  }

  .delivery-route-stat-label{
    display:block;
    margin-bottom:2px;
    font-size:.7rem;
    color:var(--muted);
  }

  .delivery-route-stat-value{
    font-size:.9rem;
    font-weight:800;
    color:var(--ink);
  }

  .delivery-address-card{
    display:flex;
    align-items:flex-start;
    gap:12px;
    margin-top:16px;
    padding:14px 16px;
    border:1px solid var(--line);
    border-radius:16px;
    background:var(--surface-2);
  }

  .delivery-address-icon{
    width:34px;
    height:34px;
    flex:0 0 34px;
    display:grid;
    place-items:center;
    border-radius:11px;
    background:#111;
    color:#fff;
  }

  .delivery-address-title{
    margin-bottom:2px;
    font-size:.75rem;
    color:var(--muted);
  }

  .delivery-address-value{
    font-size:.9rem;
    font-weight:700;
    color:var(--ink);
    word-break:break-word;
  }

  @media (max-width:767.98px){
    .delivery-route-grid{
      grid-template-columns:1fr;
    }

    .delivery-route-card{
      padding:16px;
      border-radius:16px;
    }

    .delivery-route-stats{
      gap:8px;
    }
  }
`;

/*
 * =========================================
 * TYPES
 * =========================================
 */

type Quote = {
    subtotal: number;
    deliveryFee: number;
    discount: number;
    total: number;

    promotionSavings: number;

    promotion: {
        id: number;
        code: string | null;
        title: string;
        type: string;
    } | null;
};

type SuccessOrder = {
    id: number;
    orderNumber: string;
    status: string;

    subtotal: number;
    deliveryFee: number;
    discount: number;
    total: number;
};

type CheckoutProfile = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
};

type CheckoutAddress = {
    id: number;
    label: string | null;

    city: string;
    district: string | null;

    addressLine: string;

    apartment: string | null;
    entrance: string | null;
    floor: string | null;

    instructions: string | null;

    isDefault: boolean;
};

/*
 * =========================================
 * HELPERS
 * =========================================
 */

function money(
    cents: number
) {
    return new Intl.NumberFormat(
        "en-US",
        {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }
    ).format(
        cents / 100
    );
}

/*
 * =========================================
 * CHECKOUT
 * =========================================
 */

export default function Checkout() {
    /*
     * =====================================
     * AUTH
     * =====================================
     */

    const {
        user,
        loading: authLoading,
        apiFetch,
    } = useAuth();

    /*
     * =====================================
     * CART
     * =====================================
     */

    const items =
        useCartStore(
            (state) =>
                state.items
        );

    const hasHydrated =
        useCartStore(
            (state) =>
                state.hasHydrated
        );

    const clearCart =
        useCartStore(
            (state) =>
                state.clearCart
        );

    /*
     * =====================================
     * FORM
     * =====================================
     */

    const [
        fullName,
        setFullName,
    ] = useState("");

    const [
        phone,
        setPhone,
    ] = useState("");

    const [
        email,
        setEmail,
    ] = useState("");

    const [
        note,
        setNote,
    ] = useState("");

    const [
        city,
        setCity,
    ] = useState(
        "Los Angeles"
    );

    const [
        district,
        setDistrict,
    ] = useState("");

    const [
        address,
        setAddress,
    ] = useState("");

    const [
        deliveryTime,
        setDeliveryTime,
    ] = useState(
        "As soon as possible"
    );

    /*
     * =====================================
     * PROMO
     * =====================================
     */

    const [
        promoInput,
        setPromoInput,
    ] = useState("");

    const [
        appliedPromo,
        setAppliedPromo,
    ] = useState("");

    /*
     * =====================================
     * QUOTE
     * =====================================
     */

    const [
        quote,
        setQuote,
    ] =
        useState<Quote | null>(
            null
        );

    const [
        quoteLoading,
        setQuoteLoading,
    ] = useState(false);

    /*
     * =====================================
     * ORDER
     * =====================================
     */

    const [
        orderLoading,
        setOrderLoading,
    ] = useState(false);

    const [
        successOrder,
        setSuccessOrder,
    ] =
        useState<SuccessOrder | null>(
            null
        );


    const [
        deliveryPreview,
        setDeliveryPreview,
    ] = useState<DeliveryPreview | null>(
        null
    );

    const [
        loadingDeliveryPreview,
        setLoadingDeliveryPreview,
    ] = useState(false);

    const [
        deliveryPreviewError,
        setDeliveryPreviewError,
    ] = useState("");




    async function handleCalculateDelivery() {
        try {
            setLoadingDeliveryPreview(true);
            setDeliveryPreviewError("");

            if (
                address.trim().length < 3
            ) {
                throw new Error(
                    "Enter your delivery address first."
                );
            }

            const response =
                await fetch(
                    "/api/maps/delivery-preview",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify({
                            items: items.map(
                                (item) => ({
                                    productId:
                                        Number(item.id),

                                    quantity:
                                    item.quantity,
                                })
                            ),

                            deliveryAddress: address,
                            deliveryCity: city,
                            deliveryDistrict: district,
                        }),
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    "Unable to calculate delivery route."
                );
            }

            setDeliveryPreview(
                data.preview
            );
        } catch (error) {
            setDeliveryPreview(null);

            setDeliveryPreviewError(
                error instanceof Error
                    ? error.message
                    : "Unable to calculate delivery route."
            );
        } finally {
            setLoadingDeliveryPreview(false);
        }
    }

    /*
     * =====================================
     * MESSAGE
     * =====================================
     */

    const [
        message,
        setMessage,
    ] =
        useState<{
            type:
                | "success"
                | "danger"
                | "secondary";

            text: string;
        } | null>(null);

    /*
     * =====================================
     * LOAD USER PROFILE + DEFAULT ADDRESS
     * =====================================
     */

    useEffect(() => {
        if (authLoading) {
            return;
        }

        /*
         * Guest checkout.
         */
        if (!user) {
            return;
        }

        /*
         * Important for React development
         * Strict Mode.
         */
        let ignore = false;

        async function loadUserInfo() {
            try {
                /*
                 * Load both requests together.
                 */

                const [
                    profileResponse,
                    addressesResponse,
                ] =
                    await Promise.all([
                        apiFetch(
                            "/api/auth/me"
                        ),

                        apiFetch(
                            "/api/profile/addresses"
                        ),
                    ]);

                /*
                 * =================================
                 * PROFILE
                 * =================================
                 */

                if (
                    !profileResponse.ok
                ) {
                    console.error(
                        "PROFILE REQUEST FAILED:",
                        profileResponse.status
                    );

                    return;
                }

                const profileData =
                    await profileResponse.json();

                if (ignore) {
                    return;
                }

                const profile =
                    profileData.user as CheckoutProfile;

                /*
                 * Only fill if user hasn't
                 * already manually typed something.
                 */

                setFullName(
                    (current) =>
                        current ||
                        profile.name ||
                        ""
                );

                setPhone(
                    (current) =>
                        current ||
                        profile.phone ||
                        ""
                );

                setEmail(
                    (current) =>
                        current ||
                        profile.email ||
                        ""
                );

                /*
                 * =================================
                 * ADDRESSES
                 * =================================
                 */

                if (
                    !addressesResponse.ok
                ) {
                    console.error(
                        "ADDRESSES REQUEST FAILED:",
                        addressesResponse.status
                    );

                    return;
                }

                const addressData =
                    await addressesResponse.json();

                if (ignore) {
                    return;
                }

                const addresses:
                    CheckoutAddress[] =
                    Array.isArray(
                        addressData.addresses
                    )
                        ? addressData.addresses
                        : [];

                /*
                 * Default address.
                 *
                 * If for some reason there isn't
                 * a default one, use the first one.
                 */

                const defaultAddress =
                    addresses.find(
                        (item) =>
                            item.isDefault
                    ) ??
                    addresses[0];

                /*
                 * User may not have any
                 * saved addresses yet.
                 */

                if (
                    !defaultAddress
                ) {
                    return;
                }

                /*
                 * City
                 */

                setCity(
                    defaultAddress.city ||
                    "Los Angeles"
                );

                /*
                 * District
                 */

                setDistrict(
                    (current) =>
                        current ||
                        defaultAddress
                            .district ||
                        ""
                );

                /*
                 * Build one checkout address
                 * from the Address model.
                 */

                const addressParts = [
                    defaultAddress.addressLine,

                    defaultAddress.apartment
                        ? `Apt. ${defaultAddress.apartment}`
                        : null,

                    defaultAddress.entrance
                        ? `Entrance ${defaultAddress.entrance}`
                        : null,

                    defaultAddress.floor
                        ? `Floor ${defaultAddress.floor}`
                        : null,
                ].filter(
                    (
                        value
                    ): value is string =>
                        Boolean(value)
                );

                setAddress(
                    (current) =>
                        current ||
                        addressParts.join(
                            ", "
                        )
                );

                /*
                 * Saved delivery instructions
                 * become courier note.
                 */

                setNote(
                    (current) =>
                        current ||
                        defaultAddress
                            .instructions ||
                        ""
                );
            } catch (error) {
                console.error(
                    "CHECKOUT USER INFO ERROR:",
                    error
                );
            }
        }

        loadUserInfo();

        return () => {
            ignore = true;
        };
    }, [
        authLoading,
        user,
        apiFetch,
    ]);

    /*
     * =====================================
     * SERVER QUOTE
     * =====================================
     */

    useEffect(() => {
        if (
            !hasHydrated ||
            items.length === 0
        ) {
            setQuote(null);

            return;
        }

        const controller =
            new AbortController();

        async function loadQuote() {
            try {
                setQuoteLoading(
                    true
                );

                const response =
                    await fetch(
                        "/api/checkout/quote",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",
                            },

                            signal:
                            controller.signal,

                            body:
                                JSON.stringify({
                                    items:
                                        items.map(
                                            (
                                                item
                                            ) => ({
                                                id:
                                                item.id,

                                                quantity:
                                                item.quantity,
                                            })
                                        ),

                                    promoCode:
                                        appliedPromo ||
                                        undefined,
                                }),
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    setQuote(null);

                    setMessage({
                        type: "danger",

                        text:
                            data.error ||
                            "Unable to calculate order.",
                    });

                    return;
                }

                setQuote(
                    data
                );
            } catch (error) {
                if (
                    error instanceof
                    DOMException &&
                    error.name ===
                    "AbortError"
                ) {
                    return;
                }

                console.error(
                    "QUOTE ERROR:",
                    error
                );

                setQuote(
                    null
                );
            } finally {
                setQuoteLoading(
                    false
                );
            }
        }

        loadQuote();

        return () => {
            controller.abort();
        };
    }, [
        hasHydrated,
        items,
        appliedPromo,
    ]);

    /*
     * =====================================
     * APPLY PROMO
     * =====================================
     */

    async function applyPromo() {
        const code =
            promoInput
                .trim()
                .toUpperCase();

        /*
         * Empty input removes promo.
         */

        if (!code) {
            setAppliedPromo(
                ""
            );

            setMessage({
                type: "secondary",

                text:
                    "Promo code removed.",
            });

            return;
        }

        try {
            setQuoteLoading(
                true
            );

            const response =
                await fetch(
                    "/api/checkout/quote",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify({
                                items:
                                    items.map(
                                        (
                                            item
                                        ) => ({
                                            id:
                                            item.id,

                                            quantity:
                                            item.quantity,
                                        })
                                    ),

                                promoCode:
                                code,

                                customerPhone:
                                phone,

                                customerEmail:
                                email,
                            }),
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                setMessage({
                    type: "danger",

                    text:
                        data.error ||
                        "Invalid promo code.",
                });

                return;
            }

            setAppliedPromo(
                code
            );

            setQuote(
                data
            );

            setMessage({
                type: "success",

                text:
                    data.promotion
                        ? `${data.promotion.code} applied successfully.`
                        : "Promotion applied.",
            });
        } catch (error) {
            console.error(
                "PROMO ERROR:",
                error
            );

            setMessage({
                type: "danger",

                text:
                    "Unable to apply promo code.",
            });
        } finally {
            setQuoteLoading(
                false
            );
        }
    }

    /*
     * =====================================
     * PLACE ORDER
     * =====================================
     */

    async function placeOrder() {
        setMessage(
            null
        );

        /*
         * Empty basket.
         */

        if (
            items.length === 0
        ) {
            setMessage({
                type: "danger",

                text:
                    "Your basket is empty.",
            });

            return;
        }

        /*
         * Required fields.
         */

        if (
            !fullName.trim() ||
            !phone.trim() ||
            !address.trim()
        ) {
            setMessage({
                type: "danger",

                text:
                    "Please fill in your name, phone and address.",
            });

            return;
        }

        try {
            setOrderLoading(
                true
            );

            /*
             * Build body.
             *
             * IMPORTANT:
             * userId is NOT sent from frontend.
             *
             * Backend gets userId from JWT.
             */

            const orderBody = {
                customerName:
                    fullName.trim(),

                customerPhone:
                    phone.trim(),

                customerEmail:
                    email.trim() ||
                    undefined,

                customerNote:
                    note.trim() ||
                    undefined,

                deliveryCity:
                    city.trim() ||
                    "Los Angeles",

                deliveryDistrict:
                    district.trim() ||
                    undefined,

                deliveryAddress:
                    address.trim(),

                deliveryTime,

                paymentMethod:
                    "CASH" as const,

                promoCode:
                    appliedPromo ||
                    undefined,

                items:
                    items.map(
                        (
                            item
                        ) => ({
                            id:
                            item.id,

                            quantity:
                            item.quantity,
                        })
                    ),
            };

            const requestOptions:
                RequestInit = {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",
                },

                body:
                    JSON.stringify(
                        orderBody
                    ),
            };

            /*
             * Logged-in customer:
             *
             * apiFetch adds:
             *
             * Authorization:
             * Bearer ACCESS_TOKEN
             *
             * Guest:
             * normal fetch.
             */

            const response =
                user
                    ? await apiFetch(
                        "/api/orders",
                        requestOptions
                    )
                    : await fetch(
                        "/api/orders",
                        requestOptions
                    );

            const data =
                await response.json();

            if (!response.ok) {
                setMessage({
                    type: "danger",

                    text:
                        data.error ||
                        data.message ||
                        "Could not place your order.",
                });

                return;
            }

            /*
             * Order success.
             */

            setSuccessOrder(
                data.order
            );

            /*
             * Empty cart.
             */

            clearCart();

            /*
             * Reset promo.
             */

            setAppliedPromo(
                ""
            );

            setPromoInput(
                ""
            );
        } catch (error) {
            console.error(
                "PLACE ORDER ERROR:",
                error
            );

            setMessage({
                type: "danger",

                text:
                    "Something went wrong while placing your order.",
            });
        } finally {
            setOrderLoading(
                false
            );
        }
    }

    /*
     * =====================================
     * SUCCESS PAGE
     * =====================================
     */

    if (successOrder) {
        return (
            <main>

                <style>
                    {pageStyles}
                </style>

                <section className="section">

                    <div className="container">

                        <div
                            className="panel mx-auto"
                            style={{
                                maxWidth:
                                    "700px",
                            }}
                        >

                            <div className="panel-body text-center py-5">

                                <div
                                    style={{
                                        fontSize:
                                            "3rem",
                                    }}
                                >
                                    ✓
                                </div>

                                <span className="eyebrow is-green">
                  Order received
                </span>

                                <h1 className="display-md mt-2">
                                    Thanks for your order
                                </h1>

                                <p className="muted">
                                    Your order reference is
                                </p>

                                <h3>
                                    {
                                        successOrder
                                            .orderNumber
                                    }
                                </h3>

                                <div className="summary-row total mt-4">

                  <span>
                    Total
                  </span>

                                    <span className="money">
                    {money(
                        successOrder
                            .total
                    )}

                  </span>

                                </div>

                                <div className="d-flex justify-content-center flex-wrap gap-2 mt-4">

                                    <Link
                                        href="/products"
                                        className="btn btn-brand"
                                    >
                                        Continue browsing
                                    </Link>

                                    {user ? (
                                        <Link
                                            href="/profile/orders"
                                            className="btn btn-line"
                                        >
                                            My orders
                                        </Link>
                                    ) : (
                                        <Link
                                            href="/login"
                                            className="btn btn-line"
                                        >
                                            Sign in
                                        </Link>
                                    )}

                                </div>

                            </div>

                        </div>

                    </div>

                </section>

            </main>
        );
    }

    /*
     * =====================================
     * CART HYDRATION
     * =====================================
     */

    if (!hasHydrated) {
        return (
            <main>

                <section className="section">

                    <div className="container">

                        <div className="empty-state">
                            Loading checkout...
                        </div>

                    </div>

                </section>

            </main>
        );
    }

    /*
     * =====================================
     * EMPTY BASKET
     * =====================================
     */

    if (
        items.length === 0
    ) {
        return (
            <main>

                <section className="section">

                    <div className="container">

                        <div className="empty-state">

                            <div className="ico">
                                🛍️
                            </div>

                            <h2>
                                Your basket is empty
                            </h2>

                            <p>
                                Add a dish before
                                checking out.
                            </p>

                            <Link
                                href="/products"
                                className="btn btn-brand"
                            >
                                Browse menu
                            </Link>

                        </div>

                    </div>

                </section>

            </main>
        );
    }

    /*
     * =====================================
     * MAIN CHECKOUT
     * =====================================
     */

    return (
        <main>

            <style>
                {pageStyles}
            </style>

            {/* =================================
          PAGE HEADER
      ================================= */}

            <section className="page-head">

                <div className="container">

                    <nav
                        className="breadcrumbs"
                        aria-label="Breadcrumb"
                    >

                        <Link href="/">
                            Home
                        </Link>

                        <span>
              /
            </span>

                        <Link href="/products">
                            Menu
                        </Link>

                        <span>
              /
            </span>

                        <span>
              Checkout
            </span>

                    </nav>

                    <h1 className="display-lg">
                        Checkout
                    </h1>

                    <p className="lead">
                        Two minutes and
                        you&apos;re done.
                        Nothing is charged
                        until the kitchen
                        accepts your order.
                    </p>

                    <div className="stepper mt-4">

            <span className="st done">
              <b>
                ✓
              </b>
              Basket
            </span>

                        <span className="sep" />

                        <span className="st now">
              <b>
                2
              </b>
              Delivery & payment
            </span>

                        <span className="sep" />

                        <span className="st">
              <b>
                3
              </b>
              Confirmation
            </span>

                    </div>

                </div>

            </section>

            {/* =================================
          CHECKOUT
      ================================= */}

            <section className="section">

                <div className="container">

                    <div className="row g-4 g-xl-5">

                        {/* =============================
                LEFT
            ============================= */}

                        <div className="col-12 col-lg-7">

                            {/* ===========================
                  CONTACT DETAILS
              =========================== */}

                            <div className="panel mb-4">

                                <div className="panel-head d-flex justify-content-between align-items-center gap-2">

                  <span>
                    Contact details
                  </span>

                                    {user && (
                                        <span className="account-badge">
                      From your account
                    </span>
                                    )}

                                </div>

                                <div className="panel-body">

                                    {user && (
                                        <div className="account-info">

                                            <p className="muted">
                                                Your account details
                                                were filled automatically.
                                                You can change them for
                                                this order.
                                            </p>

                                            <Link
                                                href="/profile/edit"
                                                className="fw-bold"
                                            >
                                                Edit profile
                                            </Link>

                                        </div>
                                    )}

                                    <div className="row g-3">

                                        {/* NAME */}

                                        <div className="col-12 col-md-6">

                                            <label
                                                className="form-label"
                                                htmlFor="fullName"
                                            >
                                                Full name *
                                            </label>

                                            <input
                                                id="fullName"
                                                className="form-control"
                                                placeholder="e.g. Daniel Hambardzumyan"
                                                autoComplete="name"
                                                value={
                                                    fullName
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    setFullName(
                                                        event.target.value
                                                    )
                                                }
                                            />

                                        </div>

                                        {/* PHONE */}

                                        <div className="col-12 col-md-6">

                                            <label
                                                className="form-label"
                                                htmlFor="phone"
                                            >
                                                Phone *
                                            </label>

                                            <input
                                                id="phone"
                                                className="form-control"
                                                type="tel"
                                                autoComplete="tel"
                                                placeholder="(213) 555-0123"
                                                value={
                                                    phone
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    setPhone(
                                                        event.target.value
                                                    )
                                                }
                                            />

                                        </div>

                                        {/* EMAIL */}

                                        <div className="col-12">

                                            <label
                                                className="form-label"
                                                htmlFor="email"
                                            >
                                                Email{" "}

                                                <span className="muted">
                          (optional)
                        </span>
                                            </label>

                                            <input
                                                id="email"
                                                className="form-control"
                                                type="email"
                                                autoComplete="email"
                                                placeholder="you@example.com"
                                                value={
                                                    email
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    setEmail(
                                                        event.target.value
                                                    )
                                                }
                                            />

                                        </div>

                                        {/* NOTE */}

                                        <div className="col-12">

                                            <label
                                                className="form-label"
                                                htmlFor="note"
                                            >
                                                Note for the courier{" "}

                                                <span className="muted">
                          (optional)
                        </span>
                                            </label>

                                            <textarea
                                                id="note"
                                                className="form-control"
                                                placeholder="Entrance code, floor, where to leave it…"
                                                value={
                                                    note
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    setNote(
                                                        event.target.value
                                                    )
                                                }
                                            />

                                        </div>

                                    </div>

                                </div>

                            </div>

                            {/* ===========================
                  DELIVERY DETAILS
              =========================== */}

                            <div className="panel mb-4">

                                <div className="panel-head d-flex justify-content-between align-items-center gap-2">

                  <span>
                    Delivery details
                  </span>

                                    {user && (
                                        <span className="account-badge">
                      Saved address
                    </span>
                                    )}

                                </div>

                                <div className="panel-body">

                                    <div className="row g-3">

                                        {/* CITY */}

                                        <div className="col-12 col-md-6">

                                            <label
                                                className="form-label"
                                                htmlFor="city"
                                            >
                                                City
                                            </label>

                                            <select
                                                id="city"
                                                className="form-select"
                                                value={
                                                    city
                                                }
                                                onChange={(
                                                    event
                                                ) => {
                                                    setCity(
                                                        event.target.value
                                                    );
                                                    setDeliveryPreview(
                                                        null
                                                    );
                                                    setDeliveryPreviewError(
                                                        ""
                                                    );
                                                }}
                                            >

                                                <option value="Los Angeles">
                                                    Los Angeles
                                                </option>

                                            </select>

                                        </div>

                                        {/* DISTRICT */}

                                        <div className="col-12 col-md-6">

                                            <label
                                                className="form-label"
                                                htmlFor="district"
                                            >
                                                Neighborhood
                                            </label>

                                            <input
                                                id="district"
                                                className="form-control"
                                                placeholder="e.g. Hollywood"
                                                value={
                                                    district
                                                }
                                                onChange={(
                                                    event
                                                ) => {
                                                    setDistrict(
                                                        event.target.value
                                                    );
                                                    setDeliveryPreview(
                                                        null
                                                    );
                                                    setDeliveryPreviewError(
                                                        ""
                                                    );
                                                }}
                                            />

                                        </div>

                                        {/* ADDRESS */}

                                        <div className="col-12">

                                            <label
                                                className="form-label"
                                                htmlFor="address"
                                            >
                                                Street, building,
                                                apartment *
                                            </label>

                                            <input
                                                id="address"
                                                className="form-control"
                                                autoComplete="street-address"
                                                placeholder="e.g. 6801 Hollywood Blvd, Apt. 18"
                                                value={
                                                    address
                                                }
                                                onChange={(
                                                    event
                                                ) => {
                                                    setAddress(
                                                        event.target.value
                                                    );
                                                    setDeliveryPreview(
                                                        null
                                                    );
                                                    setDeliveryPreviewError(
                                                        ""
                                                    );
                                                }}
                                            />

                                        </div>

                                        {/* DELIVERY TIME */}

                                        <div className="col-12 col-md-6">

                                            <label
                                                className="form-label"
                                                htmlFor="deliveryTime"
                                            >
                                                Delivery time
                                            </label>

                                            <select
                                                id="deliveryTime"
                                                className="form-select"
                                                value={
                                                    deliveryTime
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    setDeliveryTime(
                                                        event.target.value
                                                    )
                                                }
                                            >

                                                <option>
                                                    As soon as possible
                                                </option>

                                                <option>
                                                    Within 1 hour
                                                </option>

                                                <option>
                                                    This evening
                                                </option>

                                            </select>

                                        </div>

                                        {/* DELIVERY FEE */}

                                        <div className="col-12 col-md-6">

                                            <label className="form-label">
                                                Delivery fee
                                            </label>

                                            <input
                                                className="form-control"
                                                disabled
                                                value={
                                                    quote
                                                        ? `${money(
                                                            quote.deliveryFee
                                                        )}`
                                                        : "Calculating..."
                                                }
                                            />

                                        </div>

                                    </div>

                                </div>

                            </div>

                            {/* ===========================
                  DELIVERY ROUTE
              =========================== */}

                            <div className="panel mb-4">

                                <div className="panel-head d-flex justify-content-between align-items-center gap-3">

                                    <span>
                                        Delivery route
                                    </span>

                                    <button
                                        type="button"
                                        className="btn btn-line btn-sm"
                                        onClick={
                                            handleCalculateDelivery
                                        }
                                        disabled={
                                            loadingDeliveryPreview
                                        }
                                    >
                                        {loadingDeliveryPreview
                                            ? "Calculating..."
                                            : deliveryPreview
                                                ? "Recalculate"
                                                : "Show route"}
                                    </button>

                                </div>

                                <div className="panel-body">

                                    <p className="muted mb-3">
                                        Preview where your order is coming
                                        from, the driving distance and the
                                        estimated delivery time before you
                                        place the order.
                                    </p>

                                    {deliveryPreviewError && (
                                        <div
                                            className="alert alert-danger mb-3"
                                            role="alert"
                                        >
                                            {
                                                deliveryPreviewError
                                            }
                                        </div>
                                    )}

                                    {!deliveryPreview &&
                                        !deliveryPreviewError && (
                                            <div
                                                className="border rounded-4 p-4 text-center"
                                                style={{
                                                    background:
                                                        "var(--surface-2)",
                                                }}
                                            >
                                                <div
                                                    className="mb-2"
                                                    style={{
                                                        fontSize:
                                                            "1.8rem",
                                                    }}
                                                >
                                                    🗺️
                                                </div>

                                                <div className="fw-semibold">
                                                    Your delivery route will
                                                    appear here
                                                </div>

                                                <div className="muted mt-1">
                                                    Enter your address, then
                                                    select Show route.
                                                </div>
                                            </div>
                                        )}

                                    {deliveryPreview && (
                                        <>
                                            <DeliveryMap
                                                preview={
                                                    deliveryPreview
                                                }
                                            />

                                            <div className="delivery-route-grid">
                                                {deliveryPreview.restaurants.map(
                                                    (restaurant) => (
                                                        <div
                                                            key={
                                                                restaurant.restaurantId
                                                            }
                                                            className="delivery-route-card"
                                                        >
                                                            <div className="delivery-route-head">

                                                                <div className="delivery-route-restaurant">

                                                                    <div className="delivery-route-icon">
                                                                        🍽️
                                                                    </div>

                                                                    <div>
                                                                        <p className="delivery-route-name">
                                                                            {
                                                                                restaurant.restaurantName
                                                                            }
                                                                        </p>

                                                                        <div className="delivery-route-label">
                                                                            Restaurant
                                                                        </div>
                                                                    </div>

                                                                </div>

                                                                <div className="delivery-route-eta">
                                                                    {
                                                                        restaurant.estimatedDeliveryMinutes
                                                                    }{" "}
                                                                    min ETA
                                                                </div>

                                                            </div>

                                                            <div className="delivery-route-stats">

                                                                <div className="delivery-route-stat">
                        <span className="delivery-route-stat-label">
                            Distance
                        </span>

                                                                    <span className="delivery-route-stat-value">
                            {
                                restaurant.distanceMiles
                            }{" "}
                                                                        mi
                        </span>
                                                                </div>

                                                                <div className="delivery-route-stat">
                        <span className="delivery-route-stat-label">
                            Drive time
                        </span>

                                                                    <span className="delivery-route-stat-value">
                            {
                                restaurant.driveMinutes
                            }{" "}
                                                                        min
                        </span>
                                                                </div>

                                                            </div>

                                                        </div>
                                                    )
                                                )}
                                            </div>

                                            <div className="delivery-address-card">

                                                <div className="delivery-address-icon">
                                                    ⌂
                                                </div>

                                                <div>
                                                    <div className="delivery-address-title">
                                                        Delivering to
                                                    </div>

                                                    <div className="delivery-address-value">
                                                        {
                                                            deliveryPreview.delivery.address
                                                        }
                                                    </div>
                                                </div>

                                            </div>
                                        </>
                                    )}

                                </div>

                            </div>

                            {/* ===========================
                  PAYMENT
              =========================== */}

                            <div className="panel">

                                <div className="panel-head">
                                    Payment method
                                </div>

                                <div className="panel-body">

                                    <div className="row g-3">

                                        <div className="col-12 col-md-6">

                                            <label className="pay-option">

                                                <input
                                                    className="form-check-input m-0"
                                                    type="radio"
                                                    checked
                                                    readOnly
                                                />

                                                <span>

                          <strong>
                            Cash
                          </strong>

                          <span className="d-block muted">
                            Pay the courier
                            on arrival
                          </span>

                        </span>

                                            </label>

                                        </div>

                                        <div className="col-12 col-md-6">

                                            <label className="pay-option is-disabled">

                                                <input
                                                    className="form-check-input m-0"
                                                    type="radio"
                                                    disabled
                                                />

                                                <span>

                          <strong>
                            Card
                          </strong>

                          <span className="d-block muted">
                            Stripe will be
                            connected next
                          </span>

                        </span>

                                            </label>

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>

                        {/* =============================
                RIGHT
            ============================= */}

                        <div className="col-12 col-lg-5">

                            <div className="summary-sticky">

                                <div className="panel">

                                    <div className="panel-head">
                                        Order summary
                                    </div>

                                    <div className="panel-body">

                                        {/* MESSAGE */}

                                        {message && (
                                            <div
                                                className={`alert alert-${message.type} mb-3`}
                                            >
                                                {
                                                    message.text
                                                }
                                            </div>
                                        )}

                                        {/* ITEMS */}

                                        <div className="d-grid gap-2 mb-4">

                                            {items.map(
                                                (
                                                    item
                                                ) => (
                                                    <div
                                                        key={
                                                            item.id
                                                        }
                                                        className="cart-row d-flex justify-content-between align-items-start gap-2"
                                                    >

                                                        <div>

                                                            <p className="t">
                                                                {
                                                                    item.name
                                                                }
                                                            </p>

                                                            <div className="muted">

                                <span className="qty-pill">
                                  ×{" "}
                                    {
                                        item.quantity
                                    }
                                </span>

                                                                <span className="ms-2">
                                  {money(
                                      item.price
                                  )}
                                                                    each
                                </span>

                                                            </div>

                                                        </div>

                                                        <div className="money">
                                                            {money(
                                                                item.price *
                                                                item.quantity
                                                            )}

                                                        </div>

                                                    </div>
                                                )
                                            )}

                                        </div>

                                        {/* SUBTOTAL */}

                                        <div className="summary-row">

                      <span>
                        Subtotal
                      </span>

                                            <span className="money">

                        {quoteLoading &&
                        !quote
                            ? "..."
                            : `${money(
                                quote
                                    ?.subtotal ||
                                0
                            )}`}

                      </span>

                                        </div>

                                        {/* DELIVERY */}

                                        <div className="summary-row">

                      <span>
                        Delivery
                      </span>

                                            <span className="money">

                        {quote
                            ? `${money(
                                quote.deliveryFee
                            )}`
                            : "..."}

                      </span>

                                        </div>

                                        {/* DISCOUNT */}

                                        <div className="summary-row">

                      <span>
                        Discount
                      </span>

                                            <span className="money ok">
                        -
                                                {money(
                                                    quote
                                                        ?.discount ||
                                                    0
                                                )}

                      </span>

                                        </div>

                                        {/* TOTAL */}

                                        <div className="summary-row total">

                      <span>
                        Total
                      </span>

                                            <span className="money danger">

                        {quote
                            ? `${money(
                                quote.total
                            )}`
                            : "..."}

                      </span>

                                        </div>

                                        {/* =====================
                        PROMO
                    ===================== */}

                                        <div className="mt-4">

                                            <label className="form-label">
                                                Promo code
                                            </label>

                                            <div className="d-flex gap-2">

                                                <input
                                                    className="form-control"
                                                    placeholder="e.g. SAVE10"
                                                    value={
                                                        promoInput
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        setPromoInput(
                                                            event.target.value
                                                        )
                                                    }
                                                    onKeyDown={(
                                                        event
                                                    ) => {
                                                        if (
                                                            event.key ===
                                                            "Enter"
                                                        ) {
                                                            event.preventDefault();

                                                            applyPromo();
                                                        }
                                                    }}
                                                />

                                                <button
                                                    className="btn btn-line"
                                                    type="button"
                                                    disabled={
                                                        quoteLoading
                                                    }
                                                    onClick={
                                                        applyPromo
                                                    }
                                                >
                                                    Apply
                                                </button>

                                            </div>

                                            <p className="muted mt-2 mb-0">
                                                Try{" "}
                                                <b>
                                                    SAVE10
                                                </b>{" "}
                                                or{" "}
                                                <b>
                                                    FREEDEL
                                                </b>
                                                .
                                            </p>

                                        </div>

                                        {/* =====================
                        PLACE ORDER
                    ===================== */}
                                        <button
                                            type="button"
                                            className="btn btn-brand w-100 mt-4"
                                            disabled={orderLoading}
                                            onClick={placeOrder}
                                        >
                                            {orderLoading
                                                ? "Placing order..."
                                                : quote
                                                    ? `Place order · ${money(quote.total)}`
                                                    : "Place order"}
                                        </button>

                                        <p className="muted text-center mt-3 mb-0">
                                            Prices and product
                                            availability are checked
                                            again on the server before
                                            the order is created.
                                        </p>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </section>

        </main>
    );
}


