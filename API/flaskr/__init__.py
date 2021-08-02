import os
from flask import Flask
from flask_cors import CORS, cross_origin

def create_app(test_config=None):
        app = Flask(__name__, instance_relative_config=True)
        CORS(app)
        app.config.from_mapping(
                SECRET_KEY='dev',
                DATABASE=os.path.join(app.instance_path, 'flaskr.sqlite')       
        )
        if test_config is None:
                #Load the instance config, if it exists, when not testing
                app.config.from_pyfile('config.py',silent=True)
        else:
                app.config.from_mapping(test_config)
        #ensure the instance folder exists
        try:
                os.makedirs(app.instance_path)
        except OSError:
                pass

        from . import stix_taxii
        app.register_blueprint(stix_taxii.bp)
        return app
        

        