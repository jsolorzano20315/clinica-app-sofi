import api from "./http";
import type { Cita } from "@/types/Cita";

export const getCitas = async (): Promise<Cita[]> => (await api.get("/citas")).data;
export const getCita = async (id: number): Promise<Cita> => (await api.get(`/citas/${id}`)).data;
export const createCita = async (cita: Cita) => (await api.post("/citas", cita)).data;
export const updateCita = async (id: number, cita: Cita) => (await api.put(`/citas/${id}`, cita)).data;
export const deleteCita = async (id: number) => (await api.delete(`/citas/${id}`)).data;