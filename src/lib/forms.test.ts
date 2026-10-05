import { ApiError } from '../api/client';
import { fieldError, idParam, numberOrNull, pageQueryFrom, textOrNull, toActionResult } from './forms';

const formOf = (entries: Record<string, string>) => {
  const form = new FormData();
  Object.entries(entries).forEach(([key, value]) => form.set(key, value));
  return form;
};

describe('form readers', () => {
  it('trims text and maps blank to null', () => {
    const form = formOf({ name: '  Catan ', blank: '   ' });
    expect(textOrNull(form, 'name')).toBe('Catan');
    expect(textOrNull(form, 'blank')).toBeNull();
    expect(textOrNull(form, 'missing')).toBeNull();
  });

  it('parses numbers and maps blank or garbage to null', () => {
    const form = formOf({ n: '4', empty: '', bad: 'abc' });
    expect(numberOrNull(form, 'n')).toBe(4);
    expect(numberOrNull(form, 'empty')).toBeNull();
    expect(numberOrNull(form, 'bad')).toBeNull();
  });
});

describe('toActionResult', () => {
  it('returns 400 and 409 problems to the form', () => {
    const problem = { status: 409, detail: 'conflict' };
    expect(toActionResult(new ApiError(problem))).toEqual({ problem });
  });

  it('rethrows anything else to the error boundary', () => {
    expect(() => toActionResult(new ApiError({ status: 404 }))).toThrow(ApiError);
    expect(() => toActionResult(new Error('boom'))).toThrow('boom');
  });
});

describe('fieldError', () => {
  it('joins the messages of one field', () => {
    const problem = {
      status: 400,
      errors: [
        { field: 'name', message: 'too short' },
        { field: 'name', message: 'invalid' },
        { field: 'email', message: 'bad' },
      ],
    };
    expect(fieldError(problem, 'name')).toBe('too short invalid');
    expect(fieldError(problem, 'other')).toBe('');
    expect(fieldError(undefined, 'name')).toBeUndefined();
  });
});

describe('pageQueryFrom', () => {
  it('maps the 1-based URL page to the 0-based API page', () => {
    expect(pageQueryFrom('http://x/players?page=3')).toEqual({ page: 2, size: 20 });
    expect(pageQueryFrom('http://x/players')).toEqual({ page: 0, size: 20 });
    expect(pageQueryFrom('http://x/players?page=-1')).toEqual({ page: 0, size: 20 });
  });
});

describe('idParam', () => {
  it('accepts positive integers only', () => {
    expect(idParam('12')).toBe(12);
    expect(() => idParam('abc')).toThrow(ApiError);
    expect(() => idParam(undefined)).toThrow(ApiError);
  });
});
