import { HttpException, Injectable, ServiceUnavailableException } from '@nestjs/common';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL ?? 'http://user-service:4002';

@Injectable()
export class UsersClient {
  async createProfile(profile: { id: string; username: string; name?: string }): Promise<void> {
    await this.request('POST', '/internal/users', profile);
  }

  async deleteProfile(id: string): Promise<void> {
    await this.request('DELETE', `/internal/users/${id}`);
  }

  async findIdByUsername(username: string): Promise<string | null> {
    try {
      const { id } = await this.request<{ id: string }>('GET', `/internal/users/by-username/${encodeURIComponent(username)}`);
      return id;
    } catch (err) {
      if (err instanceof HttpException && err.getStatus() === 404) return null;
      throw err;
    }
  }

  private async request<T = unknown>(method: string, path: string, body?: object): Promise<T> {
    let res: Response;
    try {
      res = await fetch(`${USER_SERVICE_URL}${path}`, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new ServiceUnavailableException('User service is unavailable');
    }
    if (!res.ok) {
      const error = (await res.json().catch(() => ({}))) as { message?: string | string[] };
      throw new HttpException(error.message ?? 'User service error', res.status);
    }
    return (res.status === 204 ? undefined : await res.json()) as T;
  }
}
