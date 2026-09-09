import Link from "next/link";

function TopLine() {
  return (
    <div className="topline">
      <div className="container d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div className="d-flex align-items-center gap-2 gap-md-3 flex-wrap">
          <span>Free delivery on your first order</span>

          <span className="dot d-none d-sm-inline">•</span>

          <span className="d-none d-sm-inline">
            Open daily 10:00 – 23:00
          </span>
        </div>

        <div className="d-flex align-items-center gap-2 gap-md-3">
          <a href="tel:+37410000000">
            +374 10 00 00 00
          </a>

          <span className="dot">•</span>

          <Link href="/profile">
            Track order
          </Link>
        </div>
      </div>
    </div>
  );
}

export default TopLine;