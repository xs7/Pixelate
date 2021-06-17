import SLIC from "./SLIC.js"
import "../css/index.css"
import dat from "./dat.gui.min.js"
import exampleImage from '../images/portraits.jpg'

var filedom = document.getElementById('filebtn')
let canvas = document.getElementById("canvas")
let loadingbox = document.getElementById("loadingbox")
let context = canvas.getContext("2d")
let canvas_centers = document.getElementById("canvas_centers")
let context_centers = canvas_centers.getContext("2d")
let canvas_contours = document.getElementById("canvas_contours")
let context_contours = canvas_contours.getContext("2d")
var padtext
/* canvas.onclick = function (event) {
   // console.log(click)
    let x = event.offsetX
    let y = event.offsetY
    let imageData = context.getImageData(x, y, 1, 1)
    // 获取该点像素数据
    let pixel = imageData.data
    let r = pixel[0]
    let g = pixel[1]
    let b = pixel[2]
    let a = pixel[3] / 255

    let rHex = r.toString(16)
    r < 16 && (rHex = "0" + rHex)
    let gHex = g.toString(16)
    g < 16 && (gHex = "0" + gHex)
    let bHex = b.toString(16)
    b < 16 && (bHex = "0" + bHex)
    let rgbaColor = "rgba(" + r + "," + g + "," + b + "," + a + ")"
    let rgbColor = "rgb(" + r + "," + g + "," + b + ")"
    let hexColor = "#" + rHex + gHex + bHex
    let result = {
        rgba: rgbaColor,
        rgb: rgbColor,
        hex: hexColor,
        r: r,
        g: g,
        b: b,
        a: a
    }
    console.log(result.r,result.g,result,b)
}
 */

//Init data and result

let config = {
    blockSize: 20,
    weight: 30,
    iters: 10,
    stride: 10,
    withGrid: true,
    withCenters: false,
    withContours: false,
}
// let weight = 30
// let iters = 10
// let stride = 10
// var withGrid = false
// var withContours = false
// var withCenters = false
var pixelImage
var slic
let filename = "portraits"
let filetype = "image/jpeg"



//paiting pixel in canvas
function displayImg() {
    let imgData = context.createImageData(canvas.width, canvas.height)
    for (let i = 0; i < pixelImage.length; i++)
        imgData.data[i] = pixelImage[i]
    context.putImageData(imgData, 0, 0)

    if (config.withGrid) {
        context.strokeStyle = "white"
        context.lineWidth = 1
        for (let i = 0; i < canvas.width; i += config.stride) {
            context.beginPath()
            context.moveTo(i, 0)
            context.lineTo(i, canvas.height)
            context.stroke()
        }
        for (let i = 0; i < canvas.height; i += config.stride) {
            context.beginPath()
            context.moveTo(0, i)
            context.lineTo(canvas.width, i)
            context.stroke()
        }
    }
}

function displayCenters() {
    if (config.withCenters) {
        canvas_centers.style.display = "block"
        canvas_centers.width = canvas_centers.width
        slic.showCenters(context_centers)
    } else {
        canvas_centers.style.display = "none"
    }

}
function displayContours() {
    if (config.withContours) {
        canvas_contours.style.display = "block"
        canvas_contours.width = canvas_contours.width
        slic.showContours(context_contours)
    } else {
        canvas_contours.style.display = "none"
    }
}

function dealImg(img) {
    canvas.width = img.width
    canvas.height = img.height
    canvas.style.width = img.width + "px"
    canvas.style.height = img.height + "px"
    canvas.style.marginLeft = (-img.width / 2) + "px"
    canvas.style.marginTop = (-img.height / 2) + "px"

    canvas_centers.width = img.width
    canvas_centers.height = img.height
    canvas_centers.style.width = img.width + "px"
    canvas_centers.style.height = img.height + "px"
    canvas_centers.style.marginLeft = (-img.width / 2) + "px"
    canvas_centers.style.marginTop = (-img.height / 2) + "px"

    canvas_contours.width = img.width
    canvas_contours.height = img.height
    canvas_contours.style.width = img.width + "px"
    canvas_contours.style.height = img.height + "px"
    canvas_contours.style.marginLeft = (-img.width / 2) + "px"
    canvas_contours.style.marginTop = (-img.height / 2) + "px"

    context.drawImage(img, 0, 0, canvas.width, canvas.height)

    let canvasData = context.getImageData(0, 0, canvas.width, canvas.height)
    let binaryData = canvasData.data
    let nr_superpixels = 500
    config.blockSize = padtext.blockSize = Math.round(Math.sqrt((canvas.width * canvas.height) / nr_superpixels))
    console.log("blockSize: ", padtext.blockSize)
    slic = new SLIC(binaryData, canvas.width, canvas.height)
    pixelImage = slic.pixelDeal(config.blockSize, config.iters, config.stride, config.weight)
    displayImg()

}


function initGUI() {
    //GUI
    var padText = function () {
        this['Upload Image'] = function () {
            console.log("upload image")
            filedom.click()
        }
        this.blockSize = config.blockSize
        this.weight = config.weight
        this.iters = config.iters
        this.stride = config.stride
        this.grid = config.withGrid
        this.Centers = config.withCenters
        this.Contours = config.withContours
        this['Export image'] = function () {

            var MIME_TYPE = filetype
            var imgURL = canvas.toDataURL(filetype)
            var link = document.createElement('a')
            link.download = filename
            link.href = imgURL
            link.dataset.downloadurl = [MIME_TYPE, link.download, link.href].join(':')
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        }
    }

    //GUI
    padtext = new padText()
    var gui = new dat.GUI()
    gui.add(padtext, 'Upload Image')


    // iters
    var iters_controller = gui.add(padtext, 'iters', 5, 20)
    iters_controller.onFinishChange(function (value) {
        console.log("new iters: ", Math.round(value))
        if (slic == undefined) {
            alert("Upload image first")
        }
        else {
            pixelImage = slic.changeIters(Math.round(value))
            displayImg()
            displayCenters()
            displayContours()

        }
    })

    //stride for pixel
    var stride_controller = gui.add(padtext, 'stride', 5, 20)
    stride_controller.onFinishChange(function (value) {
        console.log("new stride: ", Math.round(value))
        if (slic == undefined) {
            alert("Upload image first")
        } else {
            config.stride = Math.round(value)
            pixelImage = slic.changeStride(config.stride)
            displayImg()
        }
    })

    //blocksize
    var blockSize_controller = gui.add(padtext, 'blockSize', 10, 30)
    blockSize_controller.listen()
    blockSize_controller.onFinishChange(function (value) {
        console.log("new blockSize: ", Math.round(value))
        if (slic == undefined) {
            alert("Upload image first")
        } else {
            pixelImage = slic.changeBlockSize(Math.round(value))
            displayImg()
            displayCenters()
            displayContours()
        }
    })

    padtext.blockSize = 9

    //weight
    var weight_controller = gui.add(padtext, 'weight', 1, 40)
    weight_controller.onFinishChange(function (value) {
        console.log("new iters: ", Math.round(value))
        if (slic == undefined) {
            alert("Upload image first")
        }
        else {
            pixelImage = slic.changeWeight(Math.round(value))
            displayImg()
            displayCenters()
            displayContours()
        }
    })

    padtext.weight = 8

    //grid
    var grid_controller = gui.add(padtext, 'grid')
    grid_controller.onFinishChange(function (value) {
        console.log(value)
        config.withGrid = value
        displayImg()
    })

    //centers
    var centers_controller = gui.add(padtext, 'Centers')
    centers_controller.onFinishChange(function (value) {
        console.log(value)
        config.withCenters = value
        displayCenters(value)
    })


    //contours
    var contours_controller = gui.add(padtext, 'Contours')
    contours_controller.onFinishChange(function (value) {
        console.log(value)
        config.withContours = value
        displayContours(value)
    })

    //dowload img
    gui.add(padtext, 'Export image')


    // read file 
    filedom.addEventListener("change", function (e) {
        let f = this.files[0]
        filename = f.name
        filetype = f.type
        if (!f.type.match("image.*")) {
            return
        }
        let reader = new FileReader()
        reader.onload = function (event) {
            let bytes = this.result
            let img = new Image()
            img.src = "" + bytes
            img.onload = function () {
                dealImg(img)
            }
        }
        reader.readAsDataURL(f)
    })
}

function hidden(dom,flag) {
    if (flag)
        dom.className = 'hidden'
    else
        dom.className = ''
}

window.onload = function () {
    initGUI()
    hidden(loadingbox,false)
    let img = new Image()
    img.src = exampleImage
    img.onload = function () {
        dealImg(img)
        hidden(canvas,false)
        hidden(loadingbox,true)
    }

}
