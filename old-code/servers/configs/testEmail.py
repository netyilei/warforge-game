#!/usr/bin/env python3
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import ssl

SMTP_HOST = "smtp.wforge.net"
SMTP_USER = "admin@wforge.net"
SMTP_PASSWORD = "IEAWhsV1"

def send_test_email(to_email, method="starttls"):
    msg = MIMEMultipart()
    msg['From'] = SMTP_USER
    msg['To'] = to_email
    msg['Subject'] = "Test Email from Warforge"
    
    body = """
    <html>
    <body>
        <h2>Test Email</h2>
        <p>This is a test email from Warforge server.</p>
        <p>Method: """ + method + """</p>
        <hr>
        <p><small>Sent from Warforge Email Service</small></p>
    </body>
    </html>
    """
    msg.attach(MIMEText(body, 'html'))
    
    try:
        if method == "ssl_465":
            print("Trying: SMTP_SSL on port 465...")
            context = ssl.create_default_context()
            context.check_hostname = False
            context.verify_mode = ssl.CERT_NONE
            server = smtplib.SMTP_SSL(SMTP_HOST, 465, context=context)
            
        elif method == "starttls_587":
            print("Trying: SMTP + STARTTLS on port 587...")
            server = smtplib.SMTP(SMTP_HOST, 587)
            context = ssl.create_default_context()
            context.check_hostname = False
            context.verify_mode = ssl.CERT_NONE
            server.starttls(context=context)
            
        elif method == "starttls_25":
            print("Trying: SMTP + STARTTLS on port 25...")
            server = smtplib.SMTP(SMTP_HOST, 25)
            context = ssl.create_default_context()
            context.check_hostname = False
            context.verify_mode = ssl.CERT_NONE
            server.starttls(context=context)
            
        elif method == "plain_25":
            print("Trying: Plain SMTP on port 25 (no encryption)...")
            server = smtplib.SMTP(SMTP_HOST, 25)
        
        else:
            raise ValueError(f"Unknown method: {method}")
        
        server.login(SMTP_USER, SMTP_PASSWORD)
        text = msg.as_string()
        server.sendmail(SMTP_USER, to_email, text)
        server.quit()
        print(f"[SUCCESS] Email sent to {to_email} using {method}")
        return True
        
    except Exception as e:
        print(f"[FAILED] {method}: {e}")
        return False

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python testEmail.py <recipient_email>")
        print("Example: python testEmail.py user@example.com")
        sys.exit(1)
    
    to_email = sys.argv[1]
    print(f"Sending test email to: {to_email}")
    print(f"SMTP Server: {SMTP_HOST}")
    print("=" * 50)
    
    methods = ["ssl_465", "starttls_587", "starttls_25", "plain_25"]
    
    for method in methods:
        print()
        if send_test_email(to_email, method):
            print(f"\nWorking method: {method}")
            break
        print("-" * 50)
