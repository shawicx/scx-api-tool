import { ApiConfig, ServerType } from '../types';
import { fetchApifoxData } from './apifox';
import { fetchSwaggerData } from './swagger';

export async function fetchData(config: ApiConfig): Promise<any> {
  switch (config.serverType) {
    case ServerType.Apifox:
      return fetchApifoxData(config);
    case ServerType.Swagger:
      return fetchSwaggerData(config);
    default:
      throw new Error(`Unsupported server type: ${config.serverType}`);
  }
}
