import { api } from './api';
import { SimulationRecord } from '../types/pret';

export async function fetchSimulations(params?: Record<string, string>) {
  return api.get<SimulationRecord[]>('/simulations', params);
}

export async function fetchSimulationById(id: string) {
  return api.get<SimulationRecord>(`/simulations/${id}`);
}

export async function createSimulation(data: Record<string, unknown>) {
  return api.post<SimulationRecord>('/simulations', data);
}

export async function updateSimulation(id: string, data: Record<string, unknown>) {
  return api.put<SimulationRecord>(`/simulations/${id}`, data);
}

export async function deleteSimulation(id: string) {
  return api.del<{ success: boolean }>(`/simulations/${id}`);
}
