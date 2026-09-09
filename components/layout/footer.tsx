import Link from "next/link";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="row g-4">

          {/* Brand */}
          <div className="col-12 col-lg-4">
            <Link className="brand" href="/">
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

            <p style={{ maxWidth: "34ch" }}>
              Food delivery from the kitchens people in your city actually
              recommend. Fast, tracked and fairly priced.
            </p>

            {/* Socials */}
            <div className="socials mt-3">
              <a href="#" aria-label="Instagram">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                >
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle
                    cx="17.2"
                    cy="6.8"
                    r="1.1"
                    fill="currentColor"
                    stroke="none"
                  />
                </svg>
              </a>

              <a href="#" aria-label="Facebook">
                <svg viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M14 8h2.5V4.5H14A4 4 0 0 0 10 8.5V11H8v3.5h2V21h3.5v-6.5H16l.5-3.5h-3V8.8c0-.5.3-.8.8-.8z"
                  />
                </svg>
              </a>

              <a href="#" aria-label="X">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                >
                  <path d="M5 5l14 14M19 5 5 19" />
                </svg>
              </a>

              <a href="#" aria-label="YouTube">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                >
                  <rect x="2.5" y="6" width="19" height="12" rx="4" />
                  <path
                    d="m10.5 9.5 5 2.5-5 2.5z"
                    fill="currentColor"
                    stroke="none"
                  />
                </svg>
              </a>
            </div>
          </div>

          {/* Explore */}
          <div className="col-6 col-lg-2">
            <h6>Explore</h6>

            <ul>
              <li>
                <Link href="/">Home</Link>
              </li>

              <li>
                <Link href="/restaurants">Restaurants</Link>
              </li>

              <li>
                <Link href="/products">Menu</Link>
              </li>

              <li>
                <Link href="/promotions">Offers</Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div className="col-6 col-lg-2">
            <h6>Account</h6>

            <ul>
              <li>
                <Link href="/login">Sign in</Link>
              </li>

              <li>
                <Link href="/register">Create account</Link>
              </li>

              <li>
                <Link href="/profile">My orders</Link>
              </li>

              <li>
                <Link href="/checkout">Basket</Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="col-6 col-lg-2">
            <h6>Company</h6>

            <ul>
              <li>
                <a href="#how">How it works</a>
              </li>

              <li>
                <a href="#">Partner with us</a>
              </li>

              <li>
                <a href="#">Become a courier</a>
              </li>

              <li>
                <a href="#">Careers</a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="col-6 col-lg-2">
            <h6>Contact</h6>

            <ul>
              <li>
                <a href="tel:+37410000000">
                  +374 10 00 00 00
                </a>
              </li>

              <li>
                <a href="mailto:hello@foodly.am">
                  hello@foodly.am
                </a>
              </li>

              <li>Yerevan, Armenia</li>

              <li>Daily 10:00 – 23:00</li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="footer-bottom">
          <span>
            © {currentYear} Foodly. All rights reserved.
          </span>

          <span className="d-flex gap-3">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Cookies</a>
          </span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;