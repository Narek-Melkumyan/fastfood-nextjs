"use client";

import dynamic from "next/dynamic";

import type {
    DeliveryPreview,
} from "@/lib/maps";

const DeliveryMapClient =
    dynamic(
        () =>
            import(
                "@/components/checkout/DeliveryMapClient"
                ),
        {
            ssr: false,

            loading: () => (
                <>
                    <style>{`
                      .delivery-map-loading {
                        height: 440px;
                        overflow: hidden;
                        border: 1px solid var(--line);
                        border-radius: 20px;
                        background: var(--surface-2, #f6f6f6);
                      }

                      @media (max-width: 767.98px) {
                        .delivery-map-loading {
                          height: 320px;
                          border-radius: 16px;
                        }
                      }
                    `}</style>

                    <div className="delivery-map-loading d-flex align-items-center justify-content-center">
                        <div className="text-center">
                            <div
                                className="spinner-border mb-2"
                                role="status"
                                aria-label="Loading map"
                            />

                            <div className="muted">
                                Loading map...
                            </div>
                        </div>
                    </div>
                </>
            ),
        }
    );

type Props = {
    preview: DeliveryPreview;
};

export default function DeliveryMap({
                                        preview,
                                    }: Props) {
    return (
        <DeliveryMapClient
            preview={preview}
        />
    );
}