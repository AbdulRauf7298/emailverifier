"""
Core email verification service.

Performs:
- Syntax validation
- MX/domain check
- SMTP mailbox check
- Disposable/temporary email detection
- Role-based & catch-all domain detection
- Deliverability scoring (0-100)
"""
import re
import socket
import asyncio
import smtplib
import logging
from typing import Optional, Tuple
import dns.resolver
import dns.exception
from app.utils.disposable_domains import is_disposable, is_role_based
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# RFC 5322 compliant email regex
EMAIL_REGEX = re.compile(
    r"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+"
    r"@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?"
    r"(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$"
)

COMMON_DOMAIN_TYPOS = {
    "gmial.com": "gmail.com",
    "gmal.com": "gmail.com",
    "gnail.com": "gmail.com",
    "gmail.co": "gmail.com",
    "hotmial.com": "hotmail.com",
    "hotmai.com": "hotmail.com",
    "yahooo.com": "yahoo.com",
    "yaho.com": "yahoo.com",
    "outloook.com": "outlook.com",
    "outlok.com": "outlook.com",
}


def validate_syntax(email: str) -> Tuple[bool, Optional[str]]:
    """Validate email syntax and suggest corrections for common typos."""
    email = email.strip()
    if not EMAIL_REGEX.match(email):
        return False, None
    parts = email.split("@")
    if len(parts) != 2:
        return False, None
    local, domain = parts
    # Require at least one dot in the domain (i.e. a TLD)
    if "." not in domain:
        return False, None
    # Check for common typos in the domain
    suggestion = None
    if domain.lower() in COMMON_DOMAIN_TYPOS:
        suggestion = f"{local}@{COMMON_DOMAIN_TYPOS[domain.lower()]}"
    return True, suggestion


async def check_mx_records(domain: str) -> bool:
    """Check if the domain has valid MX records."""
    try:
        loop = asyncio.get_event_loop()
        answers = await loop.run_in_executor(
            None,
            lambda: dns.resolver.resolve(domain, "MX", lifetime=5)
        )
        return len(answers) > 0
    except (dns.exception.DNSException, Exception):
        # Try A record as fallback
        try:
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None,
                lambda: dns.resolver.resolve(domain, "A", lifetime=5)
            )
            return True
        except Exception:
            return False


async def get_mx_host(domain: str) -> Optional[str]:
    """Get the primary MX host for a domain."""
    try:
        loop = asyncio.get_event_loop()
        answers = await loop.run_in_executor(
            None,
            lambda: dns.resolver.resolve(domain, "MX", lifetime=5)
        )
        mx_records = sorted(answers, key=lambda r: r.preference)
        if mx_records:
            return str(mx_records[0].exchange).rstrip(".")
    except Exception:
        pass
    return None


async def check_smtp_mailbox(email: str, domain: str) -> Tuple[bool, bool]:
    """
    Attempt SMTP verification of the mailbox.
    Returns (is_valid, is_catch_all).
    """
    mx_host = await get_mx_host(domain)
    if not mx_host:
        return False, False

    is_valid = await _smtp_check(email, mx_host)
    # Catch-all check: verify a random non-existent address
    random_email = f"random-nonexistent-12345@{domain}"
    is_catch_all = await _smtp_check(random_email, mx_host)

    return is_valid, is_catch_all


async def _smtp_check(email: str, mx_host: str) -> bool:
    """Perform a low-level SMTP check for an email address."""
    loop = asyncio.get_event_loop()
    try:
        return await loop.run_in_executor(None, _smtp_check_sync, email, mx_host)
    except Exception:
        return False


def _smtp_check_sync(email: str, mx_host: str) -> bool:
    """Synchronous SMTP check (run in executor)."""
    try:
        with smtplib.SMTP(timeout=10) as smtp:
            smtp.connect(mx_host, 25)
            smtp.ehlo_or_helo_if_needed()
            smtp.mail("verify@emailverifier.saas")
            code, _ = smtp.rcpt(email)
            smtp.quit()
            return code == 250
    except smtplib.SMTPRecipientsRefused:
        return False
    except Exception:
        # If SMTP fails, we can't determine validity
        return False


def calculate_deliverability_score(
    is_valid_syntax: bool,
    has_mx: bool,
    is_smtp_valid: Optional[bool],
    is_disposable: bool,
    is_role_based: bool,
    is_catch_all: Optional[bool],
) -> float:
    """
    Calculate a deliverability score from 0 to 100.
    """
    if not is_valid_syntax:
        return 0.0

    score = 100.0

    if not has_mx:
        return 0.0

    if is_smtp_valid is False:
        score -= 60.0
    elif is_smtp_valid is None:
        score -= 10.0  # SMTP check failed, slight penalty

    if is_disposable:
        score -= 30.0

    if is_role_based:
        score -= 10.0

    if is_catch_all is True:
        score -= 10.0

    return max(0.0, min(100.0, score))


def determine_status(
    is_valid_syntax: bool,
    has_mx: Optional[bool],
    is_smtp_valid: Optional[bool],
    is_disposable: bool,
    deliverability_score: float,
) -> str:
    """Determine the overall status of the email."""
    if not is_valid_syntax or not has_mx:
        return "invalid"
    if is_disposable:
        return "risky"
    if is_smtp_valid is False:
        return "invalid"
    if deliverability_score >= 70:
        return "valid"
    if deliverability_score >= 40:
        return "risky"
    return "invalid"


async def verify_email(email: str) -> dict:
    """
    Full email verification pipeline.
    Returns a dict with all verification results.
    """
    email = email.strip().lower()

    # Step 1: Syntax check
    syntax_valid, suggestion = validate_syntax(email)
    if not syntax_valid:
        return {
            "email": email,
            "is_valid_syntax": False,
            "has_mx_records": None,
            "is_smtp_valid": None,
            "is_disposable": False,
            "is_role_based": False,
            "is_catch_all": None,
            "deliverability_score": 0.0,
            "status": "invalid",
            "suggested_correction": suggestion,
        }

    parts = email.split("@")
    local, domain = parts[0], parts[1]

    # Step 2: Disposable & role-based check
    disposable = is_disposable(domain)
    role_based = is_role_based(local)

    # Step 3: MX check
    has_mx = await check_mx_records(domain)

    # Step 4: SMTP check (only if MX exists)
    smtp_valid = None
    catch_all = None
    if has_mx:
        try:
            smtp_valid, catch_all = await asyncio.wait_for(
                check_smtp_mailbox(email, domain), timeout=15
            )
        except asyncio.TimeoutError:
            logger.warning(f"SMTP check timed out for {email}")
            smtp_valid = None
            catch_all = None

    # Step 5: Score calculation
    score = calculate_deliverability_score(
        syntax_valid, has_mx, smtp_valid, disposable, role_based, catch_all
    )

    # Step 6: Status determination
    status = determine_status(syntax_valid, has_mx, smtp_valid, disposable, score)

    return {
        "email": email,
        "is_valid_syntax": syntax_valid,
        "has_mx_records": has_mx,
        "is_smtp_valid": smtp_valid,
        "is_disposable": disposable,
        "is_role_based": role_based,
        "is_catch_all": catch_all,
        "deliverability_score": round(score, 2),
        "status": status,
        "suggested_correction": suggestion,
    }
