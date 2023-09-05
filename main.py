# import requirements needed
#\
# AU
from flask import Flask, render_template, request, redirect, url_for
from utils import get_base_url
import requests
import base64
import json
import operator
# import json

# setup the webserver
# port may need to be changed if there are multiple flask servers running on same server
port = 12345
base_url = get_base_url(port)
predictions = 'potato'
# if the base url is not empty, then the server is running in development, and we need to specify the static folder so that the static files are served
if base_url == '/':
  app = Flask(__name__)
else:
  app = Flask(__name__, static_url_path=base_url + 'static')


# set up the routes and logic for the webserver
@app.route(f'{base_url}')
def home():
  return render_template('index_3.html')


# define additional routes here
# for example:
# @app.route(f'{base_url}/team_members')
# def team_members():
#     return render_template('team_members.html') # would need to actually make this page


@app.route(f'{base_url}/save_canvas', methods=['POST'])
def save_canvas():
  image_data = request.files['image_data']

  # Generate a unique filename using UUID
  filename = "static/images/user_input.jpg"  # Change file extension

  # Save the Blob image data with the generated filename
  image_data.save(filename)
  print("Image saved successfully")

  # Read the image file in binary mode and encode in base64
  with open("static/images/user_input.jpg", "rb") as image_file:
    image = image_file.read()
    image_base64 = base64.b64encode(image).decode()

    url = "https://classify.roboflow.com/sketch.ai/2"
    params = {"api_key": "DXowKlPTjyCHv2wV6oEy"}

    headers = {"Content-Type": "application/x-www-form-urlencoded"}

    response = requests.post(url,
                             params=params,
                             data=image_base64,
                             headers=headers)

    if response.status_code == 200:
        predictions = response.json()['predictions']
        sorted_classes = sorted(predictions.items(), key=lambda x: x[1]['confidence'], reverse=True)
        class_confidence_list = []
        for class_name, class_data in sorted_classes:
          confidence = round(class_data['confidence'], 3)
          if class_name == 'baseballbat':
            class_name = 'baseball bat'
          elif class_name == 'coffee_cup':
            class_name = 'coffee cup'
          class_confidence_list.append([class_name, confidence])
      #[[class,confidence],[class,confidence]]
    
    else:
      print("Error:", response.text)

  print('END')
  # print(predictions)

  return render_template('index_predictions.html', predictions=class_confidence_list)
  # return ['index_predictions.html', predictions]
  # return redirect(url_for('index_predictions', predictions=predictions))


# @app.route(f'{base_url}/index_predictions')
# def index_predictions():
#   return render_template('index_predictions.html', predictions="predictions")

# @app.route(f'{base_url}/render_template/<template_name>')
# def render_template_from_js(template_name):
#     # Process any data or logic if needed
#     return render_template(template_name)

if __name__ == '__main__':
  # IMPORTANT: change url to the site where you are editing this file.
  # website_url = 'final-project-2023-summer-computer-vision-5.2023-summer-computer-vision.repl.co/'

  # print(f'Try to open\n\n    https://{website_url}' + base_url + '\n\n')
  app.run(host='0.0.0.0', port=port, debug=True)
