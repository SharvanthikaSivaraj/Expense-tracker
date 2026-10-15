const PATHS = {
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  list: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  chart: <path d="M5 20V11M12 20V4M19 20v-6M3 20h18" />,
  sliders: (
    <>
      <path d="M4 7h9M19 7h1M4 12h3M13 12h7M4 17h11M21 17h-1" />
      <circle cx="16" cy="7" r="2.5" />
      <circle cx="10" cy="12" r="2.5" />
      <circle cx="18" cy="17" r="2.5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  edit: <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />,
  trash: <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />,
  arrowUp: <path d="M7 17 17 7M8 7h9v9" />,
  arrowDown: <path d="M7 7l10 10M17 8v9H8" />,
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
    </>
  ),
  calendar: <path d="M4 6h16v14H4zM4 10h16M8 3v4M16 3v4" />,
  trend: <path d="M3 17l6-6 4 4 8-8M15 7h6v6" />,
  logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
  eye: (
    <>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  chevL: <path d="M15 6l-6 6 6 6" />,
  chevR: <path d="M9 6l6 6-6 6" />,
  food: <path d="M6 3v8M3 3v5a3 3 0 0 0 6 0V3M6 11v10M17 21V3c-2.5 1.5-4 4.5-4 8h4" />,
  bus: (
    <>
      <path d="M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM3 11h18M7 18v2M17 18v2" />
      <path d="M7.5 15h.01M16.5 15h.01" />
    </>
  ),
  bag: <path d="M6 7h12l1 14H5zM9 7a3 3 0 0 1 6 0" />,
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
  heart: <path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z" />,
  film: <path d="M4 4h16v16H4zM8 4v16M16 4v16M4 9h4M4 15h4M16 9h4M16 15h4" />,
  dots: <path d="M5 12h.01M12 12h.01M19 12h.01" strokeWidth="3.4" />,
  briefcase: <path d="M3 8h18v12H3zM8 8V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3M3 13h18" />,
  laptop: <path d="M4 5h16v11H4zM2 20h20" />,
  gift: <path d="M3 11h18v10H3zM2 7h20v4H2zM12 7v14M12 7c-1-3-5-3-5 0 0 1.5 3 0 5 0zM12 7c1-3 5-3 5 0 0 1.5-3 0-5 0z" />,
  cash: (
    <>
      <path d="M3 7h18v10H3zM6 12h.01M18 12h.01" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  card: <path d="M3 6h18v12H3zM3 10h18M7 15h4" />,
  phone: <path d="M8 2h8a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM11 19h2" />,
  bank: <path d="M3 10 12 4l9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18" />,
  mail: <path d="M3 6h18v12H3zM3 7l9 6.5L21 7" />,
  lock: <path d="M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3" />,
  user: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0" />,
  check: <path d="M5 13l4 4L19 7" />,
  alert: <path d="M12 9v4M12 17h.01M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  wallet: <path d="M3 7h15a3 3 0 0 1 3 3v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 7l12-3v3M16 14h2" />,
  contactless: <path d="M8.5 8.5a5 5 0 0 1 0 7M12 6a8.5 8.5 0 0 1 0 12M15.5 3.5a12 12 0 0 1 0 17" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </>
  ),
};

export default function Icon({ name, size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
