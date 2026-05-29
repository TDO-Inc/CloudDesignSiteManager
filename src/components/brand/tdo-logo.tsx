/**
 * TDO Software logo — inlined as SVG so we can recolor the "SOFTWARE"
 * wordmark for dark backgrounds.
 *
 * Original colors (variant="color"):
 *   - TDO letters & dot pattern: purple gradient (#7D4EBF → #E5DCF2)
 *   - SOFTWARE wordmark: black
 *
 * Dark-bg variant ("mono-light"): all marks rendered white.
 */

interface TdoLogoProps {
  variant?: "color" | "mono-light";
  className?: string;
  title?: string;
}

export function TdoLogo({ variant = "color", className, title = "TDO Software" }: TdoLogoProps) {
  const mono = variant === "mono-light";
  const letterFill = mono ? "#FFFFFF" : "#7D4EBF";
  const softwareFill = mono ? "#FFFFFF" : "#000000";
  // Keep circles as a graduated cluster — on dark bg the lighter shades pop,
  // on light bg the darker shades pop.
  const c1 = mono ? "#FFFFFF" : "#7D4EBF";
  const c2 = mono ? "rgba(255,255,255,0.78)" : "#A484D3";
  const c3 = mono ? "rgba(255,255,255,0.56)" : "#CBB8E5";
  const c4 = mono ? "rgba(255,255,255,0.34)" : "#E5DCF2";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1920 1080"
      className={className}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      {/* TDO letters + small ® mark */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        fill={letterFill}
        d="M1861.5,62.5L1861.5,62.5c0-13.4-10.9-24.4-24.4-24.4h-29.4v75.1h14.5V86.8h1.6l23.9,26.3h19.5l0,0l-24.5-27 C1853.5,83.6,1861.5,74,1861.5,62.5z M1822.2,72.3V52.6h14.9c5.4,0,9.9,4.4,9.9,9.9s-4.4,9.9-9.9,9.9H1822.2z M1834.8,10.6 c-36.2,0-64.9,29.2-64.9,65.1c0,35.9,28.7,64.9,64.9,64.9c36.2,0,65.1-29.1,65.1-64.9C1899.9,39.9,1871.1,10.6,1834.8,10.6z M1834.8,133.8c-32.4,0-58.1-26.1-58.1-58.1c0-32,25.7-58.3,58.1-58.3c32.4,0,58.2,26.3,58.2,58.3 C1892.9,107.7,1867.2,133.8,1834.8,133.8z M807.2,11H525.4v0.1h-505v113.4h195.8v546.7h113.5V124.5h195.8v545.2h281.8 c181.6,0,329.4-147.7,329.4-329.4C1136.6,158.8,988.9,11,807.2,11z M807.2,556.3L807.2,556.3l-168.3,0V124.5h168.3 c119.1,0,215.9,96.9,215.9,215.9C1023.2,459.5,926.3,556.3,807.2,556.3z M1466.9,10.6c-182.4,0-330.3,147.9-330.3,330.3 c0,182.4,147.9,330.3,330.3,330.3c182.4,0,330.3-147.9,330.3-330.3C1797.3,158.5,1649.4,10.6,1466.9,10.6z M1466.9,556.5 c-119.1,0-215.6-96.5-215.6-215.6s96.5-215.6,215.6-215.6c119.1,0,215.6,96.5,215.6,215.6S1586,556.5,1466.9,556.5z"
      />
      {/* The four circles forming the dot pattern inside the "O" */}
      <circle fill={c1} cx="1556.3" cy="251.5" r="89.4" />
      <circle fill={c2} cx="1556.3" cy="430.3" r="89.4" />
      <circle fill={c3} cx="1377.6" cy="430.3" r="89.4" />
      <circle fill={c4} cx="1377.6" cy="251.5" r="89.4" />
      {/* "SOFTWARE" wordmark */}
      <g fill={softwareFill}>
        <path d="M240.6,933.6l-28.3-8.3c-24.7-6.7-27.3-19-27.3-26.3c0-16.3,15.3-27,34.3-27c21.3,0,34.3,12,34.3,30h42.6 c0-43.1-33-69.4-76.3-69.4c-42.3,0-77.3,27-77.3,67.4c0,20.4,8,49.4,58,64.1l28.3,7.4c22.3,6,32.7,16,31.7,31.4 c-1,15.7-15,27.7-38,27.7c-24.6,0-39-15.7-39.7-32.4h-42.6c0,39.4,33.3,70.7,82.3,70.7c42,0,78.6-23.7,80.7-65 C305.3,976.6,292,947.6,240.6,933.6z" />
        <path d="M434.3,1026.3c-41.7,0-74-33.7-74-75.7c0-42,32.3-76.1,74-76.1c41.3,0,74,34,74,76.1 C508.3,992.6,475.6,1026.3,434.3,1026.3z M434.3,832.5C369,832.5,318,885.2,318,950.6c0,64.7,51,117.8,116.3,117.8 c65.3,0,116.6-53,116.6-117.8C550.9,885.2,499.6,832.5,434.3,832.5z" />
        <path d="M569.3,835.2V1065H612v-94.1h77.3v-38H612v-59.7h97.6v-38H569.3z" />
        <path d="M725.3,835.2v39H790V1065h43V874.2h64.7v-39H725.3z" />
        <path d="M1157.8,835.2l-49.3,160.2l-34.7-128.1h-34l-35,128.1l-49-160.2h-46l77.3,229.9h34.7l34.7-130.4l35.3,130.4h34.3l78-229.9 H1157.8z" />
        <path d="M1272.7,884.2l29,87.7h-57.3L1272.7,884.2z M1249.7,835.2l-86,229.9h45.3l21-55.7h85.6l21,55.7h45l-86-229.9H1249.7z" />
        <path d="M1439.2,945.3v-72.1h47.3c21.3,0,31,19.7,31,36.4c0,17-10,35.7-32.3,35.7H1439.2z M1561.9,909.6 c0-37.4-22.7-74.4-73.3-74.4h-92V1065h42.7v-81.7h17.7l54,81.7h51.3l-58.7-83.4C1544.2,974.9,1561.9,942.6,1561.9,909.6z" />
        <path d="M1582.6,835.2V1065h145.3v-38h-103v-56.4h87.3v-37.7h-87.3v-59.7h99.6v-38H1582.6z" />
      </g>
    </svg>
  );
}
