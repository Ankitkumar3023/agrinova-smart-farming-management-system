import os
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# ==============================================================================
# SECURITY CONFIGURATION
# ==============================================================================

SECRET_KEY = "django-insecure-your-production-safe-key-here"

# Set to False in production environments
DEBUG = True

ALLOWED_HOSTS = ["*"]


# ==============================================================================
# APPLICATION DEFINITION
# ==============================================================================

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    
    # Internal Project Apps
    "api.apps.ApiConfig", 
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# CORRECTED: Changed from 'core.urls' to 'agri_nova.urls'
ROOT_URLCONF = "agri_nova.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [os.path.join(BASE_DIR, "templates")],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# CORRECTED: Changed from 'core.wsgi...' to 'agri_nova.wsgi...'
WSGI_APPLICATION = "agri_nova.wsgi.application"


# ==============================================================================
# DATABASE ROUTING CONFIGURATION
# ==============================================================================

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}


# ==============================================================================
# AUTHENTICATION & PASSWORD VALIDATION
# ==============================================================================

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LOGIN_URL = "login"
LOGIN_REDIRECT_URL = "home"
LOGOUT_REDIRECT_URL = "login"


# ==============================================================================
# INTERNATIONALIZATION (REGIONAL SETTINGS)
# ==============================================================================

LANGUAGE_CODE = "en-us"

# Configured to Indian Standard Time (IST) to match APMC mandi and regional weather updates
TIME_ZONE = "Asia/Kolkata"

USE_I18N = True

USE_TZ = True


# ==============================================================================
# STATIC AND MEDIA ASSETS CONFIGURATION (IMAGE UPLOADS & DICTIONARIES)
# ==============================================================================

# Static Asset Configurations
STATIC_URL = "static/"
STATICFILES_DIRS = [os.path.join(BASE_DIR, "static")]
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")

# Media Asset Configurations (Handles profile avatars, post attachments, and leaf diagnostics)
MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "media")


# ==============================================================================
# SYSTEM AUTO-PRIMARY KEY GENERATION
# ==============================================================================

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"