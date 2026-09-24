'use client';

import { useEffect } from 'react';
import { api } from '@/lib/api';

export default function MarkNotificationsRead() {
  useEffect(() => {
    api.post('/notifications/read').catch(() => undefined);
  }, []);
  return null;
}
