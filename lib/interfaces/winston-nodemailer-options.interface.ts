import { SendMailOptions } from 'nodemailer';
import { SmtpOptions } from 'nodemailer-smtp-transport';
import * as TransportStream from 'winston-transport';

/**
 * Interface for all required option fields of our module
 */
export interface IWinstonNodemailerOptions extends TransportStream.TransportStreamOptions {
  sendMailOptions: SendMailOptions;
  smtpOptions: SmtpOptions;
  subject?: string;
  template?: string;
  waitUntilSend?: number;
  application?: string;
  timestamp?: () => string;
}
