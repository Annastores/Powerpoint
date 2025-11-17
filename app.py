from flask import Flask, render_template, jsonify,request

app = Flask(__name__)

slides = {
    "1": { "type": "video", "src": "/static/videos/1.mp4" },
    "2": { "type": "video", "src": "/static/videos/2.mp4" },
    "3": { "type": "video", "src": "/static/videos/3.mp4" },
    "4": { "type": "video", "src": "/static/videos/4.mp4" },
    "5": { "type": "video", "src": "/static/videos/5.mp4" },
    "6": { "type": "video", "src": "/static/videos/6.mp4" },
    "7": { "type": "video", "src": "/static/videos/7.mp4" },
    "8": { "type": "video", "src": "/static/videos/8.mp4" },
    "9": { "type": "video", "src": "/static/videos/9.mp4" },
    "10": { "type": "video", "src": "/static/videos/10.mp4" },
    "10": { "type": "video", "src": "/static/videos/10b.mp4" },
    "12": { "type": "video", "src": "/static/videos/11.mp4" },
    "13": { "type": "video", "src": "/static/videos/12.mp4" },


}
current_slide = 0

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/slides')
def get_slides():
    return jsonify(slides)
@app.route("/currentSlide")
def get_slide():
    return jsonify({"slide": current_slide})
@app.route("/setSlide", methods=["POST"])
def set_slide():
    global current_slide
    data = request.get_json()
    current_slide = data["slide"]
    print(current_slide)
    return "ok"
@app.route("/control")
def control():
    return render_template("control.html")
@app.route("/setSlide2", methods=["POST", "GET"])
def set_slide2():
    global current_slide
    slide_num = request.args.get("slide")
    if slide_num is not None:
        if slide_num == 10 or slide_num == "10":
            current_slide -=1
        elif slide_num == 15 or slide_num == "15":
            current_slide = 0
        else:
             
             current_slide +=1
       
        return jsonify({"status": "ok", "current_slide": current_slide})
    return jsonify({"status": "error", "message": "slide parameter missing"})
if __name__ == '__main__':
    port = 5000
    app.run(host="0.0.0.0", port=port)

