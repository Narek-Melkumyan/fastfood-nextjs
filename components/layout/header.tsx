"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import { useCartStore } from "@/store/cartStore";

/*
 * =========================================
 * THEME
 * =========================================
 */

function subscribeToTheme(
    onChange: () => void
) {
  window.addEventListener(
      "storage",
      onChange
  );

  window.addEventListener(
      "foodly-storage",
      onChange
  );

  return () => {
    window.removeEventListener(
        "storage",
        onChange
    );

    window.removeEventListener(
        "foodly-storage",
        onChange
    );
  };
}

function getDarkMode() {
  return (
      localStorage.getItem(
          "theme"
      ) === "dark"
  );
}

/*
 * =========================================
 * HEADER
 * =========================================
 */

function Header() {
    const {
        user,
        loading: authLoading,
    } = useAuth();

  const pathname =
      usePathname();

  const [
    menuOpen,
    setMenuOpen,
  ] = useState(false);

  /*
   * =========================================
   * ZUSTAND CART
   * =========================================
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

  const cartCount =
      hasHydrated
          ? items.reduce(
              (
                  total,
                  item
              ) =>
                  total +
                  item.quantity,
              0
          )
          : 0;

  /*
   * =========================================
   * THEME
   * =========================================
   */

  const darkMode =
      useSyncExternalStore(
          subscribeToTheme,
          getDarkMode,
          () => false
      );

  useEffect(() => {
    document.documentElement.dataset.theme =
        darkMode
            ? "dark"
            : "light";
  }, [darkMode]);

  const toggleTheme =
      () => {
        localStorage.setItem(
            "theme",
            darkMode
                ? "light"
                : "dark"
        );

        window.dispatchEvent(
            new Event(
                "foodly-storage"
            )
        );
      };

  /*
   * =========================================
   * MOBILE MENU
   * =========================================
   */

  const toggleMenu =
      () => {
        setMenuOpen(
            (previous) =>
                !previous
        );
      };

  const closeMenu =
      () => {
        setMenuOpen(false);
      };

  /*
   * =========================================
   * ACTIVE ROUTES
   * =========================================
   */

  const isActive = (
      route: string
  ) => {
    if (route === "/") {
      return (
          pathname === "/"
      );
    }

    return pathname.startsWith(
        route
    );
  };

  const isRestaurantsActive =
      pathname ===
      "/restaurants" ||
      pathname.startsWith(
          "/restaurants/"
      );

  const isProductsActive =
      pathname ===
      "/products" ||
      pathname.startsWith(
          "/products/"
      );

  return (
      <header className="site-header">
        <div className="container">
          <div className="nav-inner">
            {/* =================================
              LOGO
          ================================= */}

            <Link
                className="brand"
                href="/"
            >
            <span className="brand-mark">
              <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
              >
                <path d="M7 3v7a2 2 0 0 0 2 2 2 2 0 0 0 2-2V3" />

                <path d="M9 12v9" />

                <path d="M16 3c-1.6 1-2.2 2.6-2.2 4.6S14.4 11 16 12v9" />
              </svg>
            </span>

              Foodly
            </Link>

            {/* =================================
              DESKTOP NAVIGATION
          ================================= */}

            <ul className="nav-links ms-3">
              <li>
                <Link
                    className={
                      pathname ===
                      "/"
                          ? "active"
                          : ""
                    }
                    href="/"
                >
                  Home
                </Link>
              </li>

              <li>
                <Link
                    className={
                      isRestaurantsActive
                          ? "active"
                          : ""
                    }
                    href="/restaurants"
                >
                  Restaurants
                </Link>
              </li>

              <li>
                <Link
                    className={
                      isProductsActive
                          ? "active"
                          : ""
                    }
                    href="/products"
                >
                  Menu
                </Link>
              </li>

              <li>
                <Link
                    className={
                      isActive(
                          "/promotions"
                      )
                          ? "active"
                          : ""
                    }
                    href="/promotions"
                >
                  Offers
                </Link>
              </li>

              <li>
                <Link href="/#how">
                  How it works
                </Link>
              </li>
            </ul>

            {/* =================================
              ACTIONS
          ================================= */}

            <div className="nav-actions">
              {/* THEME */}

              <button
                  className="icon-btn"
                  type="button"
                  onClick={
                    toggleTheme
                  }
                  aria-label="Switch theme"
              >
                {!darkMode ? (
                    <svg
                        className="icon-sun"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                    >
                      <circle
                          cx="12"
                          cy="12"
                          r="4"
                      />

                      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4" />
                    </svg>
                ) : (
                    <svg
                        className="icon-moon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
                    </svg>
                )}
              </button>

              {/* =================================
                CART
            ================================= */}

              <Link
                  href="/checkout"
                  className="icon-btn cart-btn"
                  aria-label={`Basket with ${cartCount} items`}
              >
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      width:
                          "20px",
                      height:
                          "20px",
                    }}
                >
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />

                  <path d="M3 6h18" />

                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>

                {hasHydrated &&
                    cartCount >
                    0 && (
                        <span className="cart-count">
                    {
                      cartCount
                    }
                  </span>
                    )}
              </Link>

              {/* SIGN IN */}

                {!authLoading && (
                    user ? (
                        <Link
                            className="btn btn-line desktop-only"
                            href="/profile"
                        >
                            My profile
                        </Link>
                    ) : (
                        <Link
                            className="btn btn-line desktop-only"
                            href="/login"
                        >
                            Sign in
                        </Link>
                    )
                )}

              {/* ORDER */}

              <Link
                  className="btn btn-brand desktop-only"
                  href="/products"
              >
                Order now
              </Link>

              {/* MOBILE BUTTON */}

              <button
                  className="icon-btn nav-toggle"
                  type="button"
                  onClick={
                    toggleMenu
                  }
                  aria-expanded={
                    menuOpen
                  }
                  aria-label={
                    menuOpen
                        ? "Close menu"
                        : "Open menu"
                  }
              >
                {menuOpen ? (
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        strokeLinecap="round"
                    >
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                ) : (
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        strokeLinecap="round"
                    >
                      <path d="M4 7h16M4 12h16M4 17h16" />
                    </svg>
                )}
              </button>
            </div>
          </div>

          {/* =================================
            MOBILE DRAWER
        ================================= */}

          <div
              className={`nav-drawer ${
                  menuOpen
                      ? "open"
                      : ""
              }`}
              id="navDrawer"
          >
            <ul className="nav-links">
              <li>
                <Link
                    className={
                      pathname ===
                      "/"
                          ? "active"
                          : ""
                    }
                    href="/"
                    onClick={
                      closeMenu
                    }
                >
                  Home
                </Link>
              </li>

              <li>
                <Link
                    className={
                      isRestaurantsActive
                          ? "active"
                          : ""
                    }
                    href="/restaurants"
                    onClick={
                      closeMenu
                    }
                >
                  Restaurants
                </Link>
              </li>

              <li>
                <Link
                    className={
                      isProductsActive
                          ? "active"
                          : ""
                    }
                    href="/products"
                    onClick={
                      closeMenu
                    }
                >
                  Menu
                </Link>
              </li>

              <li>
                <Link
                    className={
                      isActive(
                          "/promotions"
                      )
                          ? "active"
                          : ""
                    }
                    href="/promotions"
                    onClick={
                      closeMenu
                    }
                >
                  Offers
                </Link>
              </li>

              <li>
                <Link
                    href="/#how"
                    onClick={
                      closeMenu
                    }
                >
                  How it works
                </Link>
              </li>
            </ul>

            {/* PROFILE REMOVED */}

            <div className="drawer-actions">
                {!authLoading && (
                    user ? (
                        <Link
                            className="btn btn-line"
                            href="/profile"
                            onClick={closeMenu}
                        >
                            My profile
                        </Link>
                    ) : (
                        <Link
                            className="btn btn-line"
                            href="/login"
                            onClick={closeMenu}
                        >
                            Sign in
                        </Link>
                    )
                )}

              <Link
                  className="btn btn-brand"
                  href="/products"
                  onClick={
                    closeMenu
                  }
              >
                Order now
              </Link>
            </div>
          </div>
        </div>
      </header>
  );
}

export default Header;

