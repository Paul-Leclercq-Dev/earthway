import { useMemo } from 'react';
import api from '../services/api';

export function useApi() {
  return useMemo(() => api, []);
}

export default useApi;