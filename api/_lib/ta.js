// Technical-analysis math for ShopCardHub price series.
//
// Philosophy (Mo's): the chart is the only truth. Every signal here is derived
// from the price/volume series itself — momentum, trend, dispersion — never from
// "fundamentals." Functions are pure and zero-dependency so they unit-test
// trivially (see tools/price-engine/selftest.mjs) and run in any Vercel function.
//
// A "series" is an array of numbers in chronological order (oldest -> newest).
// Helpers tolerate short/!finite input by returning null rather than throwing,
// so a card with only a few days of history degrades gracefully to HOLD.

// ---- basic stats ------------------------------------------------------------

export function mean(xs) {
  const v = xs.filter(Number.isFinite);
  if (!v.length) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}

// Sample standard deviation (n-1). Returns null if < 2 points.
export function stdev(xs) {
  const v = xs.filter(Number.isFinite);
  if (v.length < 2) return null;
  const m = mean(v);
  const ss = v.reduce((a, b) => a + (b - m) * (b - m), 0);
  return Math.sqrt(ss / (v.length - 1));
}

// Simple moving average over the last `period` points.
export function sma(series, period) {
  if (!Array.isArray(series) || series.length < period || period <= 0) return null;
  return mean(series.slice(-period));
}

// Exponential moving average over the whole series (last value).
export function ema(series, period) {
  const v = series.filter(Number.isFinite);
  if (v.length < period || period <= 0) return null;
  const k = 2 / (period + 1);
  // seed with SMA of the first `period` points
  let e = mean(v.slice(0, period));
  for (let i = period; i < v.length; i++) e = v[i] * k + e * (1 - k);
  return e;
}

// Rate of change (%) between the value `lookback` points ago and the latest.
export function roc(series, lookback) {
  if (!Array.isArray(series) || series.length <= lookback) return null;
  const past = series[series.length - 1 - lookback];
  const now = series[series.length - 1];
  if (!Number.isFinite(past) || !Number.isFinite(now) || past === 0) return null;
  return ((now - past) / past) * 100;
}

// Period-over-period simple returns (fractional, not %).
export function returns(series) {
  const v = series.filter(Number.isFinite);
  const out = [];
  for (let i = 1; i < v.length; i++) {
    if (v[i - 1] === 0) continue;
    out.push((v[i] - v[i - 1]) / v[i - 1]);
  }
  return out;
}

// z-score of the latest value vs the trailing window (default = whole series).
export function zScore(series, window) {
  const v = series.filter(Number.isFinite);
  const slice = window ? v.slice(-window) : v;
  const m = mean(slice);
  const s = stdev(slice);
  if (m == null || !s) return null;
  return (v[v.length - 1] - m) / s;
}

// Fisher-Pearson sample skewness of an array (the "next level after stdev").
// Positive => long right tail. Returns null if < 3 points or zero variance.
export function skewness(xs) {
  const v = xs.filter(Number.isFinite);
  const n = v.length;
  if (n < 3) return null;
  const m = mean(v);
  const s = stdev(v);
  if (!s) return null;
  const sum3 = v.reduce((a, b) => a + Math.pow((b - m) / s, 3), 0);
  return (n / ((n - 1) * (n - 2))) * sum3;
}

// Excess kurtosis (sample, bias-corrected). 0 == normal tails; >0 == fat tails.
// Returns null if < 4 points or zero variance.
export function kurtosis(xs) {
  const v = xs.filter(Number.isFinite);
  const n = v.length;
  if (n < 4) return null;
  const m = mean(v);
  const s = stdev(v);
  if (!s) return null;
  const sum4 = v.reduce((a, b) => a + Math.pow((b - m) / s, 4), 0);
  const a = (n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3));
  const b = (3 * (n - 1) * (n - 1)) / ((n - 2) * (n - 3));
  return a * sum4 - b;
}

// Max peak-to-trough drawdown (%) over the series. Returns a negative number.
export function maxDrawdown(series) {
  const v = series.filter(Number.isFinite);
  if (v.length < 2) return null;
  let peak = v[0];
  let mdd = 0;
  for (const x of v) {
    if (x > peak) peak = x;
    if (peak > 0) {
      const dd = (x - peak) / peak;
      if (dd < mdd) mdd = dd;
    }
  }
  return mdd * 100;
}

// ---- the signal -------------------------------------------------------------

// Minimum points before we'll emit a directional call. Below this we HOLD and
// report how much history is still needed — honest, no fake precision.
export const MIN_HISTORY = 20;

// Compute a full TA snapshot + BUY/SELL/HOLD for one card's price series.
//
//   series  : chronological prices (numbers), oldest -> newest
//   volume  : optional latest sales-volume (yearly units) for a liquidity flag
//
// Returns an object with every metric plus { signal, confidence, reasons[] }.
// The decision is intentionally transparent: each reason is a short string the
// front-end can show so a visitor sees *why*, not just a verdict.
export function analyze(series, volume) {
  const prices = (series || []).filter(Number.isFinite);
  const last = prices.length ? prices[prices.length - 1] : null;

  const out = {
    last,
    points: prices.length,
    sma7: sma(prices, 7),
    sma30: sma(prices, 30),
    sma90: sma(prices, 90),
    ema12: ema(prices, 12),
    ema26: ema(prices, 26),
    roc7: roc(prices, 7),
    roc30: roc(prices, 30),
    roc90: roc(prices, 90),
    z: zScore(prices, 90),
    retSkew: skewness(returns(prices)),
    retKurtosis: kurtosis(returns(prices)),
    maxDrawdown: maxDrawdown(prices),
    volume: Number.isFinite(volume) ? volume : null,
    signal: "HOLD",
    confidence: 0,
    reasons: [],
  };

  if (prices.length < MIN_HISTORY) {
    out.signal = "HOLD";
    out.reasons.push(`Building history — ${prices.length}/${MIN_HISTORY} days collected`);
    return out;
  }

  // ---- score the chart. Positive = bullish, negative = bearish. ----
  // NOISE GUARD: trend/EMA contributions only count when the gap is a meaningful
  // fraction of price (>= GAP_MIN). On essentially flat data, tiny MA crossings
  // are noise, not signal — they must not produce a BUY/SELL.
  const GAP_MIN = 0.01; // 1% of price
  let score = 0;
  const r = out.reasons;

  // 1) Trend stack: short MA meaningfully above long MA = uptrend.
  if (out.sma7 != null && out.sma30 != null && out.sma30 !== 0) {
    const gap = (out.sma7 - out.sma30) / out.sma30;
    if (gap > GAP_MIN) { score += 1; r.push("Short-term avg above long-term (uptrend)"); }
    else if (gap < -GAP_MIN) { score -= 1; r.push("Short-term avg below long-term (downtrend)"); }
  }
  // 2) Price vs its 30-day average.
  if (out.sma30 != null && last != null && out.sma30 !== 0) {
    const gap = (last - out.sma30) / out.sma30;
    if (gap > GAP_MIN) score += 0.5;
    else if (gap < -GAP_MIN) score -= 0.5;
  }
  // 3) Momentum: 30-day rate of change.
  if (out.roc30 != null) {
    if (out.roc30 > 8) { score += 1; r.push(`Up ${out.roc30.toFixed(1)}% over 30d (momentum)`); }
    else if (out.roc30 < -8) { score -= 1; r.push(`Down ${Math.abs(out.roc30).toFixed(1)}% over 30d (momentum)`); }
  }
  // 4) MACD-style: EMA12 meaningfully apart from EMA26.
  if (out.ema12 != null && out.ema26 != null && last) {
    const gap = (out.ema12 - out.ema26) / last;
    if (gap > GAP_MIN) score += 0.5;
    else if (gap < -GAP_MIN) score -= 0.5;
  }
  // 5) Over/under-extension guard via z-score. Stretched moves mean-revert.
  if (out.z != null) {
    if (out.z > 2.5) { score -= 1; r.push(`Stretched +${out.z.toFixed(1)}σ above mean (overbought)`); }
    else if (out.z < -2.5) { score += 1; r.push(`${out.z.toFixed(1)}σ below mean (oversold)`); }
  }

  // ---- map score -> signal ----
  if (score >= 1.5) out.signal = "BUY";
  else if (score <= -1.5) out.signal = "SELL";
  else out.signal = "HOLD";
  out.score = Number(score.toFixed(2));
  // Confidence 0..1 from how decisively the score clears the ±1.5 band.
  out.confidence = Math.max(0, Math.min(1, (Math.abs(score) - 0.5) / 3));

  // ---- regime context (Mo's skew/kurtosis layer) ----
  if (out.retKurtosis != null && out.retKurtosis > 3) {
    r.push("Fat-tailed returns — expect outsized moves; size accordingly");
  }
  if (out.retSkew != null) {
    if (out.retSkew > 0.5) r.push("Right-skewed returns (upside tail)");
    else if (out.retSkew < -0.5) r.push("Left-skewed returns (downside tail)");
  }
  // ---- liquidity flag: a signal on a thin card is noise. ----
  if (out.volume != null && out.volume < 12) {
    r.push("Thin volume (<12 sales/yr) — treat signal with caution");
    out.confidence *= 0.5;
  }

  out.confidence = Number(out.confidence.toFixed(2));
  return out;
}
