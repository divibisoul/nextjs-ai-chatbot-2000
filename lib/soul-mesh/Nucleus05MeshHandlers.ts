import { getWeatherData, type WeatherInput } from '@/lib/ai/tools/get-weather';

export type Nucleus05MeshHandler = (payload: unknown) => Promise<unknown> | unknown;

export const NUCLEUS_05_MESH_HANDLERS: Record<string, Nucleus05MeshHandler> = {
  getWeather: async (payload) => getWeatherData(payload as WeatherInput),
};
