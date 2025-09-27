"""
Enhanced Analytics API Routes with comprehensive data tracking and analysis
"""
from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from datetime import datetime, timedelta
import logging
from sqlalchemy import func, text

from ...admin_security import admin_required
from ...models_analytics import (
    AnalyticsEvent, PageView, ContentInteraction, UserSession,
    ConversionEvent, PerformanceMetric, ABTestVariant, ABTestAssignment,
    HeatmapData, AnalyticsCalculator
)
from ...models import User, Story, GalleryItem, Tour, db
from ...extensions import db as ext_db

analytics_enhanced_bp = Blueprint('analytics_enhanced', __name__)
logger = logging.getLogger(__name__)

# Real-time Analytics Dashboard
@analytics_enhanced_bp.route('/dashboard', methods=['GET'])
@login_required
@admin_required()
def get_analytics_dashboard():
    """Get comprehensive analytics dashboard data"""
    try:
        days = int(request.args.get('days', 30))
        
        # Basic metrics
        total_users = AnalyticsCalculator.get_total_users(days)
        active_users = AnalyticsCalculator.get_active_users(days)
        total_sessions = AnalyticsCalculator.get_total_sessions(days)
        bounce_rate = AnalyticsCalculator.get_bounce_rate(days)
        avg_session_duration = AnalyticsCalculator.get_average_session_duration(days)
        
        # Content metrics
        total_stories = Story.query.filter(
            Story.created_at >= datetime.utcnow() - timedelta(days=days)
        ).count()
        
        total_gallery_items = GalleryItem.query.filter(
            GalleryItem.created_at >= datetime.utcnow() - timedelta(days=days)
        ).count()
        
        total_tours = Tour.query.filter(
            Tour.created_at >= datetime.utcnow() - timedelta(days=days)
        ).count()
        
        # Popular content
        popular_stories = ContentInteraction.get_popular_content('story', days, 5)
        popular_gallery = ContentInteraction.get_popular_content('gallery_item', days, 5)
        popular_tours = ContentInteraction.get_popular_content('tour', days, 5)
        
        # Conversion metrics
        total_conversions = ConversionEvent.query.filter(
            ConversionEvent.created_at >= datetime.utcnow() - timedelta(days=days)
        ).count()
        
        conversion_rate = AnalyticsCalculator.get_conversion_rate(days=days)
        
        # Real-time stats
        real_time = AnalyticsCalculator.get_real_time_stats()
        
        # Traffic sources
        traffic_sources = AnalyticsCalculator.get_traffic_sources(days, 10)
        
        # Device breakdown
        device_breakdown = AnalyticsCalculator.get_device_breakdown(days)
        
        # Geographic data
        geographic_data = AnalyticsCalculator.get_geographic_breakdown(days, 10)
        
        return jsonify({
            'success': True,
            'data': {
                'overview': {
                    'total_users': total_users,
                    'active_users': active_users,
                    'total_sessions': total_sessions,
                    'bounce_rate': bounce_rate,
                    'avg_session_duration': avg_session_duration,
                    'total_stories': total_stories,
                    'total_gallery_items': total_gallery_items,
                    'total_tours': total_tours,
                    'total_conversions': total_conversions,
                    'conversion_rate': conversion_rate
                },
                'popular_content': {
                    'stories': [{'content_id': s[0], 'interactions': s[1], 'unique_users': s[2]} for s in popular_stories],
                    'gallery': [{'content_id': g[0], 'interactions': g[1], 'unique_users': g[2]} for g in popular_gallery],
                    'tours': [{'content_id': t[0], 'interactions': t[1], 'unique_users': t[2]} for t in popular_tours]
                },
                'real_time': real_time,
                'traffic_sources': [{'source': t[0], 'sessions': t[1], 'users': t[2]} for t in traffic_sources],
                'device_breakdown': [{'device': d[0], 'sessions': d[1], 'users': d[2]} for d in device_breakdown],
                'geographic_data': [{'country': g[0], 'sessions': g[1], 'users': g[2]} for g in geographic_data]
            }
        })
        
    except Exception as e:
        logger.error(f"Analytics dashboard error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to load analytics dashboard'
        }), 500

# Page View Analytics
@analytics_enhanced_bp.route('/pageviews', methods=['GET'])
@login_required
@admin_required()
def get_page_view_analytics():
    """Get detailed page view analytics"""
    try:
        days = int(request.args.get('days', 30))
        
        # Daily page views
        daily_views = AnalyticsCalculator.get_page_views_by_day(days)
        
        # Top pages
        top_pages = AnalyticsCalculator.get_top_pages(days, 20)
        
        # Page performance metrics
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        performance_data = db.session.query(
            PerformanceMetric.page_url,
            func.avg(PerformanceMetric.load_time).label('avg_load_time'),
            func.avg(PerformanceMetric.first_contentful_paint).label('avg_fcp'),
            func.avg(PerformanceMetric.largest_contentful_paint).label('avg_lcp'),
            func.count(PerformanceMetric.id).label('sample_size')
        ).filter(
            PerformanceMetric.created_at >= cutoff_date
        ).group_by(PerformanceMetric.page_url).all()
        
        return jsonify({
            'success': True,
            'data': {
                'daily_views': [{'date': d[0].isoformat(), 'views': d[1]} for d in daily_views],
                'top_pages': [{'url': p[0], 'views': p[1], 'unique_views': p[2]} for p in top_pages],
                'performance': [{
                    'url': p[0],
                    'avg_load_time': float(p[1]) if p[1] else 0,
                    'avg_fcp': float(p[2]) if p[2] else 0,
                    'avg_lcp': float(p[3]) if p[3] else 0,
                    'sample_size': p[4]
                } for p in performance_data]
            }
        })
        
    except Exception as e:
        logger.error(f"Page view analytics error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to load page view analytics'
        }), 500

# User Behavior Analytics
@analytics_enhanced_bp.route('/user-behavior', methods=['GET'])
@login_required
@admin_required()
def get_user_behavior_analytics():
    """Get user behavior analytics"""
    try:
        days = int(request.args.get('days', 30))
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # User engagement metrics
        engagement_data = db.session.query(
            func.avg(UserSession.total_duration).label('avg_session_duration'),
            func.avg(UserSession.page_views).label('avg_pages_per_session'),
            func.sum(func.case([(UserSession.is_bounce == True, 1)])).label('bounce_sessions'),
            func.count(UserSession.id).label('total_sessions')
        ).filter(
            UserSession.started_at >= cutoff_date
        ).first()
        
        # Content interaction heatmap
        interaction_heatmap = db.session.query(
            ContentInteraction.content_type,
            ContentInteraction.interaction_type,
            func.count(ContentInteraction.id).label('count')
        ).filter(
            ContentInteraction.created_at >= cutoff_date
        ).group_by(
            ContentInteraction.content_type,
            ContentInteraction.interaction_type
        ).all()
        
        # User journey analysis
        user_journeys = db.session.query(
            PageView.page_url,
            func.lag(PageView.page_url).over(
                partition_by=PageView.session_id,
                order_by=PageView.created_at
            ).label('previous_page'),
            func.count().label('frequency')
        ).filter(
            PageView.created_at >= cutoff_date
        ).group_by(
            PageView.page_url,
            text('previous_page')
        ).having(
            text('previous_page IS NOT NULL')
        ).order_by(
            func.count().desc()
        ).limit(50).all()
        
        return jsonify({
            'success': True,
            'data': {
                'engagement': {
                    'avg_session_duration': float(engagement_data[0]) if engagement_data[0] else 0,
                    'avg_pages_per_session': float(engagement_data[1]) if engagement_data[1] else 0,
                    'bounce_rate': (float(engagement_data[2]) / float(engagement_data[3]) * 100) if engagement_data[3] > 0 else 0,
                    'total_sessions': engagement_data[3] or 0
                },
                'interaction_heatmap': [{
                    'content_type': i[0],
                    'interaction_type': i[1],
                    'count': i[2]
                } for i in interaction_heatmap],
                'user_journeys': [{
                    'from_page': j[1],
                    'to_page': j[0],
                    'frequency': j[2]
                } for j in user_journeys if j[1]]
            }
        })
        
    except Exception as e:
        logger.error(f"User behavior analytics error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to load user behavior analytics'
        }), 500

# Content Performance Analytics
@analytics_enhanced_bp.route('/content-performance', methods=['GET'])
@login_required
@admin_required()
def get_content_performance():
    """Get content performance analytics"""
    try:
        days = int(request.args.get('days', 30))
        content_type = request.args.get('type', 'all')  # story, gallery_item, tour, or all
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # Base query for content interactions
        query = db.session.query(
            ContentInteraction.content_type,
            ContentInteraction.content_id,
            ContentInteraction.interaction_type,
            func.count(ContentInteraction.id).label('total_interactions'),
            func.count(func.distinct(ContentInteraction.user_id)).label('unique_users'),
            func.avg(ContentInteraction.duration).label('avg_duration')
        ).filter(
            ContentInteraction.created_at >= cutoff_date
        )
        
        if content_type != 'all':
            query = query.filter(ContentInteraction.content_type == content_type)
        
        content_stats = query.group_by(
            ContentInteraction.content_type,
            ContentInteraction.content_id,
            ContentInteraction.interaction_type
        ).all()
        
        # Get content details
        content_details = {}
        
        # Get story details
        story_ids = [s[1] for s in content_stats if s[0] == 'story']
        if story_ids:
            stories = Story.query.filter(Story.id.in_(story_ids)).all()
            content_details.update({f"story_{s.id}": {'title': s.title, 'type': 'story'} for s in stories})
        
        # Get gallery details
        gallery_ids = [g[1] for g in content_stats if g[0] == 'gallery_item']
        if gallery_ids:
            gallery_items = GalleryItem.query.filter(GalleryItem.id.in_(gallery_ids)).all()
            content_details.update({f"gallery_item_{g.id}": {'title': g.title, 'type': 'gallery_item'} for g in gallery_items})
        
        # Get tour details
        tour_ids = [t[1] for t in content_stats if t[0] == 'tour']
        if tour_ids:
            tours = Tour.query.filter(Tour.id.in_(tour_ids)).all()
            content_details.update({f"tour_{t.id}": {'title': t.title, 'type': 'tour'} for t in tours})
        
        # Format response
        performance_data = []
        for stat in content_stats:
            content_key = f"{stat[0]}_{stat[1]}"
            content_info = content_details.get(content_key, {'title': f"Unknown {stat[0]}", 'type': stat[0]})
            
            performance_data.append({
                'content_type': stat[0],
                'content_id': stat[1],
                'content_title': content_info['title'],
                'interaction_type': stat[2],
                'total_interactions': stat[3],
                'unique_users': stat[4],
                'avg_duration': float(stat[5]) if stat[5] else 0
            })
        
        return jsonify({
            'success': True,
            'data': {
                'content_performance': performance_data,
                'summary': {
                    'total_content_items': len(set(f"{s[0]}_{s[1]}" for s in content_stats)),
                    'total_interactions': sum(s[3] for s in content_stats),
                    'unique_users_engaged': len(set(s[4] for s in content_stats))
                }
            }
        })
        
    except Exception as e:
        logger.error(f"Content performance analytics error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to load content performance analytics'
        }), 500

# Event Tracking API
@analytics_enhanced_bp.route('/track-event', methods=['POST'])
def track_event():
    """Track custom analytics events"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['event_type', 'event_category', 'event_action']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'{field} is required'
                }), 400
        
        # Get user and session info
        user_id = current_user.id if current_user.is_authenticated else None
        session_id = data.get('session_id', 'anonymous')
        
        # Get request info
        ip_address = request.remote_addr
        user_agent = request.headers.get('User-Agent')
        
        # Create analytics event
        event = AnalyticsEvent(
            user_id=user_id,
            session_id=session_id,
            event_type=data['event_type'],
            event_category=data['event_category'],
            event_action=data['event_action'],
            event_label=data.get('event_label'),
            page_url=data.get('page_url'),
            referrer_url=data.get('referrer_url'),
            user_agent=user_agent,
            ip_address=ip_address,
            device_type=data.get('device_type'),
            browser=data.get('browser'),
            os=data.get('os'),
            screen_resolution=data.get('screen_resolution'),
            country=data.get('country'),
            city=data.get('city'),
            duration=data.get('duration'),
            metadata=data.get('metadata')
        )
        
        db.session.add(event)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Event tracked successfully'
        })
        
    except Exception as e:
        logger.error(f"Event tracking error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to track event'
        }), 500

# Page View Tracking
@analytics_enhanced_bp.route('/track-pageview', methods=['POST'])
def track_pageview():
    """Track page views"""
    try:
        data = request.get_json()
        
        if not data.get('page_url'):
            return jsonify({
                'success': False,
                'message': 'page_url is required'
            }), 400
        
        user_id = current_user.id if current_user.is_authenticated else None
        session_id = data.get('session_id', 'anonymous')
        
        # Create page view record
        page_view = PageView(
            user_id=user_id,
            session_id=session_id,
            page_url=data['page_url'],
            page_title=data.get('page_title'),
            referrer_url=data.get('referrer_url'),
            time_on_page=data.get('time_on_page'),
            device_info=data.get('device_info'),
            location_info=data.get('location_info')
        )
        
        db.session.add(page_view)
        
        # Update or create user session
        session = UserSession.query.filter_by(session_id=session_id).first()
        if session:
            session.update_activity()
            session.page_views += 1
        else:
            session = UserSession(
                session_id=session_id,
                user_id=user_id,
                ip_address=request.remote_addr,
                user_agent=request.headers.get('User-Agent'),
                device_type=data.get('device_info', {}).get('type'),
                browser=data.get('device_info', {}).get('browser'),
                os=data.get('device_info', {}).get('os'),
                landing_page=data['page_url'],
                page_views=1
            )
            db.session.add(session)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Page view tracked successfully'
        })
        
    except Exception as e:
        logger.error(f"Page view tracking error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to track page view'
        }), 500

# Content Interaction Tracking
@analytics_enhanced_bp.route('/track-interaction', methods=['POST'])
def track_content_interaction():
    """Track content interactions"""
    try:
        data = request.get_json()
        
        required_fields = ['content_type', 'content_id', 'interaction_type']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'{field} is required'
                }), 400
        
        user_id = current_user.id if current_user.is_authenticated else None
        session_id = data.get('session_id', 'anonymous')
        
        # Create content interaction record
        interaction = ContentInteraction(
            user_id=user_id,
            content_type=data['content_type'],
            content_id=data['content_id'],
            interaction_type=data['interaction_type'],
            session_id=session_id,
            duration=data.get('duration'),
            scroll_depth=data.get('scroll_depth'),
            click_coordinates=data.get('click_coordinates'),
            metadata=data.get('metadata')
        )
        
        db.session.add(interaction)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Interaction tracked successfully'
        })
        
    except Exception as e:
        logger.error(f"Interaction tracking error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to track interaction'
        }), 500

# Performance Metrics
@analytics_enhanced_bp.route('/track-performance', methods=['POST'])
def track_performance():
    """Track performance metrics"""
    try:
        data = request.get_json()
        
        if not data.get('page_url'):
            return jsonify({
                'success': False,
                'message': 'page_url is required'
            }), 400
        
        session_id = data.get('session_id', 'anonymous')
        
        # Create performance metric record
        metric = PerformanceMetric(
            session_id=session_id,
            page_url=data['page_url'],
            load_time=data.get('load_time'),
            dom_content_loaded=data.get('dom_content_loaded'),
            first_contentful_paint=data.get('first_contentful_paint'),
            largest_contentful_paint=data.get('largest_contentful_paint'),
            first_input_delay=data.get('first_input_delay'),
            cumulative_layout_shift=data.get('cumulative_layout_shift'),
            connection_type=data.get('connection_type'),
            server_response_time=data.get('server_response_time')
        )
        
        db.session.add(metric)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Performance metrics tracked successfully'
        })
        
    except Exception as e:
        logger.error(f"Performance tracking error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to track performance metrics'
        }), 500

# Export Analytics Data
@analytics_enhanced_bp.route('/export', methods=['GET'])
@login_required
@admin_required()
def export_analytics():
    """Export analytics data to CSV/JSON"""
    try:
        export_type = request.args.get('type', 'events')  # events, pageviews, sessions, interactions
        format_type = request.args.get('format', 'json')  # json, csv
        days = int(request.args.get('days', 30))
        
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        if export_type == 'events':
            data = AnalyticsEvent.query.filter(
                AnalyticsEvent.created_at >= cutoff_date
            ).all()
            export_data = [event.to_dict() for event in data]
        
        elif export_type == 'pageviews':
            data = PageView.query.filter(
                PageView.created_at >= cutoff_date
            ).all()
            export_data = [{'id': pv.id, 'user_id': pv.user_id, 'page_url': pv.page_url, 
                          'time_on_page': pv.time_on_page, 'created_at': pv.created_at.isoformat()} 
                         for pv in data]
        
        elif export_type == 'sessions':
            data = UserSession.query.filter(
                UserSession.started_at >= cutoff_date
            ).all()
            export_data = [{'session_id': s.session_id, 'user_id': s.user_id, 'device_type': s.device_type,
                          'total_duration': s.total_duration, 'page_views': s.page_views,
                          'is_bounce': s.is_bounce, 'started_at': s.started_at.isoformat()} 
                         for s in data]
        
        elif export_type == 'interactions':
            data = ContentInteraction.query.filter(
                ContentInteraction.created_at >= cutoff_date
            ).all()
            export_data = [{'user_id': i.user_id, 'content_type': i.content_type, 
                          'content_id': i.content_id, 'interaction_type': i.interaction_type,
                          'duration': i.duration, 'created_at': i.created_at.isoformat()} 
                         for i in data]
        
        else:
            return jsonify({
                'success': False,
                'message': 'Invalid export type'
            }), 400
        
        return jsonify({
            'success': True,
            'data': export_data,
            'total_records': len(export_data),
            'export_type': export_type,
            'date_range': {
                'from': cutoff_date.isoformat(),
                'to': datetime.utcnow().isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Analytics export error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to export analytics data'
        }), 500