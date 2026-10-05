import { http, HttpResponse } from 'msw';
import { server } from '../test/server';
import { api } from '../test/utils';
import { ApiError, request, toQueryString } from './client';

describe('request', () => {
  it('returns the parsed JSON body', async () => {
    server.use(http.get(api('/players/1'), () => HttpResponse.json({ id: 1, username: 'alice' })));

    await expect(request('/players/1')).resolves.toEqual({ id: 1, username: 'alice' });
  });

  it('sends a JSON body', async () => {
    let received: unknown;
    server.use(
      http.post(api('/players'), async ({ request: req }) => {
        received = await req.json();
        return HttpResponse.json({ id: 2 }, { status: 201 });
      }),
    );

    await request('/players', { method: 'POST', body: { username: 'bob' } });

    expect(received).toEqual({ username: 'bob' });
  });

  it('resolves undefined on 204', async () => {
    server.use(http.delete(api('/players/1'), () => new HttpResponse(null, { status: 204 })));

    await expect(request('/players/1', { method: 'DELETE' })).resolves.toBeUndefined();
  });

  it('throws an ApiError carrying the problem detail', async () => {
    const problem = {
      status: 409,
      detail: 'Username already taken',
      code: 'USERNAME_ALREADY_EXISTS',
      errorId: 'abc',
    };
    server.use(
      http.post(api('/players'), () =>
        HttpResponse.json(problem, { status: 409, headers: { 'Content-Type': 'application/problem+json' } }),
      ),
    );

    const error = await request('/players', { method: 'POST', body: {} }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).problem).toEqual(problem);
    expect((error as ApiError).message).toBe('Username already taken');
  });

  it('turns a non-JSON error (proxy, API down) into a problem detail', async () => {
    server.use(http.get(api('/players'), () => new HttpResponse('Bad gateway', { status: 502 })));

    const error = (await request('/players').catch((e: unknown) => e)) as ApiError;

    expect(error.status).toBe(502);
    expect(error.problem.detail).toMatch(/unavailable/);
  });

  it('turns a network failure into a problem detail', async () => {
    server.use(http.get(api('/players'), () => HttpResponse.error()));

    const error = (await request('/players').catch((e: unknown) => e)) as ApiError;

    expect(error.status).toBe(0);
    expect(error.problem.code).toBe('NETWORK_ERROR');
  });
});

describe('toQueryString', () => {
  it('omits missing params', () => {
    expect(toQueryString()).toBe('');
    expect(toQueryString({ page: 0, size: 20 })).toBe('?page=0&size=20');
    expect(toQueryString({ sort: 'name,desc' })).toBe('?sort=name%2Cdesc');
  });
});
