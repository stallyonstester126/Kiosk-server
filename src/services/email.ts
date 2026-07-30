// Email service disabled - no email provider configured
// import { Resend } from 'resend'
// import config from '../config/config'

// const resend = new Resend(config.EMAIL_API_KEY)

import logger from '../handlers/logger'

export default {
    sendEmail: async (to: string[], subject: string, text: string) => {
        logger.info('[Email Disabled] Would send email', { meta: { to, subject, text } })
        // Email service disabled - implement when email provider is configured
        return Promise.resolve()
    }
}