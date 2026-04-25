import { formatCurrency } from '../utils/formatUtils.js';

describe('formatCurrency', () => {
  it('formats whole numbers with thousands separators', () => {
    expect(formatCurrency(2500)).toBe('2,500');
  });

  it('formats zero as 0', () => {
    expect(formatCurrency(0)).toBe('0');
  });
});