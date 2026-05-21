'use client';
import { createContext, useContext } from 'react';

const RestaurantContext = createContext<string>('');

export function RestaurantProvider({ id, children }: { id: string; children: React.ReactNode }) {
  return <RestaurantContext.Provider value={id}>{children}</RestaurantContext.Provider>;
}

export function useRestaurantId(): string {
  return useContext(RestaurantContext);
}
