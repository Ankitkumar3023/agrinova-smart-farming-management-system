"""
Main URL Configuration for agri_nova project.
Includes routing for the core admin site, internal application routes, 
and static/media file serving.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # ==============================================================================
    # SYSTEM CORE ADMIN
    # ==============================================================================
    path("admin/", admin.site.urls),

    # ==============================================================================
    # APPLICATION ROUTING LAYER (API & DASHBOARD)
    # ==============================================================================
    # Seamlessly forwards all routing to your decoupled api/urls.py file
    path("", include("api.urls")),
]

# ==============================================================================
# STATIC & MEDIA ASSETS SERVING (DEVELOPMENT ONLY)
# ==============================================================================
if settings.DEBUG:
    # Serve user-uploaded media files (Profile images, crop diagnostic pictures)
    urlpatterns += static(
        settings.MEDIA_URL, 
        document_root=settings.MEDIA_ROOT
    )
    
    # Serve compiled static files (CSS, Javascript framework nodes)
    urlpatterns += static(
        settings.STATIC_URL, 
        document_root=settings.STATIC_ROOT
    )