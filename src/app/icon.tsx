import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: 'linear-gradient(135deg, #0D9488 0%, #059669 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 6,
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Stylized B letter */}
          <path
            d="M6 3h9c3.3 0 6 2.4 6 5.3 0 1.8-.9 3.3-2.4 4.2 2 1 3.4 3 3.4 5.1 0 3.3-3 6-6.7 6H6V3z
            M10 7v4.7h4.7c1.5 0 2.7-1 2.7-2.35s-1.2-2.35-2.7-2.35H10z
            M10 14.3V19h5.3c1.9 0 3.4-1 3.4-2.35s-1.5-2.35-3.4-2.35H10z"
            fill="white"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
