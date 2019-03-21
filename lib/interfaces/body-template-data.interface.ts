import { IErrorDetails } from './error-details.interface';

/**
 * Interface including all available fields for custom email body rendering
 */
export interface IBodyTemplateData {
  errorDetails: IErrorDetails[];
  hostname: string;
  pid: number;
  application: string;
  environment: string;
}
