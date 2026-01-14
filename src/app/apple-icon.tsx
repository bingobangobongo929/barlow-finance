import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FAFAF8',
          borderRadius: 32,
        }}
      >
        <svg
          width="140"
          height="140"
          viewBox="0 0 32 32"
          fill="none"
        >
          {/* House roof */}
          <path
            d="M16 4L4 14h4v12h16V14h4L16 4z"
            fill="#B45309"
          />
          {/* Window/door detail */}
          <rect x="13" y="18" width="6" height="8" rx="1" fill="#FAFAF8" />
          {/* Chimney accent */}
          <rect x="21" y="8" width="3" height="6" rx="0.5" fill="#92400E" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
