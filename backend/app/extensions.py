from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_login import LoginManager
from flask_mail import Mail
from flask_migrate import Migrate
# JWT removed - using Flask-Login sessions only
from authlib.integrations.flask_client import OAuth

db = SQLAlchemy()
cors = CORS()
login_manager = LoginManager()
mail = Mail()
migrate = Migrate()
# JWT removed - using Flask-Login sessions only
oauth = OAuth()