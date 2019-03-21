import * as Transport from 'winston-transport';
import * as mustache from 'mustache';
import { Transporter, createTransport } from 'nodemailer';
import { IWinstonNodemailerOptions } from './interfaces';
import { LogCallback } from 'winston';
import { IErrorDetails } from './interfaces';
import { ISubjectTemplateData } from './interfaces';
import { IBodyTemplateData } from './interfaces';
import * as os from 'os';

/**
 * @TODO Add detailed object / interface to to transportbuffer
 */
export class WinstonNodemailer extends Transport {
  private waitUntilSend: number;
  private errorDetailsBuffer: IErrorDetails[] = [];
  private timestamp: () => string;
  private transporter: Transporter;
  private triggered: NodeJS.Timer;
  private subject: string;
  private template: string;
  private application: string;

  constructor(private options: IWinstonNodemailerOptions) {
    super(options);

    this.level = options.level || 'error';
    this.silent = !!options.silent;

    this.waitUntilSend = options.waitUntilSend || 60000;
    this.subject = options.subject || this.returnDefaultSubject();
    this.template = options.template || this.returnDefaultTemplate();
    this.application = options.application || ``;
    this.timestamp = options.timestamp || (() => (new Date()).toISOString());

    this.transporter = createTransport({ ...options.smtpOptions, ...options.sendMailOptions });
  }

  public log(info: any, callback: LogCallback) {
    if (this.silent) {
      return callback(null, undefined);
    }

    /* */
    const level = info.level;
    const stack = info.stack;
    let message = info.message;
    let meta = info.meta;

    /* */
    if (typeof message === 'object') {
      message = JSON.stringify(message);
    }
    if (typeof meta === 'object') {
      meta = JSON.stringify(message);
    }

    /* */
    this.errorDetailsBuffer.push({
      timestamp: this.timestamp(),
      level,
      message,
      meta,
      stack,
    });

    /* @TODO Refactor & Cleanup */
    if (!this.triggered) {
      this.triggered = setTimeout(() => {
        this.sendMail(
          {
            errorDetails: {
              timestamp: this.timestamp(),
              level,
              message,
              meta,
              stack,
            },
            hostname: os.hostname(),
            pid: process.pid,
            application: this.application,
            environment: process.env.NODE_ENV || 'default',
          },
          {
            errorDetails: this.errorDetailsBuffer,
            hostname: os.hostname(),
            pid: process.pid,
            application: this.application,
            environment: process.env.NODE_ENV || 'default',
          },
          callback,
        );
      }, this.waitUntilSend);
    }
  }

  /**
   * Sends an email via nodemailer
   *
   * @param subjectTemplateData
   * @param bodyTemplateData
   * @param callback
   */
  private sendMail(subjectTemplateData: ISubjectTemplateData, bodyTemplateData: IBodyTemplateData, callback: LogCallback) {
    this.transporter
      .sendMail({
        ...this.options.sendMailOptions,
        ...this.options.smtpOptions,
        subject: this.returnRenderedSubject(this.subject, subjectTemplateData),
        html: this.returnRenderedBody(this.template, bodyTemplateData),
      }, callback);

    this.errorDetailsBuffer = [];
    delete this.triggered;
  }

  /**
   * Returns the rendered email subject
   *
   * @param subject
   * @param templateData
   */
  private returnRenderedSubject(subject: string, templateData: ISubjectTemplateData) {
    return mustache.render(subject,
      {
        level: templateData.errorDetails.level,
        timestamp: templateData.errorDetails.timestamp,
        message: templateData.errorDetails.message,
        pid: templateData.pid,
        hostname: templateData.hostname,
        application: templateData.application,
        environment: templateData.environment,
      },
    );
  }

  /**
   * Returns the rendered html template for our email body
   *
   * @param template
   * @param templateData
   */
  private returnRenderedBody(template: string, templateData: IBodyTemplateData): string {
    return mustache.render(template,
      {
        errors: templateData.errorDetails,
        pid: templateData.pid,
        hostname: templateData.hostname,
        application: templateData.application,
        environment: templateData.environment,
      },
    );
  }

  /**
   * Returns the default email subject
   */
  private returnDefaultSubject(): string {
    return `{{application}} | {{environment}} | {{level}} | Winston Report`;
  }

  /**
   * Returns the default html template for our email body
   * @TODO Refactor
   */
  private returnDefaultTemplate(): string {
    return `

    <h1>Error Report from {{application}} [{{pid}}] - {{hostname}}</h1>
    
{{#errors}}
<h1 style="background: #c09853;color: #ffffff;padding: 5px;">
    {{level}}
</h1>
<table cellspacing="1" width="100%">
    <tr style="padding:4px; text-align:left">
        <th style="vertical-align: top;background: #ccc;color: #000" width="100">
            Message
        </th>
        <td style="padding: 4px;text-align: left;vertical-align: top;background: #eee;color: #000">
            <pre>{{message}}</pre>
        </td>
    </tr>

    <tr style="padding:4px; text-align:left">
        <th style="vertical-align: top;background: #ccc;color: #000" width="100">
            Time
        </th>
        <td style="padding: 4px;text-align: left;vertical-align: top;background: #eee;color: #000">
            <pre>{{timestamp}}</pre>
        </td>
    </tr>

    <tr style="padding:4px; text-align:left">
        <th style="vertical-align: top;background: #ccc;color: #000" width="100">
            Meta
        </th>
        <td style="padding: 4px;text-align: left;vertical-align: top;background: #eee;color: #000">
            <pre>{{meta}}</pre>
        </td>
    </tr>

    <tr style="padding:4px; text-align:left">
        <th style="vertical-align: top;background: #ccc;color: #000" width="100">
            Stack
        </th>
        <td style="padding: 4px;text-align: left;vertical-align: top;background: #eee;color: #000">
            <pre>{{stack}}</pre>
        </td>
    </tr>

</table>
{{/errors}}
    
    <br>
    <br>
    <i><small>Generated by <a href="https://github.com/sebastianfoth/winston-nodemailer">@sebastianfoth/winston-nodemailer</a></small></i>

    `;
  }

}
