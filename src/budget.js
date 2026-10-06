export function parseBudget(raw) {
  if (!raw) {
    return {
      min: null,
      max: null,
      raw: null,
    };
  }

  const str = String(raw).replace(/,/g, "");
  const matches = str.match(/\d+(\.\d+)?/g);

  if (!matches) {
    return {
      min: null,
      max: null,
      raw,
    };
  }

  const nums = matches.map(Number);
  const first = nums[0];
  const second = nums[1];

  if (second != null) {
    return {
      min: Math.min(first, second),
      max: Math.max(first, second),
      raw,
    };
  }

  if (/under|below|less than|up to|upto/i.test(str)) {
    return {
      min: null,
      max: first,
      raw,
    };
  }

  if (/over|more than|at least|from/i.test(str)) {
    return {
      min: first,
      max: null,
      raw,
    };
  }

  // A plain number means "budget up to this amount"
  // rather than "product must cost exactly this amount".
  return {
    min: null,
    max: first,
    raw,
  };
}
