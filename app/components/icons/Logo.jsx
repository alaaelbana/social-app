export default function Logo({ width = 122, height = 79 }) {
  return (
    <svg width={width} height={height} version="1.2" viewBox="0 0 122 79">
      <defs>
        <linearGradient
          id="g1"
          x2="1"
          gradientTransform="matrix(-105.25 96.701 -40.941 -44.56 165.794 -3.186)"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#531db5"></stop>
          <stop offset="1" stopColor="#8733ff"></stop>
        </linearGradient>
        <linearGradient
          id="g2"
          x2="1"
          gradientTransform="matrix(-117.832 -118.439 82.281 -81.859 123.697 140.314)"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#7d33a9"></stop>
          <stop offset="0.557" stopColor="#ff31fa"></stop>
        </linearGradient>
      </defs>
      <g>
        <path
          fill="url(#g1)"
          d="M8.1 71.4C.9 64.3.9 52.7 8.1 45.5L47.4 6.2C54.6-1 66.2-1 73.3 6.2c7.2 7.1 7.2 18.8 0 25.9L34 71.4c-7.1 7.2-18.8 7.2-25.9 0"
        ></path>
        <path
          fill="url(#g2)"
          d="M88.3 21.1c-.5 6.7-3.3 13-8.1 17.9-7.2 7.1-7.2 18.7 0 25.9l6.5 6.5c7.2 7.2 18.8 7.2 26 0 7.1-7.1 7.1-18.7 0-25.9z"
        ></path>
      </g>
    </svg>
  );
}
