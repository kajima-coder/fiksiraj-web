import os
from pathlib import Path
from dotenv import load_dotenv
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import logging
import time

logger = logging.getLogger(__name__)

# Email subject prefix for consistent branding
SUBJECT_PREFIX = "[Fiksiraj]"

# Email retry configuration
MAX_RETRIES = 3
RETRY_DELAY_SECONDS = 2

# Ensure .env is loaded (idempotent - safe to call multiple times)
ROOT_DIR = Path(__file__).parent
_env_loaded = False


def _ensure_env_loaded():
    """Ensure environment variables are loaded from .env file."""
    global _env_loaded
    if not _env_loaded:
        load_dotenv(ROOT_DIR / '.env', override=True)
        _env_loaded = True


def _get_sendgrid_config():
    """Get SendGrid configuration at runtime (not cached at module load)."""
    _ensure_env_loaded()
    return {
        'api_key': os.environ.get('SENDGRID_API_KEY'),
        'from_email': os.environ.get('SENDGRID_FROM_EMAIL', 'noreply@solvix.hr'),
        'from_name': os.environ.get('SENDGRID_FROM_NAME', 'Fiksiraj'),
    }


def send_email_with_retry(to_email: str, subject: str, html_content: str, max_retries: int = MAX_RETRIES) -> bool:
    """Send email with retry logic"""
    logger.info(f"[EMAIL SEND] Starting send_email_with_retry to: {to_email}, subject: {subject}")
    
    # Get config at send time (not module load time)
    config = _get_sendgrid_config()
    api_key = config['api_key']
    from_email = config['from_email']
    from_name = config['from_name']
    
    if not api_key:
        logger.error(f"[EMAIL ERROR] SendGrid API key not found in environment")
        return False
    
    # Log key info for debugging (safely)
    logger.info(f"[EMAIL CONFIG] API key present: YES, length: {len(api_key)}, starts with: {api_key[:10]}...")
    logger.info(f"[EMAIL CONFIG] FROM: {from_name} <{from_email}>")
    
    for attempt in range(max_retries):
        try:
            message = Mail(
                from_email=(from_email, from_name),
                to_emails=to_email,
                subject=subject,
                html_content=html_content
            )
            
            logger.info(f"[EMAIL SEND] Attempt {attempt + 1}/{max_retries} - Calling SendGrid API...")
            sg = SendGridAPIClient(api_key)
            response = sg.send(message)
            logger.info(f"[EMAIL SUCCESS] Email sent to {to_email}, status code: {response.status_code}, attempt: {attempt + 1}")
            return True
        except Exception as e:
            error_msg = str(e)
            logger.warning(f"[EMAIL FAIL] Attempt {attempt + 1}/{max_retries} failed for {to_email}: {error_msg}")
            
            # If 401 Unauthorized, API key is invalid - no point retrying
            if "401" in error_msg or "Unauthorized" in error_msg:
                logger.error(f"[EMAIL ERROR] SendGrid API key is INVALID or REVOKED. Please update SENDGRID_API_KEY in /app/backend/.env")
                return False
            
            if attempt < max_retries - 1:
                time.sleep(RETRY_DELAY_SECONDS * (attempt + 1))  # Exponential backoff
            else:
                logger.error(f"[EMAIL ERROR] Failed to send email to {to_email} after {max_retries} attempts: {error_msg}")
    return False


def send_email(to_email: str, subject: str, html_content: str):
    """Send email using SendGrid with retry logic"""
    logger.info(f"[EMAIL] send_email called - to: {to_email}, subject: {subject}")
    return send_email_with_retry(to_email, subject, html_content)


def send_booking_confirmation_email(client_email: str, client_name: str, professional_name: str, 
                                    service_name: str, booking_datetime: str, professional_phone: str):
    """Send booking confirmation email to client"""
    subject = f"{SUBJECT_PREFIX} Potvrda rezervacije"
    
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563EB;">Potvrda rezervacije</h1>
            <p>Poštovani/a {client_name},</p>
            <p>Vaša rezervacija je potvrđena!</p>
            
            <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h2 style="color: #0F172A; margin-top: 0;">Detalji rezervacije:</h2>
                <p><strong>Majstor:</strong> {professional_name}</p>
                <p><strong>Usluga:</strong> {service_name}</p>
                <p><strong>Datum i vrijeme:</strong> {booking_datetime}</p>
                <p><strong>Telefon majstora:</strong> {professional_phone}</p>
            </div>
            
            <p>Ako imate bilo kakvih pitanja, možete kontaktirati majstora direktno na navedeni broj telefona.</p>
            
            <p style="margin-top: 30px;">Srdačan pozdrav,<br>
            Tim Fiksiraj</p>
            
            <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 30px 0;">
            <p style="color: #64748B; font-size: 12px; text-align: center;">
                Ovo je automatska poruka. Molimo ne odgovarajte na ovaj email.
            </p>
        </body>
    </html>
    """
    
    return send_email(client_email, subject, html_content)


def send_booking_reminder_email(professional_email: str, professional_name: str, client_name: str,
                                client_phone: str, service_name: str, booking_datetime: str):
    """Send 4-hour reminder email to professional"""
    subject = f"{SUBJECT_PREFIX} Podsjetnik - Nadolazeća rezervacija za 4 sata"
    
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #F97316;">Podsjetnik na rezervaciju</h1>
            <p>Poštovani/a {professional_name},</p>
            <p>Podsjetnik da imate rezervaciju za približno 4 sata!</p>
            
            <div style="background-color: #FFF7ED; border: 2px solid #F97316; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h2 style="color: #0F172A; margin-top: 0;">Detalji rezervacije:</h2>
                <p><strong>Klijent:</strong> {client_name}</p>
                <p><strong>Telefon klijenta:</strong> {client_phone}</p>
                <p><strong>Usluga:</strong> {service_name}</p>
                <p><strong>Datum i vrijeme:</strong> {booking_datetime}</p>
            </div>
            
            <p>Molimo vas da provjerite lokaciju i pripremite potreban alat/materijal.</p>
            
            <p style="margin-top: 30px;">Srdačan pozdrav,<br>
            Tim Fiksiraj</p>
            
            <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 30px 0;">
            <p style="color: #64748B; font-size: 12px; text-align: center;">
                Ovo je automatska poruka. Molimo ne odgovarajte na ovaj email.
            </p>
        </body>
    </html>
    """
    
    return send_email(professional_email, subject, html_content)


def send_password_reset_email(to_email: str, reset_link: str, name: str):
    """Send password reset email"""
    subject = f"{SUBJECT_PREFIX} Resetiranje lozinke"
    
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563EB;">Resetiranje lozinke</h1>
            <p>Poštovani/a {name},</p>
            <p>Primili smo zahtjev za resetiranje vaše lozinke.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{reset_link}" 
                   style="background-color: #2563EB; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                    Resetiraj lozinku
                </a>
            </div>
            
            <p>Ili kopirajte sljedeći link u svoj preglednik:</p>
            <p style="background-color: #F8FAFC; padding: 10px; border-radius: 4px; word-break: break-all;">
                {reset_link}
            </p>
            
            <p style="color: #DC2626; font-weight: bold;">Ovaj link je valjan samo 1 sat.</p>
            
            <p>Ako niste zatražili resetiranje lozinke, možete zanemariti ovaj email.</p>
            
            <p style="margin-top: 30px;">Srdačan pozdrav,<br>
            Tim Fiksiraj</p>
            
            <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 30px 0;">
            <p style="color: #64748B; font-size: 12px; text-align: center;">
                Ovo je automatska poruka. Molimo ne odgovarajte na ovaj email.
            </p>
        </body>
    </html>
    """
    
    return send_email(to_email, subject, html_content)


def send_new_booking_notification_email(professional_email: str, professional_name: str, 
                                        client_name: str, client_phone: str, service_name: str, 
                                        booking_datetime: str, duration: int, price: float,
                                        description: str = None):
    """Send new booking notification email to professional"""
    subject = f"{SUBJECT_PREFIX} Nova rezervacija"
    
    description_section = ""
    if description:
        description_section = f"""
                <div style="background-color: #F0FDF4; border-left: 4px solid #10B981; padding: 12px; margin: 15px 0; border-radius: 4px;">
                    <p style="margin: 0; font-weight: bold; color: #065F46;">Opis problema:</p>
                    <p style="margin: 8px 0 0 0; color: #0F172A;">{description}</p>
                </div>
        """
    
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563EB;">Nova rezervacija!</h1>
            <p>Poštovani/a {professional_name},</p>
            <p>Primili ste novu rezervaciju putem platforme Fiksiraj.</p>
            
            <div style="background-color: #F0F9FF; border: 2px solid #2563EB; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h2 style="color: #0F172A; margin-top: 0;">Detalji rezervacije:</h2>
                <p><strong>Klijent:</strong> {client_name}</p>
                <p><strong>Telefon klijenta:</strong> {client_phone}</p>
                <p><strong>Usluga:</strong> {service_name}</p>
                <p><strong>Datum i vrijeme:</strong> {booking_datetime}</p>
                <p><strong>Trajanje:</strong> {duration} minuta</p>
                <p><strong>Cijena:</strong> {price:.2f} EUR</p>
                {description_section}
            </div>
            
            <p style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px; margin: 20px 0;">
                <strong>Molimo vas da potvrdite ili odbijete ovu rezervaciju unutar aplikacije.</strong>
            </p>
            
            <p>Prijavite se na platformu kako biste upravljali rezervacijom.</p>
            
            <p style="margin-top: 30px;">Srdačan pozdrav,<br>
            Tim Fiksiraj</p>
            
            <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 30px 0;">
            <p style="color: #64748B; font-size: 12px; text-align: center;">
                Ovo je automatska poruka. Molimo ne odgovarajte na ovaj email.
            </p>
        </body>
    </html>
    """
    
    return send_email(professional_email, subject, html_content)
    


def send_booking_cancellation_email(client_email: str, client_name: str, professional_name: str,
                                    service_name: str, booking_datetime: str, professional_phone: str):
    """Send booking cancellation email to client"""
    subject = f"{SUBJECT_PREFIX} Rezervacija otkazana"
    
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #DC2626;">Rezervacija otkazana</h1>
            <p>Poštovani/a {client_name},</p>
            <p>Vaša rezervacija je nažalost otkazana od strane majstora.</p>
            
            <div style="background-color: #FEF2F2; border: 2px solid #DC2626; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h2 style="color: #0F172A; margin-top: 0;">Detalji otkazane rezervacije:</h2>
                <p><strong>Majstor:</strong> {professional_name}</p>
                <p><strong>Usluga:</strong> {service_name}</p>
                <p><strong>Datum i vrijeme:</strong> {booking_datetime}</p>
                <p><strong>Telefon majstora:</strong> {professional_phone}</p>
            </div>
            
            <p>Za dodatne informacije možete kontaktirati majstora direktno na navedeni broj telefona ili napraviti novu rezervaciju.</p>
            
            <p style="margin-top: 30px;">Srdačan pozdrav,<br>
            Tim Fiksiraj</p>
            
            <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 30px 0;">
            <p style="color: #64748B; font-size: 12px; text-align: center;">
                Ovo je automatska poruka. Molimo ne odgovarajte na ovaj email.
            </p>
        </body>
    </html>
    """
    
    return send_email(client_email, subject, html_content)


def send_review_request_email(client_email: str, client_name: str, professional_name: str,
                               service_name: str, review_link: str):
    """Send review request email to client after service completion"""
    subject = f"{SUBJECT_PREFIX} Ocijenite uslugu"
    
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563EB;">Kako ste zadovoljni uslugom?</h1>
            <p>Poštovani/a {client_name},</p>
            <p>Nadamo se da ste zadovoljni obavljenom uslugom. Vaše mišljenje nam je važno!</p>
            
            <div style="background-color: #F0F9FF; border: 2px solid #2563EB; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h2 style="color: #0F172A; margin-top: 0;">Detalji usluge:</h2>
                <p><strong>Majstor:</strong> {professional_name}</p>
                <p><strong>Usluga:</strong> {service_name}</p>
            </div>
            
            <p>Molimo vas da odvojite trenutak i ocijenite majstora. Vaša recenzija pomaže drugim korisnicima u pronalasku kvalitetnih majstora.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{review_link}" 
                   style="background-color: #2563EB; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
                    Ocijenite uslugu
                </a>
            </div>
            
            <p style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px; margin: 20px 0; border-radius: 4px;">
                <strong>Napomena:</strong> Link za recenziju vrijedi 30 dana od završetka usluge.
            </p>
            
            <p style="margin-top: 30px;">Srdačan pozdrav,<br>
            Tim Fiksiraj</p>
            
            <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 30px 0;">
            <p style="color: #64748B; font-size: 12px; text-align: center;">
                Ovo je automatska poruka. Molimo ne odgovarajte na ovaj email.
            </p>
        </body>
    </html>
    """
    
    return send_email(client_email, subject, html_content)


def send_review_reminder_email(client_email: str, client_name: str, professional_name: str,
                                service_name: str, review_link: str, days_remaining: int):
    """Send review reminder email to client"""
    subject = f"{SUBJECT_PREFIX} Podsjetnik - Ocijenite uslugu"
    
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #F97316;">Podsjetnik za recenziju</h1>
            <p>Poštovani/a {client_name},</p>
            <p>Primili ste uslugu od majstora <strong>{professional_name}</strong>, ali još niste ostavili recenziju.</p>
            
            <div style="background-color: #FFF7ED; border: 2px solid #F97316; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h2 style="color: #0F172A; margin-top: 0;">Detalji usluge:</h2>
                <p><strong>Majstor:</strong> {professional_name}</p>
                <p><strong>Usluga:</strong> {service_name}</p>
            </div>
            
            <p>Vaše mišljenje je važno! Recenzije pomažu drugim korisnicima pronaći pouzdane majstore.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{review_link}" 
                   style="background-color: #F97316; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
                    Ostavite recenziju
                </a>
            </div>
            
            <p style="background-color: #FEE2E2; border-left: 4px solid #DC2626; padding: 12px; margin: 20px 0; border-radius: 4px;">
                <strong>Važno:</strong> Link za recenziju ističe za <strong>{days_remaining} dana</strong>. Nakon toga više nećete moći ostaviti recenziju.
            </p>
            
            <p style="margin-top: 30px;">Srdačan pozdrav,<br>
            Tim Fiksiraj</p>
            
            <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 30px 0;">
            <p style="color: #64748B; font-size: 12px; text-align: center;">
                Ovo je automatska poruka. Molimo ne odgovarajte na ovaj email.
            </p>
        </body>
    </html>
    """
    
    return send_email(client_email, subject, html_content)

