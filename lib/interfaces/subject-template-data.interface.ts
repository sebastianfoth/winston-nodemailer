import { IErrorDetails } from './error-details.interface';

/**
 * Interface including all available fields for custom subject rendering
 */
export interface ISubjectTemplateData {
  errorDetails: IErrorDetails;
  hostname: string;
  pid: number;
  application: string;
  environment: string;
}
