import { prisma } from '@/lib/prisma';

export interface TemplateVariables {
  [key: string]: string | number | boolean;
}

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

/**
 * Get active template version for a template name
 */
export async function getActiveTemplate(
  tenantId: string,
  templateName: string
): Promise<EmailContent | null> {
  const template = await prisma.emailTemplate.findUnique({
    where: {
      tenantId_name: {
        tenantId,
        name: templateName,
      },
      isActive: true,
    },
    include: {
      versions: {
        where: {
          isActive: true,
        },
        take: 1,
      },
    },
  });

  if (!template || template.versions.length === 0) {
    return null;
  }

  const version = template.versions[0];
  return {
    subject: version.subject,
    html: version.htmlContent,
    text: version.textContent,
  };
}

/**
 * Replace variables in template content
 */
export function replaceVariables(
  content: string,
  variables: TemplateVariables
): string {
  let result = content;
  
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(placeholder, String(value));
  }
  
  return result;
}

/**
 * Send email using active template
 */
export async function sendEmailWithTemplate(
  tenantId: string,
  templateName: string,
  to: string,
  variables: TemplateVariables
): Promise<boolean> {
  const template = await getActiveTemplate(tenantId, templateName);
  
  if (!template) {
    console.error(`Template "${templateName}" not found for tenant ${tenantId}`);
    return false;
  }

  const htmlContent = replaceVariables(template.html, variables);
  const textContent = replaceVariables(template.text, variables);
  const subject = replaceVariables(template.subject, variables);

  // TODO: Implement actual email sending with Resend/SendGrid
  console.log('Sending email:', {
    to,
    subject,
    hasHtml: !!htmlContent,
    hasText: !!textContent,
  });

  // Placeholder for actual email sending
  // await resend.emails.send({
  //   from: 'noreply@inaya-auth.com',
  //   to,
  //   subject,
  //   html: htmlContent,
  //   text: textContent,
  // });

  return true;
}
