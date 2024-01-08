# Import dependencies
from flask import Flask, request
import logic
import json


# Create Flask application
app = Flask(__name__)


# Endpoint which accepts a search request
# Generates a SQL query using OpenAI API
# Runs this SQL query against the data warehouse
# Returns the response for the user request in JSON format
@app.route("/search-dwh", methods=["POST"])
def search_dwh():
    # Gets and extracts the value of user request from the JSON object
    request_usr = request.get_json()
    request_usr_val = request_usr['request']

    # Gets a SQL query generated using OpenAI API for the user request
    query = logic.get_query(request_usr_val)
    print(query) # Used for testing accuracy of the OpenAI model responses

    # Runs the SQL query against the data warehouse and gets a response
    # Returns this response in JSON format
    json_response = logic.get_dwh_result(query)
    return json.loads(json_response), 200


# Run Flask application
if __name__ == "__main__":
    app.run(debug=True)