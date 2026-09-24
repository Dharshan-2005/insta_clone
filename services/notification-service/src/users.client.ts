import { Injectable, ServiceUnavailableException } from '@nestjs/common';

export type Author = { id: string; username: string; name: string | null; avatar: string | null };

const USER_SERVICE_URL = process.env.USER_SERVICE_URL ?? 'http://user-service:4002';

@Injectable()
export class UsersClient {
  async summaries(ids: string[]): Promise<Map<string, Author>> {
    const unique = [...new Set(ids)];
    if (unique.length === 0) return new Map();
    const authors = await this.get<Author[]>(`/internal/users?ids=${unique.join(',')}`);
    return new Map(authors.map((author) => [author.id, author]));
  }

  followingIds(userId: string): Promise<string[]> {
    return this.get(`/internal/users/${userId}/following`);
  }

  private async get<T>(path: string): Promise<T> {
    let res: Response;
    try {
      res = await fetch(`${USER_SERVICE_URL}${path}`);
    } catch {
      throw new ServiceUnavailableException('User service is unavailable');
    }
    if (!res.ok) throw new ServiceUnavailableException(`User service responded with ${res.status}`);
    return res.json() as Promise<T>;
  }
}
