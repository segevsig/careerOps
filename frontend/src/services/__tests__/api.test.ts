import { describe, it, expect, beforeEach, vi } from 'vitest';
import api from '../api';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('API Service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates axios instance with correct base URL', () => {
    expect(api.defaults.baseURL).toBeDefined();
    expect(api.defaults.baseURL).toBe('http://localhost:3000');
  });

  it('has correct default headers', () => {
    expect(api.defaults.headers['Content-Type']).toBe('application/json');
  });

  it('interceptor adds authorization token when available', () => {
    localStorage.setItem('token', 'test-token');
    
    // Get the request interceptor
    const requestInterceptor = api.interceptors.request.handlers[0];
    expect(requestInterceptor).toBeDefined();
    
    // Test that token would be added
    const mockConfig = {
      headers: {} as any,
    };
    
    if (requestInterceptor && requestInterceptor.fulfilled) {
      const result = requestInterceptor.fulfilled(mockConfig);
      expect(result.headers.Authorization).toBe('Bearer test-token');
    }
  });

  it('interceptor does not add token when not available', () => {
    localStorage.removeItem('token');
    
    const requestInterceptor = api.interceptors.request.handlers[0];
    expect(requestInterceptor).toBeDefined();
    
    const mockConfig = {
      headers: {} as any,
    };
    
    if (requestInterceptor && requestInterceptor.fulfilled) {
      const result = requestInterceptor.fulfilled(mockConfig);
      expect(result.headers.Authorization).toBeUndefined();
    }
  });

  it('handles localStorage operations correctly', () => {
    localStorage.setItem('token', 'test-token-123');
    expect(localStorage.getItem('token')).toBe('test-token-123');
    
    localStorage.removeItem('token');
    expect(localStorage.getItem('token')).toBeNull();
  });
});
