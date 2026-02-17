import "server-only";

import { render } from "@react-email/render";
import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import type * as React from "react";

type SendEmailInput = {
  to: string;
  subject: string;
  react: React.ReactElement;
};

type SendEmailResult =
  | { ok: true; messageId?: string }
  | { ok: false; error: string };

const getSmtpPort = () => {
  const raw = process.env.SMTP_PORT;
  if (!raw) return 587;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 587;
};

const getSmtpSecure = () => {
  return String(process.env.SMTP_SECURE ?? "").toLowerCase() === "true";
};

export const getEmailFrom = () => {
  const smtpFrom = process.env.SMTP_FROM;
  if (smtpFrom) return smtpFrom;

  const senderName = process.env.EMAIL_SENDER_NAME;
  const senderAddress = process.env.EMAIL_SENDER_ADDRESS;
  if (senderName && senderAddress) return `${senderName} <${senderAddress}>`;

  return null;
};

export const isEmailEnabled = () => {
  return Boolean(process.env.SMTP_HOST && getEmailFrom());
};

const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  if (!host) return null;

  const transporter = nodemailer.createTransport({
    host,
    port: getSmtpPort(),
    secure: getSmtpSecure(),
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
  });

  return transporter;
};

export const sendEmail = async ({ to, subject, react }: SendEmailInput): Promise<SendEmailResult> => {
  const from = getEmailFrom();
  if (!from) {
    return { ok: false, error: "SMTP_FROM (or EMAIL_SENDER_*) is not set" };
  }

  const transporter = createTransporter();
  if (!transporter) {
    return { ok: false, error: "SMTP_HOST is not set" };
  }

  let html: string;
  try {
    html = await render(react);
  } catch (error) {
    console.error("SMTP: failed to render email", { to, subject, error });
    return { ok: false, error: "Failed to render email template" };
  }

  const message: Mail.Options = {
    from,
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(message);
    return { ok: true, messageId: info?.messageId };
  } catch (error) {
    console.error("SMTP: failed to send email", {
      to,
      subject,
      error,
    });
    return { ok: false, error: "SMTP send failed" };
  }
};
