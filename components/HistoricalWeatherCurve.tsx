'use client';

interface HistoricalWeatherCurveProps {
  month: string;
  tempMean: number;
  tempStdDev: number;
  tempMin: number;
  tempMax: number;
  precipMean: number;
}

// Generate points for a bell curve (Gaussian distribution)
function generateBellCurve(
  mean: number,
  stdDev: number,
  min: number,
  max: number,
  numPoints: number = 50
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const range = max - min;
  const padding = range * 0.1;
  const start = min - padding;
  const end = max + padding;
  const step = (end - start) / numPoints;

  for (let i = 0; i <= numPoints; i++) {
    const x = start + i * step;
    // Gaussian formula: y = e^(-(x-mean)^2 / (2*stdDev^2))
    const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2));
    const y = Math.exp(exponent);
    points.push({ x, y });
  }

  return points;
}

// Add slight hand-drawn wobble to path
function addWobble(value: number, intensity: number = 0.5): number {
  return value + (Math.random() - 0.5) * intensity;
}

export default function HistoricalWeatherCurve({
  month,
  tempMean,
  tempStdDev,
  tempMin,
  tempMax,
  precipMean,
}: HistoricalWeatherCurveProps) {
  const width = 280;
  const height = 100;
  const padding = { top: 10, right: 20, bottom: 30, left: 20 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Generate curve points
  const curvePoints = generateBellCurve(tempMean, tempStdDev, tempMin, tempMax);

  // Map to SVG coordinates
  const xScale = (temp: number) => {
    const range = tempMax - tempMin;
    const paddedMin = tempMin - range * 0.1;
    const paddedMax = tempMax + range * 0.1;
    return padding.left + ((temp - paddedMin) / (paddedMax - paddedMin)) * chartWidth;
  };

  const yScale = (y: number) => {
    return padding.top + chartHeight - y * chartHeight * 0.9;
  };

  // Build path with slight hand-drawn feel
  const pathData = curvePoints
    .map((p, i) => {
      const x = addWobble(xScale(p.x), 0.3);
      const y = addWobble(yScale(p.y), 0.3);
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(' ');

  // 1 standard deviation range (68% of values)
  const oneSigmaLow = tempMean - tempStdDev;
  const oneSigmaHigh = tempMean + tempStdDev;

  // Calculate area under curve for 1-sigma region
  const areaPoints = curvePoints.filter(p => p.x >= oneSigmaLow && p.x <= oneSigmaHigh);
  const areaPath = areaPoints.length > 0
    ? `M ${xScale(oneSigmaLow)} ${yScale(0)} ` +
      areaPoints.map(p => `L ${xScale(p.x)} ${yScale(p.y)}`).join(' ') +
      ` L ${xScale(oneSigmaHigh)} ${yScale(0)} Z`
    : '';

  return (
    <div className="weather-distribution">
      <div className="weather-distribution-header">
        <span className="weather-distribution-label">Historical pattern for {month}</span>
      </div>

      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="weather-curve-svg"
        aria-label={`Temperature distribution: typically ${Math.round(oneSigmaLow)}° to ${Math.round(oneSigmaHigh)}°, average ${Math.round(tempMean)}°`}
      >
        {/* Filled area for 1 standard deviation (likely range) */}
        <path
          d={areaPath}
          className="weather-curve-area"
          fill="var(--sage-light, rgba(107, 142, 95, 0.15))"
        />

        {/* Main curve line - organic hand-drawn style */}
        <path
          d={pathData}
          fill="none"
          stroke="var(--sage, #6B8E5F)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="weather-curve-line"
        />

        {/* Mean line - dashed */}
        <line
          x1={xScale(tempMean)}
          y1={padding.top}
          x2={xScale(tempMean)}
          y2={height - padding.bottom + 5}
          stroke="var(--terracotta, #C4785A)"
          strokeWidth="1"
          strokeDasharray="3 2"
          className="weather-curve-mean"
        />

        {/* 1-sigma markers */}
        <line
          x1={xScale(oneSigmaLow)}
          y1={height - padding.bottom}
          x2={xScale(oneSigmaLow)}
          y2={height - padding.bottom + 4}
          stroke="var(--muted, #6B6B6B)"
          strokeWidth="1"
        />
        <line
          x1={xScale(oneSigmaHigh)}
          y1={height - padding.bottom}
          x2={xScale(oneSigmaHigh)}
          y2={height - padding.bottom + 4}
          stroke="var(--muted, #6B6B6B)"
          strokeWidth="1"
        />

        {/* Baseline */}
        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          stroke="var(--muted, #6B6B6B)"
          strokeWidth="0.75"
        />

        {/* Temperature labels */}
        <text
          x={xScale(oneSigmaLow)}
          y={height - 8}
          textAnchor="middle"
          className="weather-curve-label"
          fill="var(--muted, #6B6B6B)"
        >
          {Math.round(oneSigmaLow)}°
        </text>
        <text
          x={xScale(tempMean)}
          y={height - 8}
          textAnchor="middle"
          className="weather-curve-label weather-curve-label-mean"
          fill="var(--terracotta, #C4785A)"
        >
          {Math.round(tempMean)}°
        </text>
        <text
          x={xScale(oneSigmaHigh)}
          y={height - 8}
          textAnchor="middle"
          className="weather-curve-label"
          fill="var(--muted, #6B6B6B)"
        >
          {Math.round(oneSigmaHigh)}°
        </text>
      </svg>

      <div className="weather-distribution-footer">
        <span className="weather-distribution-range">
          Likely range: <strong>{Math.round(oneSigmaLow)}° – {Math.round(oneSigmaHigh)}°</strong>
        </span>
        {precipMean > 0 && (
          <span className="weather-distribution-precip">
            ~{precipMean.toFixed(1)}mm rain/day typical
          </span>
        )}
      </div>
    </div>
  );
}
