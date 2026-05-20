from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
import requests, random


# LOGIN
def login_view(request):
    if request.method == "POST":
        user = authenticate(
            request,
            username=request.POST.get("username"),
            password=request.POST.get("password")
        )

        if user:
            login(request, user)
            return redirect("/")
        else:
            return render(request, "login.html", {"error": "Invalid credentials"})

    return render(request, "login.html")


# REGISTER
def register_view(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")

        if not username or not password:
            return render(request, "register.html", {"error": "Fill all fields"})

        if User.objects.filter(username=username).exists():
            return render(request, "register.html", {"error": "User exists"})

        User.objects.create_user(username=username, password=password)
        return redirect("/login/")

    return render(request, "register.html")


# LOGOUT
def logout_view(request):
    logout(request)
    return redirect("/login/")


# HOME (Dashboard)
@login_required
def home(request):
    return render(request, "index.html")


# WEATHER
def weather_api(request):
    lat = request.GET.get("lat")
    lon = request.GET.get("lon")
    city = request.GET.get("city")

    # 🔥 If location given
    if lat and lon:
        weather = requests.get(
            f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true"
        ).json()

        data = weather["current_weather"]

        return JsonResponse({
            "temp": data["temperature"],
            "wind": data["windspeed"]
        })

    # 🔥 If city given
    if city:
        geo = requests.get(
            f"https://geocoding-api.open-meteo.com/v1/search?name={city}&count=1"
        ).json()

        if "results" not in geo:
            return JsonResponse({"temp": "N/A", "wind": "N/A"})

        lat = geo["results"][0]["latitude"]
        lon = geo["results"][0]["longitude"]

        weather = requests.get(
            f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true"
        ).json()

        data = weather["current_weather"]

        return JsonResponse({
            "temp": data["temperature"],
            "wind": data["windspeed"]
        })
        
# CROP
def crop_api(request):
    crops = ["Rice","Wheat","Maize","Sugarcane","Cotton","Soybean",
             "Tomato","Potato","Onion","Banana","Mango","Apple",
             "Orange","Grapes","Peas","Carrot","Cabbage","Chili",
             "Mustard","Barley"]

    return JsonResponse({"crop": random.choice(crops)})


# DISEASE (FAKE AI)
def disease_api(request):
    return JsonResponse({
        "disease": "Leaf Disease Detected 🌿 (AI simulated)"
    })


# VIDEO
def video_api(request):
    return JsonResponse({
        "video": "https://www.youtube.com/embed/1m5rX0Q5z8Y"
    })