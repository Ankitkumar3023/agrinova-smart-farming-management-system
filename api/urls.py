from django.contrib import admin
from django.urls import path
from api import views

urlpatterns = [
    # ================= ADMIN =================
    path("admin/", admin.site.urls),

    # ================= AUTH =================
    path("", views.home, name="home"),
    path("login/", views.login_view, name="login"),
    path("register/", views.register_view, name="register"),
    path("logout/", views.logout_view, name="logout"),

    # ================= PROFILE =================
    path("profile/", views.profile_view, name="profile"),
    path("edit-profile/", views.edit_profile, name="edit_profile"),
    path("profile/<str:username>/", views.public_profile, name="public_profile"),

    # ================= FARMS & CROPS =================
    path("farms/", views.farms_view, name="farms"),
    path("add-farm/", views.add_farm, name="add_farm"),
    path("farm/<int:farm_id>/", views.farm_detail, name="farm_detail"),
    path("edit-farm/<int:farm_id>/", views.edit_farm, name="edit_farm"),
    path("delete-farm/<int:farm_id>/", views.delete_farm, name="delete_farm"),
    
    path("add-crop/", views.add_crop, name="add_crop"),
    path("edit-crop/<int:crop_id>/", views.edit_crop, name="edit_crop"),
    path("delete-crop/<int:crop_id>/", views.delete_crop, name="delete_crop"),

    # ================= PAGES =================
    path("weather-page/", views.weather_page, name="weather_page"),
    path("market-page/", views.market_page, name="market_page"),
    path("schemes-page/", views.schemes_page, name="schemes_page"),
    path("community/", views.community_page, name="community"),
    path("messages/", views.messages_page, name="messages_page"),

    # ================= COMMUNITY ACTIONS =================
    path("post/create/", views.create_post, name="create_post"),
    path("post/like/<int:post_id>/", views.toggle_like, name="toggle_like"),
    path("post/comment/<int:post_id>/", views.add_comment, name="add_comment"),
    path("user/follow/<str:username>/", views.toggle_follow, name="toggle_follow"),

    # ================= CORE DATA APIs =================
    path("api/weather/", views.weather_api, name="weather_api"),
    path("api/market/", views.market_api, name="market_api"),
    path("api/messages/<str:username>/", views.get_messages, name="get_messages"),
    path("api/messages/<str:username>/send/", views.send_message, name="send_message"),
    path("api/notifications/", views.notifications_api, name="notifications_api"),

    # ================= AI ADVICE ENGINE APIs =================
    path("api/ai/weather-advice/", views.ai_weather_advice, name="ai_weather_advice"),
    path("api/ai/market-advice/", views.ai_market_advice, name="ai_market_advice"),
    path("api/ai/crop-scan/", views.ai_crop_scan, name="ai_crop_scan"),
]