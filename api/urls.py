from django.contrib import admin
from django.urls import path
from api import views

urlpatterns = [
    path("admin/", admin.site.urls),

    path("", views.home),
    path("login/", views.login_view),
    path("register/", views.register_view),
    path("logout/", views.logout_view),

    path("weather/", views.weather_api),
    path("crop/", views.crop_api),
    path("disease/", views.disease_api),
    path("video/", views.video_api),
]