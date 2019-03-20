import * as Transport from 'winston-transport';
import {Transporter, createTransport, SendMailOptions} from 'nodemailer';
import { IWinstonNodemailerOptions } from './interfaces/winston-nodemailer-options.interface';
import { LogCallback } from 'winston';

/**
 * @TODO Add detailed object / interface to to transportbuffer
 * @TODO Add basic template system
 */
export class WinstonNodemailer extends Transport {
  private waitUntilSend: number;
  private transportBuffer: string[] = [];
  private timestamp: () => string;
  private transporter: Transporter;
  private triggered: NodeJS.Timer;

  constructor(private options: IWinstonNodemailerOptions) {
    super(options);

    this.level = options.level || 'error';
    this.silent = !!options.silent;

    this.waitUntilSend = options.waitUntilSend || 60000;
    this.timestamp = options.timestamp || (() => (new Date()).toISOString());

    this.transportBuffer = [];

    this.transporter = createTransport(options);
  }

  public log(info: any, callback: LogCallback) {
    if (this.silent) {
      return callback(null, undefined);
    }

    /* */
    const level = info.level;
    const msg = info.message || '';
    let meta = info.meta;

    /* */
    if (meta instanceof Error) {
      meta = {
        message: meta.message,
        name: meta.name,
        stack: meta.stack,
      };
    }

    /* @TODO Add detailed object */
    this.transportBuffer.push();

    /* */
    if (!this.triggered) {
      this.triggered = setTimeout(() => {
        this.sendMail(callback);
      }, this.waitUntilSend);
    }
  }

  /**
   * @TODO Possible Templating
   * @param callback
   */
  private sendMail(callback: LogCallback) {
    this.transporter
      .sendMail({
        ...this.options,
        text: this.transportBuffer.join(''),
      } as SendMailOptions);

    this.transportBuffer = [];
    delete this.triggered;
  }

}
