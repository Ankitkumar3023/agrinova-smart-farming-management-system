from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


# ==============================================================================
# FARMER PROFILE
# ==============================================================================

class FarmerProfile(models.Model):
    """
    Extends the built-in Django User model with agricultural metadata and social 
    networking properties.
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile"
    )
    phone = models.CharField(max_length=15, blank=True)
    village = models.CharField(max_length=100, blank=True)
    district = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    bio = models.TextField(blank=True)
    profile_image = models.ImageField(
        upload_to="profiles/",
        blank=True,
        null=True,
        default="profiles/default.png"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} Profile"

    @property
    def follower_count(self) -> int:
        return Follow.objects.filter(following=self.user).count()

    @property
    def following_count(self) -> int:
        return Follow.objects.filter(follower=self.user).count()

    @property
    def post_count(self) -> int:
        return Post.objects.filter(user=self.user).count()


# ==============================================================================
# FARM (LAND NODES)
# ==============================================================================

class Farm(models.Model):
    """
    Represents an independent segment of agricultural land managed by a farmer.
    """
    SOIL_CHOICES = [
        ("alluvial", "Alluvial"),
        ("black", "Black Cotton"),
        ("red", "Red & Laterite"),
        ("sandy", "Sandy"),
        ("clay", "Clay"),
        ("loamy", "Loamy"),
        ("other", "Other"),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="farms"
    )
    farm_name = models.CharField(max_length=100)
    location = models.CharField(max_length=200)
    area = models.FloatField(help_text="Area in acres")
    soil_type = models.CharField(max_length=20, choices=SOIL_CHOICES, default="loamy")
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.farm_name} ({self.user.username})"

    @property
    def total_revenue(self) -> float:
        return self.crops.aggregate(
            total=models.Sum("revenue")
        )["total"] or 0.0

    @property
    def total_production(self) -> float:
        return self.crops.aggregate(
            total=models.Sum("production")
        )["total"] or 0.0

    @property
    def crop_count(self) -> int:
        return self.crops.count()


# ==============================================================================
# CROP
# ==============================================================================

class Crop(models.Model):
    """
    Tracks lifecycle metrics, yield totals, and revenues for individual crops 
    tied to a farm.
    """
    SEASON_CHOICES = [
        ("kharif", "Kharif"),
        ("rabi", "Rabi"),
        ("zaid", "Zaid"),
    ]

    STATUS_CHOICES = [
        ("sowing", "Sowing"),
        ("growing", "Growing"),
        ("harvested", "Harvested"),
        ("failed", "Failed"),
    ]

    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name="crops")
    crop_name = models.CharField(max_length=100)
    season = models.CharField(max_length=10, choices=SEASON_CHOICES, default="kharif")
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default="growing")
    production = models.FloatField(default=0.0, help_text="Production in kg")
    revenue = models.FloatField(default=0.0, help_text="Revenue in INR")
    sowing_date = models.DateField(null=True, blank=True)
    harvest_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.crop_name} — {self.farm.farm_name}"


# ==============================================================================
# AI SCAN LOG
# ==============================================================================

class AIScan(models.Model):
    """
    Caches Claude Engine outputs across weather, markets, and leaf diagnostics.
    """
    SCAN_TYPES = [
        ("leaf_diagnostic", "Disease Detection"),
        ("crop", "Crop Suggestion"),
        ("weather", "Weather Analysis"),
        ("market", "Market Analysis"),
        ("scheme", "Scheme Info"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="ai_scans")
    scan_type = models.CharField(max_length=20, choices=SCAN_TYPES)
    input_text = models.TextField(blank=True)
    result = models.TextField()
    image = models.ImageField(upload_to="scans/", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} — {self.get_scan_type_display()} — {self.created_at.date()}"


# ==============================================================================
# WEATHER CACHE
# ==============================================================================

class WeatherCache(models.Model):
    """
    Caches Open-Meteo external telemetry requests to reduce API throttling rate hits.
    """
    city = models.CharField(max_length=100, unique=True, db_index=True)
    temp = models.FloatField()
    wind = models.FloatField()
    humidity = models.FloatField(default=0.0)
    weather_code = models.IntegerField(default=0)
    description = models.CharField(max_length=100, blank=True)
    fetched_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.city} — {self.temp}°C"

    @property
    def is_fresh(self) -> bool:
        """Returns True if database records are less than 30 minutes old."""
        delta = timezone.now() - self.fetched_at
        return delta.total_seconds() < 1800


# ==============================================================================
# MARKET PRICE
# ==============================================================================

class MarketPrice(models.Model):
    """
    Aggregates global national trends and local APMC mandi spot-rates for commodities.
    """
    crop_name = models.CharField(max_length=100, db_index=True)
    price = models.IntegerField(help_text="Price per quintal in INR")
    unit = models.CharField(max_length=20, default="Quintal")
    mandi_name = models.CharField(max_length=100, default="National Average")
    state = models.CharField(max_length=100, default="India")
    change_pct = models.FloatField(default=0.0, help_text="% change from yesterday")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["crop_name"]
        unique_together = ["crop_name", "mandi_name"]

    def __str__(self):
        return f"{self.crop_name} ({self.mandi_name}) — ₹{self.price}/{self.unit}"


# ==============================================================================
# GOVERNMENT SCHEME
# ==============================================================================

class GovScheme(models.Model):
    """
    Provides catalog entries for local and central welfare initiatives.
    """
    CATEGORY_CHOICES = [
        ("financial", "Financial Aid"),
        ("insurance", "Crop Insurance"),
        ("credit", "Credit"),
        ("irrigation", "Irrigation"),
        ("soil", "Soil Health"),
        ("market", "Market Access"),
        ("organic", "Organic Farming"),
        ("tech", "Technology"),
    ]

    name = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    description = models.TextField()
    benefit = models.CharField(max_length=200)
    eligibility = models.TextField(blank=True)
    how_to_apply = models.TextField(blank=True)
    website = models.URLField(blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


# ==============================================================================
# COMMUNITY POST
# ==============================================================================

class Post(models.Model):
    """
    Feed items generated by the social system layout engine.
    """
    TAG_CHOICES = [
        ("update", "Crop Update"),
        ("market", "Market"),
        ("scheme", "Scheme"),
        ("tip", "Farming Tip"),
        ("question", "Question"),
        ("weather", "Weather"),
        ("tech", "Technology"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    caption = models.TextField()
    image = models.ImageField(upload_to="posts/", blank=True, null=True)
    tag = models.CharField(max_length=20, choices=TAG_CHOICES, default="update")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} — {self.created_at.date()}"

    @property
    def like_count(self) -> int:
        return self.likes.count()

    @property
    def comment_count(self) -> int:
        return self.comments.count()


# ==============================================================================
# COMMENT
# ==============================================================================

class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="comments")
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.user.username} on Post#{self.post.id}"


# ==============================================================================
# LIKE
# ==============================================================================

class Like(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="likes")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="likes")

    class Meta:
        unique_together = ["post", "user"]

    def __str__(self):
        return f"{self.user.username} likes Post#{self.post.id}"


# ==============================================================================
# FOLLOW SYSTEM
# ==============================================================================

class Follow(models.Model):
    follower = models.ForeignKey(User, related_name="following", on_delete=models.CASCADE)
    following = models.ForeignKey(User, related_name="followers", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["follower", "following"]

    def __str__(self):
        return f"{self.follower.username} → {self.following.username}"


# ==============================================================================
# CHAT / MESSAGE
# ==============================================================================

class Message(models.Model):
    sender = models.ForeignKey(User, related_name="sent_messages", on_delete=models.CASCADE)
    receiver = models.ForeignKey(User, related_name="received_messages", on_delete=models.CASCADE)
    message = models.TextField()
    is_read = models.BooleanField(default=False, db_index=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["timestamp"]

    def __str__(self):
        return f"{self.sender.username} → {self.receiver.username}: {self.message[:30]}"


# ==============================================================================
# NOTIFICATION SYSTEM
# ==============================================================================

class Notification(models.Model):
    NOTIF_TYPES = [
        ("like", "Like"),
        ("comment", "Comment"),
        ("follow", "Follow"),
        ("scheme", "Scheme Alert"),
        ("weather", "Weather Alert"),
        ("market", "Market Alert"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications", db_index=True)
    notif_type = models.CharField(max_length=20, choices=NOTIF_TYPES)
    message = models.CharField(max_length=300)
    is_read = models.BooleanField(default=False, db_index=True)
    link = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} — {self.notif_type}"