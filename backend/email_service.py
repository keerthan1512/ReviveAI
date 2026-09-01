import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

def send_recovery_email(to_email: str, subject: str, message_body: str):
    load_dotenv(override=True) # Forces reload of .env in case you just added the password
    sender_email = os.environ.get("SMTP_EMAIL")
    sender_password = os.environ.get("SMTP_PASSWORD")
    
    if not sender_email or not sender_password:
        print("[WARNING] SMTP_EMAIL or SMTP_PASSWORD not set in .env. Skipping real email dispatch.")
        print(f"\n--- [MOCK EMAIL to {to_email}] ---\n{message_body}\n----------------------------------\n")
        return False

    try:
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = to_email
        msg['Subject'] = subject
        
        msg.attach(MIMEText(message_body, 'plain'))
        
        # Connect to Gmail SMTP server
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
        
        print(f"[SUCCESS] Sent recovery email to {to_email}")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to send email: {e}")
        return False
