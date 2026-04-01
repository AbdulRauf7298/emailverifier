"""Known disposable/temporary email domain list."""

DISPOSABLE_DOMAINS = {
    "mailinator.com", "guerrillamail.com", "tempmail.com", "throwaway.email",
    "temp-mail.org", "fakeinbox.com", "sharklasers.com", "guerrillamailblock.com",
    "grr.la", "guerrillamail.info", "guerrillamail.biz", "guerrillamail.de",
    "guerrillamail.net", "guerrillamail.org", "spam4.me", "yopmail.com",
    "yopmail.fr", "cool.fr.nf", "jetable.fr.nf", "nospam.ze.tc", "nomail.xl.cx",
    "mega.zik.dj", "speed.1s.fr", "courriel.fr.nf", "moncourrier.fr.nf",
    "monemail.fr.nf", "monmail.fr.nf", "trashmail.com", "trashmail.me",
    "trashmail.net", "trashmail.org", "trashmail.at", "trashmail.io",
    "trashmail.xyz", "dispostable.com", "spamgourmet.com", "spamgourmet.net",
    "maildrop.cc", "mailnull.com", "mailnesia.com", "spamfree24.org",
    "antispam.de", "discard.email", "spamherelots.com", "spamhere.host",
    "anonaddy.com", "spamex.com", "spamoff.de", "tempinbox.com",
    "throwam.com", "filzmail.com", "sogetthis.com", "spamevader.com",
    "despam.it", "e4ward.com", "myspaceinc.com", "myspaceinc.net",
    "objectmail.com", "ownmail.net", "petml.com", "sharedmailbox.org",
    "spamfree.eu", "super-auswahl.de", "tempemail.net", "tempthe.net",
    "throwam.com", "uggsrock.com", "xn--0-6cdj3aflg.com", "beefmilk.com",
    "binkmail.com", "bspamfree.org", "bugmenot.com", "chogmail.com",
    "cool.fr.nf", "deadaddress.com", "devnullmail.com", "dispostable.com",
    "dodgeit.com", "dodgemail.de", "dontreg.com", "dontsendmespam.de",
}

ROLE_BASED_PREFIXES = {
    "admin", "administrator", "webmaster", "hostmaster", "postmaster",
    "abuse", "noc", "security", "info", "help", "support", "contact",
    "sales", "billing", "marketing", "no-reply", "noreply", "donotreply",
    "do-not-reply", "newsletter", "notifications", "alerts", "news",
    "service", "services", "mail", "email", "mailer", "smtp", "office",
    "enquiries", "enquiry", "careers", "jobs", "hr", "legal", "privacy",
    "feedback", "hello", "team", "press", "media", "partners", "api",
}


def is_disposable(domain: str) -> bool:
    """Check if the domain is a known disposable email provider."""
    return domain.lower() in DISPOSABLE_DOMAINS


def is_role_based(local_part: str) -> bool:
    """Check if the email local part is a role-based address."""
    return local_part.lower() in ROLE_BASED_PREFIXES
