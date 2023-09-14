/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { SES, SendRawEmailCommand } from '@aws-sdk/client-ses';
import nodemailer from 'nodemailer';

const ses = new SES();

const transporter = nodemailer.createTransport({
  SES: {
    ses,
    aws: { SendRawEmailCommand },
  },
});

export async function notifyAdminNewMentors(): Promise<string> {
  try {
    const domain = process.env.DOMAIN;
    const adminEmailsList =
      (process.env.NOTIFY_ADMIN_EMAILS_LIST || '').split(',') || [];
    const emailFrom = process.env.NOTIFY_ADMIN_EMAIL_FROM;
    if (!emailFrom) {
      return 'error: missing email from';
    }
    if (!domain) {
      return 'error: missing domain';
    }
    if (!adminEmailsList || adminEmailsList.length === 0) {
      return 'error: missing admin emails';
    }
    const link = `https://${domain}/admin/users/?unapproved=true`;
    for (let i = 0; i < adminEmailsList.length; i++) {
      if (i > 0) {
        // AWS SES Currently restricts to 1 email per second
        // TODO: remove this once we are approved for sending emails in SES
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      const email = adminEmailsList[i];
      await transporter
        .sendMail({
          from: emailFrom,
          to: email,
          subject: 'New Mentor needs to be approved!',
          text: `There are new mentors that need to be approved for public viewing! Visit ${link} to approve. (Note: Must be logged in as a Content Manager or Admin to approve)`,
        })
        .catch((err) => {
          console.log(err);
          return `error: ${err}`;
        });
    }
    return `emails sent to ${adminEmailsList
      .map((email) => `'${email}'`)
      .join(', ')}`;
  } catch (err) {
    console.log(err);
    return `error: ${err}`;
  }
}
