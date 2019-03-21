/**
 * Interface including all available fields of the sent error details by winston
 */
export interface IErrorDetails {
  timestamp: string;
  level: string;
  message: string;
  meta: string;
  stack: string;
}
