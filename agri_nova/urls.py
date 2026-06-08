from django.urls import path
from . import views

urlpatterns = [

    path("", views.home, name="home"),

    path("login/", views.login_view, name="login"),
    path("register/", views.register_view, name="register"),
    path("logout/", views.logout_view, name="logout"),

    path("profile/", views.profile_view, name="profile"),

    path("farms/", views.farms_view, name="farms"),
    path("add-farm/", views.add_farm, name="add_farm"),
    path("add-crop/", views.add_crop, name="add_crop"),

    path("weather-page/", views.weather_page, name="weather"),
    path("market-page/", views.market_page, name="market"),
    path("schemes-page/", views.schemes_page, name="schemes"),

    path("community/", views.community_page, name="community"),
    path("post/create/", views.create_post, name="create_post"),

    path("api/weather/", views.weather_api),
    path("api/market/", views.market_api),
]