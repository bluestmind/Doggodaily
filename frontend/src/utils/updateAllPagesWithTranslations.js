/**
 * Comprehensive page translation update utility
 * This file contains all the necessary updates to make pages fully translatable
 */

// Common patterns to replace across all pages
export const commonReplacements = [
  // Loading states
  { find: 'Loading...', replace: "t('common.loading')" },
  { find: 'Loading', replace: "t('common.loading')" },
  
  // Common actions
  { find: 'Save', replace: "t('common.save')" },
  { find: 'Cancel', replace: "t('common.cancel')" },
  { find: 'Delete', replace: "t('common.delete')" },
  { find: 'Edit', replace: "t('common.edit')" },
  { find: 'Add', replace: "t('common.add')" },
  { find: 'Update', replace: "t('common.update')" },
  { find: 'Submit', replace: "t('common.submit')" },
  { find: 'Search', replace: "t('common.search')" },
  { find: 'Filter', replace: "t('common.filter')" },
  { find: 'View', replace: "t('common.view')" },
  { find: 'Back', replace: "t('common.back')" },
  { find: 'Next', replace: "t('common.next')" },
  { find: 'Previous', replace: "t('common.previous')" },
  { find: 'Close', replace: "t('common.close')" },
  { find: 'Confirm', replace: "t('common.confirm')" },
  { find: 'Yes', replace: "t('common.yes')" },
  { find: 'No', replace: "t('common.no')" },
  { find: 'OK', replace: "t('common.ok')" },
  
  // Navigation
  { find: 'Home', replace: "t('nav.home')" },
  { find: 'Stories', replace: "t('nav.stories')" },
  { find: 'Gallery', replace: "t('nav.gallery')" },
  { find: 'Tours', replace: "t('nav.tours')" },
  { find: 'About', replace: "t('nav.about')" },
  { find: 'Contact', replace: "t('nav.contact')" },
  
  // Authentication
  { find: 'Login', replace: "t('auth.login')" },
  { find: 'Logout', replace: "t('auth.logout')" },
  { find: 'Sign Up', replace: "t('auth.signup')" },
  { find: 'Sign In', replace: "t('auth.login')" },
  { find: 'Email', replace: "t('auth.email')" },
  { find: 'Password', replace: "t('auth.password')" },
  { find: 'Confirm Password', replace: "t('auth.confirmPassword')" },
  { find: 'Forgot Password?', replace: "t('auth.forgotPassword')" },
  { find: 'Remember Me', replace: "t('auth.rememberMe')" },
  
  // Profile
  { find: 'Profile', replace: "t('profile.profile')" },
  { find: 'My Profile', replace: "t('profile.myProfile')" },
  { find: 'Edit Profile', replace: "t('profile.editProfile')" },
  { find: 'Personal Information', replace: "t('profile.personalInfo')" },
  { find: 'Security', replace: "t('profile.security')" },
  { find: 'Activity', replace: "t('profile.activity')" },
  { find: 'Preferences', replace: "t('profile.preferences')" },
  { find: 'Name', replace: "t('profile.name')" },
  { find: 'Bio', replace: "t('profile.bio')" },
  { find: 'Avatar', replace: "t('profile.avatar')" },
  
  // Stories
  { find: 'My Stories', replace: "t('stories.myStories')" },
  { find: 'Submit Story', replace: "t('stories.submitStory')" },
  { find: 'Story Title', replace: "t('stories.storyTitle')" },
  { find: 'Story Content', replace: "t('stories.storyContent')" },
  { find: 'Location', replace: "t('stories.location')" },
  { find: 'Category', replace: "t('stories.category')" },
  { find: 'Tags', replace: "t('stories.tags')" },
  { find: 'Media', replace: "t('stories.media')" },
  { find: 'Upload Media', replace: "t('stories.uploadMedia')" },
  { find: 'Remove Media', replace: "t('stories.removeMedia')" },
  { find: 'Submit for Review', replace: "t('stories.submitForReview')" },
  { find: 'Pending Review', replace: "t('stories.pendingReview')" },
  { find: 'Published', replace: "t('stories.published')" },
  { find: 'Rejected', replace: "t('stories.rejected')" },
  { find: 'Views', replace: "t('stories.views')" },
  { find: 'Likes', replace: "t('stories.likes')" },
  { find: 'Comments', replace: "t('stories.comments')" },
  
  // Admin
  { find: 'Admin', replace: "t('admin.admin')" },
  { find: 'Dashboard', replace: "t('admin.dashboard')" },
  { find: 'Analytics', replace: "t('admin.analytics')" },
  { find: 'Users', replace: "t('admin.users')" },
  { find: 'Communications', replace: "t('admin.communications')" },
  { find: 'Notifications', replace: "t('admin.notifications')" },
  { find: 'Settings', replace: "t('admin.settings')" },
  { find: 'Logs', replace: "t('admin.logs')" },
  { find: 'Overview', replace: "t('admin.overview')" },
  { find: 'Statistics', replace: "t('admin.statistics')" },
  { find: 'Total Users', replace: "t('admin.totalUsers')" },
  { find: 'Active Users', replace: "t('admin.activeUsers')" },
  { find: 'Total Stories', replace: "t('admin.totalStories')" },
  { find: 'Pending Stories', replace: "t('admin.pendingStories')" },
  { find: 'Recent Activity', replace: "t('admin.recentActivity')" },
  { find: 'System Health', replace: "t('admin.systemHealth')" },
  { find: 'User Management', replace: "t('admin.userManagement')" },
  { find: 'Content Moderation', replace: "t('admin.contentModeration')" },
  { find: 'System Settings', replace: "t('admin.systemSettings')" },
  { find: 'Approve', replace: "t('admin.approve')" },
  { find: 'Reject', replace: "t('admin.reject')" },
  { find: 'Pending', replace: "t('admin.pending')" },
  { find: 'Approved', replace: "t('admin.approved')" },
  { find: 'Review', replace: "t('admin.review')" },
  { find: 'Actions', replace: "t('admin.actions')" },
  
  // Validation messages
  { find: 'This field is required', replace: "t('validation.required')" },
  { find: 'Please enter a valid email address', replace: "t('validation.emailInvalid')" },
  { find: 'Password must be at least 8 characters long', replace: "t('validation.passwordTooShort')" },
  { find: 'Passwords do not match', replace: "t('validation.passwordsNoMatch')" },
  { find: 'Name must be at least 2 characters', replace: "t('validation.nameTooShort')" },
  { find: 'Name is required', replace: "t('validation.nameRequired')" },
  { find: 'Email is required', replace: "t('validation.emailRequired')" },
  { find: 'Password is required', replace: "t('validation.passwordRequired')" },
  { find: 'You must accept the terms and conditions', replace: "t('validation.termsRequired')" },
  
  // Notifications
  { find: 'Welcome to DoggoDaily!', replace: "t('notifications.welcome')" },
  { find: 'Profile updated successfully', replace: "t('notifications.profileUpdated')" },
  { find: 'Story submitted for review', replace: "t('notifications.storySubmitted')" },
  { find: 'Your story has been approved!', replace: "t('notifications.storyApproved')" },
  { find: 'Your story was rejected', replace: "t('notifications.storyRejected')" },
  { find: 'An error occurred', replace: "t('notifications.errorOccurred')" },
  { find: 'Please try again', replace: "t('notifications.tryAgain')" },
  { find: 'Your session has expired', replace: "t('notifications.sessionExpired')" },
  { find: 'Please log in to continue', replace: "t('notifications.loginRequired')" },
];

// Page-specific updates
export const pageUpdates = {
  'HomePage.jsx': {
    requiredImports: [
      "import { useLanguage } from '../contexts/LanguageContext';"
    ],
    hookAdditions: [
      "const { t } = useLanguage();"
    ],
    replacements: [
      { find: 'Discover Amazing Dog Adventures', replace: "t('home.welcomeTitle')" },
      { find: 'Join thousands of dog lovers sharing their incredible journeys, tips, and experiences from around the world.', replace: "t('home.welcomeSubtitle')" },
      { find: 'Get Started', replace: "t('home.getStarted')" },
      { find: 'Explore Stories', replace: "t('home.exploreStories')" },
      { find: 'Featured Stories', replace: "t('home.featuredStories')" },
      { find: 'Popular Destinations', replace: "t('home.popularDestinations')" },
      { find: 'Community Stats', replace: "t('home.communityStats')" },
      { find: 'Join Our Community', replace: "t('home.joinCommunity')" },
    ]
  },
  
  'StoriesPage.jsx': {
    requiredImports: [
      "import { useLanguage } from '../contexts/LanguageContext';"
    ],
    hookAdditions: [
      "const { t } = useLanguage();"
    ],
    replacements: [
      { find: 'All Stories', replace: "t('stories.stories')" },
      { find: 'Featured Stories', replace: "t('home.featuredStories')" },
      { find: 'Recent Stories', replace: "t('stories.recentStories')" },
      { find: 'No stories found', replace: "t('stories.noStories')" },
      { find: 'Read More', replace: "t('common.readMore')" },
      { find: 'Share', replace: "t('common.share')" },
    ]
  },
  
  'GalleryPage.jsx': {
    requiredImports: [
      "import { useLanguage } from '../contexts/LanguageContext';"
    ],
    hookAdditions: [
      "const { t } = useLanguage();"
    ],
    replacements: [
      { find: 'Photo Gallery', replace: "t('nav.gallery')" },
      { find: 'All Photos', replace: "t('gallery.allPhotos')" },
      { find: 'Recent Photos', replace: "t('gallery.recentPhotos')" },
      { find: 'Popular Photos', replace: "t('gallery.popularPhotos')" },
      { find: 'Upload Photo', replace: "t('gallery.uploadPhoto')" },
    ]
  },
  
  'ProfileModern.jsx': {
    requiredImports: [
      "import { useLanguage } from '../contexts/LanguageContext';"
    ],
    hookAdditions: [
      "const { t } = useLanguage();"
    ],
    replacements: [
      { find: 'Personal Information', replace: "t('profile.personalInfo')" },
      { find: 'Security Settings', replace: "t('profile.security')" },
      { find: 'My Activity', replace: "t('profile.activity')" },
      { find: 'Account Preferences', replace: "t('profile.preferences')" },
      { find: 'My Stories', replace: "t('profile.stories')" },
      { find: 'Change Avatar', replace: "t('profile.changeAvatar')" },
      { find: 'Change Password', replace: "t('profile.changePassword')" },
      { find: 'Current Password', replace: "t('profile.currentPassword')" },
      { find: 'New Password', replace: "t('profile.newPassword')" },
      { find: 'Two-Factor Authentication', replace: "t('profile.twoFactorAuth')" },
      { find: 'Enable 2FA', replace: "t('profile.enable2FA')" },
      { find: 'Disable 2FA', replace: "t('profile.disable2FA')" },
      { find: 'Active Sessions', replace: "t('profile.sessions')" },
      { find: 'Security Logs', replace: "t('profile.securityLogs')" },
      { find: 'Recent Activity', replace: "t('profile.recentActivity')" },
      { find: 'Account Statistics', replace: "t('profile.accountStats')" },
      { find: 'Language', replace: "t('profile.language')" },
      { find: 'Notifications', replace: "t('profile.notifications')" },
      { find: 'Privacy', replace: "t('profile.privacy')" },
      { find: 'Timezone', replace: "t('profile.timezone')" },
    ]
  }
};

// Helper function to apply updates to a file content
export const applyTranslationUpdates = (content, pageName) => {
  let updatedContent = content;
  
  // Apply common replacements
  commonReplacements.forEach(({ find, replace }) => {
    const regex = new RegExp(`['"\`]${find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]`, 'g');
    updatedContent = updatedContent.replace(regex, `{${replace}}`);
  });
  
  // Apply page-specific updates
  const pageUpdate = pageUpdates[pageName];
  if (pageUpdate) {
    pageUpdate.replacements.forEach(({ find, replace }) => {
      const regex = new RegExp(`['"\`]${find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]`, 'g');
      updatedContent = updatedContent.replace(regex, `{${replace}}`);
    });
  }
  
  return updatedContent;
};

// Helper function to add required imports and hooks
export const addRequiredImports = (content, pageName) => {
  let updatedContent = content;
  
  const pageUpdate = pageUpdates[pageName];
  if (pageUpdate) {
    // Add imports after existing imports
    const importRegex = /(import.*from.*['""];?\s*)+/;
    const match = updatedContent.match(importRegex);
    if (match) {
      const existingImports = match[0];
      const newImports = pageUpdate.requiredImports.join('\n');
      updatedContent = updatedContent.replace(existingImports, existingImports + newImports + '\n');
    }
    
    // Add hooks after component definition
    const componentRegex = /const\s+\w+\s*=\s*\(\s*\)\s*=>\s*{/;
    const componentMatch = updatedContent.match(componentRegex);
    if (componentMatch) {
      const componentDeclaration = componentMatch[0];
      const newHooks = '  ' + pageUpdate.hookAdditions.join('\n  ');
      updatedContent = updatedContent.replace(componentDeclaration, componentDeclaration + '\n' + newHooks + '\n');
    }
  }
  
  return updatedContent;
};

export default {
  commonReplacements,
  pageUpdates,
  applyTranslationUpdates,
  addRequiredImports
};