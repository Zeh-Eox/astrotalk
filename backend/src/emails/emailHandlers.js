import {resendClient} from "../lib/resend.js";
import {sender} from "../lib/resend.js";
import {createWelcomeEmailTemplate} from "./emailTemplates.js";

export const sendWelcomeEmail = async (email, name, clientURL) => {
    const { data, error } = await resendClient.emails.send({
        from: `${sender.name} <${sender.email}>`,
        to: email,
        subject: `Welcome to AstroTalk`,
        html: createWelcomeEmailTemplate(name, clientURL),
    });

    if (error) {
        console.error("Error in sendWelcomeEmail ", error);
        throw new Error("Error in sendWelcomeEmail");
    }

    console.log("Welcome email sent successfully ", data);
}