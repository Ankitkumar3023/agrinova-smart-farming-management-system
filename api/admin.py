from django.contrib import admin
from .models import (
    FarmerProfile, Farm, Crop, AIScan, WeatherCache,
    MarketPrice, GovScheme, Post, Comment, Like,
    Follow, Message, Notification
)

# ==============================================================================
# INLINES FOR RELATED RECORDS
# ==============================================================================

class CropInline(admin.TabularInline):
    model = Crop
    extra = 1
    fields = ("crop_name", "season", "status", "production", "revenue")


class CommentInline(admin.TabularInline):
    model = Comment
    extra = 0
    readonly_fields = ("user", "text", "created_at")
    can_delete = True


# ==============================================================================
# FARMER PROFILE
# ==============================================================================

@admin.register(FarmerProfile)
class FarmerProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "phone", "village", "district", "state", "created_at")
    search_fields = ("user__username", "user__email", "phone", "village", "district", "state")
    list_filter = ("state", "created_at")
    list_select_related = ("user",)
    readonly_fields = ("created_at", "updated_at")
    
    fieldsets = (
        ("User Credentials", {"fields": ("user",)}),
        ("Contact Details", {"fields": ("phone", "profile_image")}),
        ("Location Metadata", {"fields": ("village", "district", "state")}),
        ("Biography", {"fields": ("bio",)}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )


# ==============================================================================
# FARM (LAND NODES)
# ==============================================================================

@admin.register(Farm)
class FarmAdmin(admin.ModelAdmin):
    list_display = ("farm_name", "user", "location", "area", "soil_type", "crop_count", "created_at")
    list_filter = ("soil_type", "location", "created_at")
    search_fields = ("farm_name", "location", "user__username")
    list_select_related = ("user",)
    readonly_fields = ("created_at", "updated_at")
    inlines = [CropInline]
    
    fieldsets = (
        ("Ownership", {"fields": ("user", "farm_name")}),
        ("Geography & Topography", {"fields": ("location", "area", "soil_type")}),
        ("Coordinates (GPS)", {"fields": ("latitude", "longitude"), "classes": ("collapse",)}),
        ("Additional Records", {"fields": ("notes",)}),
        ("System Timestamps", {"fields": ("created_at", "updated_at")}),
    )


# ==============================================================================
# CROP
# ==============================================================================

@admin.register(Crop)
class CropAdmin(admin.ModelAdmin):
    list_display = ("crop_name", "farm", "season", "status", "production", "revenue", "sowing_date")
    list_filter = ("season", "status", "created_at")
    list_editable = ("status",)
    search_fields = ("crop_name", "farm__farm_name", "farm__user__username")
    list_select_related = ("farm__user",)
    readonly_fields = ("created_at",)
    
    fieldsets = (
        ("Farm Connection", {"fields": ("farm", "crop_name")}),
        ("Lifecycle & Strategy", {"fields": ("season", "status")}),
        ("Yield Data metrics", {"fields": ("production", "revenue")}),
        ("Timeline", {"fields": ("sowing_date", "harvest_date")}),
        ("Internal Logs", {"fields": ("notes", "created_at")}),
    )


# ==============================================================================
# AI SCAN LOG
# ==============================================================================

@admin.register(AIScan)
class AIScanAdmin(admin.ModelAdmin):
    list_display = ("user", "scan_type", "input_text_summary", "created_at")
    list_filter = ("scan_type", "created_at")
    search_fields = ("user__username", "input_text", "result")
    list_select_related = ("user",)
    readonly_fields = ("created_at",)
    
    @admin.display(description="Input Query", ordering="input_text")
    def input_text_summary(self, obj):
        return obj.input_text[:40] + "..." if len(obj.input_text) > 40 else obj.input_text


# ==============================================================================
# WEATHER CACHE
# ==============================================================================

@admin.register(WeatherCache)
class WeatherCacheAdmin(admin.ModelAdmin):
    list_display = ("city", "temp", "wind", "humidity", "weather_code", "fetched_at")
    search_fields = ("city", "description")
    readonly_fields = ("fetched_at",)


# ==============================================================================
# MARKET PRICE
# ==============================================================================

@admin.register(MarketPrice)
class MarketPriceAdmin(admin.ModelAdmin):
    list_display = ("crop_name", "price", "unit", "mandi_name", "state", "change_pct", "updated_at")
    list_filter = ("state", "updated_at")
    list_editable = ("price", "change_pct")
    search_fields = ("crop_name", "mandi_name", "state")
    readonly_fields = ("updated_at",)


# ==============================================================================
# GOVERNMENT SCHEME
# ==============================================================================

@admin.register(GovScheme)
class GovSchemeAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "benefit", "is_active", "created_at")
    list_filter = ("category", "is_active", "created_at")
    list_editable = ("is_active",)
    search_fields = ("name", "description", "benefit")
    readonly_fields = ("created_at",)


# ==============================================================================
# COMMUNITY POST
# ==============================================================================

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ("user", "tag", "like_count", "comment_count", "created_at")
    list_filter = ("tag", "created_at")
    search_fields = ("user__username", "caption")
    list_select_related = ("user",)
    readonly_fields = ("created_at",)
    inlines = [CommentInline]


# ==============================================================================
# COMMENT / LIKE / FOLLOW SYSTEM
# ==============================================================================

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("user", "post", "text_summary", "created_at")
    search_fields = ("user__username", "text", "post__caption")
    list_select_related = ("user", "post")
    readonly_fields = ("created_at",)
    
    @admin.display(description="Comment Excerpt", ordering="text")
    def text_summary(self, obj):
        return obj.text[:50] + "..." if len(obj.text) > 50 else obj.text


@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ("user", "post")
    search_fields = ("user__username", "post__caption")
    list_select_related = ("user", "post")


@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    list_display = ("follower", "following", "created_at")
    search_fields = ("follower__username", "following__username")
    list_select_related = ("follower", "following")
    readonly_fields = ("created_at",)


# ==============================================================================
# CHAT SYSTEM (MESSAGES)
# ==============================================================================

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("sender", "receiver", "message_summary", "is_read", "timestamp")
    list_filter = ("is_read", "timestamp")
    list_editable = ("is_read",)
    search_fields = ("sender__username", "receiver__username", "message")
    list_select_related = ("sender", "receiver")
    readonly_fields = ("timestamp",)

    @admin.display(description="Message Body", ordering="message")
    def message_summary(self, obj):
        return obj.message[:40] + "..." if len(obj.message) > 40 else obj.message


# ==============================================================================
# NOTIFICATION SYSTEM
# ==============================================================================

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("user", "notif_type", "message", "is_read", "created_at")
    list_filter = ("notif_type", "is_read", "created_at")
    list_editable = ("is_read",)
    search_fields = ("user__username", "message")
    list_select_related = ("user",)
    readonly_fields = ("created_at",)