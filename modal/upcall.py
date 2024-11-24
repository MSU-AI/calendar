from flask import Flask, jsonify

app = Flask(__name__)
# get the api to be called here 

@app.route('/api/data', methods=['GET'])
def get_data():
    return jsonify({'message': 'Hello from Python!'})

if __name__ == '__main__':
    app.run(port=5000)

