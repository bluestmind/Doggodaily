from marshmallow import Schema, fields, validate, post_load, validates, ValidationError, pre_load
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from ..models import User, Story, Comment, GalleryItem, Tour, TourBooking, Analytics, SecurityLog, Message
import re
import bleach

# Import custom validators
def validate_password_strength(password):
    """Enhanced password validation using our custom validator"""
    from ..auth.utils import password_validator
    result = password_validator.validate(password)
    if not result['is_valid']:
        raise ValidationError(result['errors'])

def validate_clean_input(value):
    """Sanitize input to prevent XSS"""
    if isinstance(value, str):
        # Allow basic formatting but strip dangerous tags
        allowed_tags = ['b', 'i', 'u', 'em', 'strong', 'p', 'br']
        return bleach.clean(value, tags=allowed_tags, strip=True)
    return value

def validate_no_sql_injection(value):
    """Basic SQL injection detection"""
    if isinstance(value, str):
        dangerous_patterns = [
            r'(\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b|\bunion\b)',
            r'(--|\/\*|\*\/)',
            r'(\bexec\b|\bexecute\b)',
            r'(\bsp_\w+\b)'
        ]
        value_lower = value.lower()
        for pattern in dangerous_patterns:
            if re.search(pattern, value_lower):
                raise ValidationError('Input contains potentially dangerous content')
    return value

# Base schemas with security enhancements
class SecureBaseSchema(Schema):
    """Base schema with security validations"""
    
    @pre_load
    def sanitize_inputs(self, data, **kwargs):
        """Sanitize all string inputs"""
        if isinstance(data, dict):
            for key, value in data.items():
                if isinstance(value, str):
                    data[key] = validate_clean_input(value)
                    validate_no_sql_injection(data[key])
        return data

# Enhanced User Schemas
class UserSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = User
        load_instance = True
        exclude = ('password_hash', 'email_verification_token', 'reset_password_token', 
                  'two_factor_secret', 'backup_codes', 'password_history')

    email = fields.Email(required=True, validate=validate.Length(max=120))
    password = fields.Str(required=True, load_only=True, validate=validate_password_strength)
    confirm_password = fields.Str(required=True, load_only=True)
    
    @validates('name')
    def validate_name(self, value):
        if not value or len(value.strip()) < 2:
            raise ValidationError('Name must be at least 2 characters long')
        if len(value) > 100:
            raise ValidationError('Name cannot exceed 100 characters')
        # Check for suspicious patterns
        if re.search(r'[<>"\'\(\)\{\}]', value):
            raise ValidationError('Name contains invalid characters')
    
    @post_load
    def validate_passwords_match(self, data, **kwargs):
        if 'password' in data and 'confirm_password' in data:
            if data['password'] != data['confirm_password']:
                raise ValidationError('Passwords do not match')
        return data

class UserRegistrationSchema(SecureBaseSchema):
    name = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    email = fields.Email(required=True, validate=validate.Length(max=120))
    password = fields.Str(required=True, validate=validate_password_strength)
    confirm_password = fields.Str(required=True)
    privacy_accepted = fields.Bool(required=True)
    marketing_consent = fields.Bool(load_default=False)
    
    @validates('privacy_accepted')
    def validate_privacy_accepted(self, value):
        if not value:
            raise ValidationError('Privacy policy must be accepted')
    
    @post_load
    def validate_passwords_match(self, data, **kwargs):
        if data['password'] != data['confirm_password']:
            raise ValidationError('Passwords do not match')
        return data

class UserLoginSchema(SecureBaseSchema):
    email = fields.Email(required=True, validate=validate.Length(max=120))
    password = fields.Str(required=True, validate=validate.Length(min=1, max=128))
    two_fa_token = fields.Str(validate=validate.Length(min=6, max=8))
    remember_me = fields.Bool(load_default=False)
    device_fingerprint = fields.Str(validate=validate.Length(max=64))
    login_type = fields.Str(validate=validate.OneOf(['user', 'admin']), load_default='user')

class UserProfileSchema(SecureBaseSchema):
    name = fields.Str(validate=validate.Length(min=2, max=100))
    email = fields.Email(validate=validate.Length(max=120))
    avatar = fields.Url(validate=validate.Length(max=255))
    marketing_consent = fields.Bool()

class PasswordChangeSchema(SecureBaseSchema):
    current_password = fields.Str(required=True)
    new_password = fields.Str(required=True, validate=validate_password_strength)
    confirm_password = fields.Str(required=True)
    
    @post_load
    def validate_passwords_match(self, data, **kwargs):
        if data['new_password'] != data['confirm_password']:
            raise ValidationError('New passwords do not match')
        return data

class PasswordResetRequestSchema(SecureBaseSchema):
    email = fields.Email(required=True, validate=validate.Length(max=120))

class PasswordResetSchema(SecureBaseSchema):
    token = fields.Str(required=True, validate=validate.Length(min=32, max=64))
    password = fields.Str(required=True, validate=validate_password_strength)
    confirm_password = fields.Str(required=True)
    
    @post_load
    def validate_passwords_match(self, data, **kwargs):
        if data['password'] != data['confirm_password']:
            raise ValidationError('Passwords do not match')
        return data

# Two-Factor Authentication Schemas
class TwoFactorSetupSchema(SecureBaseSchema):
    password = fields.Str(required=True)  # Confirm password to setup 2FA

class TwoFactorVerifySchema(SecureBaseSchema):
    token = fields.Str(required=True, validate=validate.Length(min=6, max=8))
    
    @validates('token')
    def validate_token_format(self, value):
        if not re.match(r'^\d{6}$', value):
            raise ValidationError('Token must be 6 digits')

class TwoFactorDisableSchema(SecureBaseSchema):
    password = fields.Str(required=True)
    token = fields.Str(validate=validate.Length(min=6, max=8))  # Optional backup code

# Session Management Schemas
class SessionManagementSchema(SecureBaseSchema):
    session_id = fields.Int(required=True)
    action = fields.Str(required=True, validate=validate.OneOf(['end', 'extend']))

# Security Schemas
class SecurityLogSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = SecurityLog
        load_instance = True

class ChangePasswordSchema(SecureBaseSchema):
    current_password = fields.Str(required=True)
    new_password = fields.Str(required=True, validate=validate_password_strength)
    confirm_new_password = fields.Str(required=True)
    logout_all_sessions = fields.Bool(load_default=True)
    
    @post_load
    def validate_passwords_match(self, data, **kwargs):
        if data['new_password'] != data['confirm_new_password']:
            raise ValidationError('New passwords do not match')
        return data

# Enhanced Story Schemas with security
class StorySchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Story
        load_instance = True
        include_relationships = True

    author = fields.Nested(UserSchema, dump_only=True)
    tags = fields.List(fields.Str(validate=validate.Length(max=50)), load_default=[])
    
    @validates('title')
    def validate_title(self, value):
        if not value or len(value.strip()) < 3:
            raise ValidationError('Title must be at least 3 characters long')
        validate_no_sql_injection(value)
    
    @validates('content')
    def validate_content(self, value):
        if not value or len(value.strip()) < 10:
            raise ValidationError('Content must be at least 10 characters long')
        validate_no_sql_injection(value)
    
    @post_load
    def process_tags(self, data, **kwargs):
        if 'tags' in data:
            # Sanitize and validate tags
            clean_tags = []
            for tag in data['tags']:
                if isinstance(tag, str) and tag.strip():
                    clean_tag = validate_clean_input(tag.strip().lower())
                    if len(clean_tag) <= 50 and re.match(r'^[a-zA-Z0-9\s\-_]+$', clean_tag):
                        clean_tags.append(clean_tag)
            data['tags'] = ','.join(clean_tags[:10])  # Limit to 10 tags
        return data

class StoryCreateSchema(SecureBaseSchema):
    title = fields.Str(required=True, validate=validate.Length(min=3, max=255))
    content = fields.Str(required=True, validate=validate.Length(min=10, max=50000))
    preview = fields.Str(validate=validate.Length(max=500))
    category = fields.Str(validate=validate.Length(max=50))
    tags = fields.List(fields.Str(validate=validate.Length(max=50)))
    thumbnail = fields.Url(validate=validate.Length(max=255))
    is_featured = fields.Bool(load_default=False)

class StoryUpdateSchema(StoryCreateSchema):
    status = fields.Str(validate=validate.OneOf(['draft', 'published', 'archived']))
    
    @post_load
    def process_tags(self, data, **kwargs):
        if 'tags' in data:
            # Sanitize and validate tags
            clean_tags = []
            for tag in data['tags']:
                if isinstance(tag, str) and tag.strip():
                    clean_tag = validate_clean_input(tag.strip().lower())
                    if len(clean_tag) <= 50 and re.match(r'^[a-zA-Z0-9\s\-_]+$', clean_tag):
                        clean_tags.append(clean_tag)
            data['tags'] = ','.join(clean_tags[:10])  # Limit to 10 tags
        return data

# Enhanced Comment Schemas
class CommentSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Comment
        load_instance = True
        include_relationships = True

    author = fields.Nested(UserSchema, dump_only=True)
    
    @validates('content')
    def validate_content(self, value):
        if not value or len(value.strip()) < 1:
            raise ValidationError('Comment cannot be empty')
        if len(value) > 2000:
            raise ValidationError('Comment too long (max 2000 characters)')
        validate_no_sql_injection(value)

class CommentCreateSchema(SecureBaseSchema):
    content = fields.Str(required=True, validate=validate.Length(min=1, max=2000))
    parent_id = fields.Int()  # For nested comments

# Bulk Action Schemas
class BulkActionSchema(SecureBaseSchema):
    action = fields.Str(required=True, validate=validate.OneOf([
        'delete', 'activate', 'deactivate', 'feature', 'unfeature', 
        'make_admin', 'remove_admin', 'approve', 'reject'
    ]))
    item_ids = fields.List(fields.Int(), required=True, validate=validate.Length(min=1, max=100))
    reason = fields.Str(validate=validate.Length(max=255))  # For admin actions

# Search and Pagination Schemas
class SearchSchema(SecureBaseSchema):
    query = fields.Str(validate=validate.Length(min=1, max=255))
    category = fields.Str(validate=validate.Length(max=50))
    tags = fields.List(fields.Str(validate=validate.Length(max=50)))
    status = fields.Str(validate=validate.OneOf(['all', 'active', 'inactive', 'pending']))
    sort_by = fields.Str(validate=validate.OneOf(['created_at', 'updated_at', 'name', 'title', 'views', 'likes']))
    sort_order = fields.Str(validate=validate.OneOf(['asc', 'desc']), load_default='desc')
    
    @validates('query')
    def validate_search_query(self, value):
        if value:
            validate_no_sql_injection(value)
            # Remove potentially dangerous search terms
            if re.search(r'[<>"\'\(\)\{\}]', value):
                raise ValidationError('Search query contains invalid characters')

class PaginationSchema(SecureBaseSchema):
    page = fields.Int(validate=validate.Range(min=1, max=10000), load_default=1)
    per_page = fields.Int(validate=validate.Range(min=1, max=100), load_default=10)

# Admin Analytics Schema
class AnalyticsQuerySchema(SecureBaseSchema):
    metric = fields.Str(required=True, validate=validate.OneOf([
        'users', 'stories', 'logins', 'registrations', 'security_events'
    ]))
    start_date = fields.DateTime()
    end_date = fields.DateTime()
    granularity = fields.Str(validate=validate.OneOf(['hour', 'day', 'week', 'month']), load_default='day')

# Email Schemas
class EmailVerificationSchema(SecureBaseSchema):
    token = fields.Str(required=True, validate=validate.Length(min=32, max=64))

class ResendVerificationSchema(SecureBaseSchema):
    email = fields.Email(required=True, validate=validate.Length(max=120))

# Device and Session Info Schema
class DeviceInfoSchema(SecureBaseSchema):
    device_fingerprint = fields.Str(validate=validate.Length(max=64))
    user_agent = fields.Str(validate=validate.Length(max=500))
    timezone = fields.Str(validate=validate.Length(max=50))
    screen_resolution = fields.Str(validate=validate.Length(max=20))

# Initialize all schemas
user_schema = UserSchema()
users_schema = UserSchema(many=True)
user_registration_schema = UserRegistrationSchema()
user_login_schema = UserLoginSchema()
user_profile_schema = UserProfileSchema()
password_change_schema = PasswordChangeSchema()
password_reset_request_schema = PasswordResetRequestSchema()
password_reset_schema = PasswordResetSchema()

# 2FA schemas
two_factor_setup_schema = TwoFactorSetupSchema()
two_factor_verify_schema = TwoFactorVerifySchema()
two_factor_disable_schema = TwoFactorDisableSchema()

# Story schemas
story_schema = StorySchema()
stories_schema = StorySchema(many=True)
story_create_schema = StoryCreateSchema()
story_update_schema = StoryUpdateSchema()

# Comment schemas
comment_schema = CommentSchema()
comments_schema = CommentSchema(many=True)
comment_create_schema = CommentCreateSchema()

# Utility schemas
bulk_action_schema = BulkActionSchema()
search_schema = SearchSchema()
pagination_schema = PaginationSchema()
analytics_query_schema = AnalyticsQuerySchema()
security_log_schema = SecurityLogSchema()
security_logs_schema = SecurityLogSchema(many=True)
email_verification_schema = EmailVerificationSchema()
device_info_schema = DeviceInfoSchema()

# Placeholder schemas for other models (to be implemented)
gallery_item_schema = Schema()
gallery_items_schema = Schema()
gallery_upload_schema = Schema()
tour_schema = Schema()
tours_schema = Schema()
tour_create_schema = Schema()
tour_update_schema = Schema()
tour_booking_schema = Schema()
tour_bookings_schema = Schema()
tour_booking_create_schema = Schema()
analytics_schema = Schema()
message_schema = Schema()
messages_schema = Schema()
message_create_schema = Schema() 