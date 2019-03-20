import { SendMailOptions, Transporter, createTransport } from 'nodemailer';
import { SmtpOptions } from 'nodemailer-smtp-transport';
import * as TransportStream from 'winston-transport';

export interface IWinstonNodemailerOptions extends TransportStream.TransportStreamOptions, SendMailOptions, SmtpOptions {
  waitUntilSend?: number;
  timestamp?: () => string;
}
